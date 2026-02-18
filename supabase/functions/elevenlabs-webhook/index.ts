import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, elevenlabs-signature",
};

async function verifySignature(body: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(",");
  const tPart = parts.find((p) => p.startsWith("t="));
  const v0Part = parts.find((p) => p.startsWith("v0="));

  if (!tPart || !v0Part) return false;

  const timestamp = tPart.slice(2);
  const receivedSig = v0Part.slice(3);

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSig === receivedSig;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();

    const webhookSecret = Deno.env.get("ELEVENLABS_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signatureHeader = req.headers.get("elevenlabs-signature");
      const valid = await verifySignature(body, signatureHeader, webhookSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event.type !== "post_call_transcription") {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = event.data;
    const conversationId = data?.conversation_id;
    const agentId = data?.agent_id;
    const status = data?.status || "done";
    const transcript = data?.transcript || [];
    const analysis = data?.analysis || {};
    const metadata = data?.metadata || {};
    const dynamicVariables =
      data?.conversation_initiation_client_data?.dynamic_variables || {};
    const callDurationSecs = metadata?.call_duration_secs || 0;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: upsertError } = await supabase
      .from("interview_transcripts")
      .upsert(
        {
          agent_id: agentId || "",
          conversation_id: conversationId,
          status,
          transcript,
          analysis,
          metadata,
          dynamic_variables: dynamicVariables,
          call_duration_secs: callDurationSecs,
        },
        { onConflict: "conversation_id" }
      );

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true, conversation_id: conversationId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
