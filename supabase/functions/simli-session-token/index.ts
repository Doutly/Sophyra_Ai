import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const SIMLI_API_KEY = Deno.env.get("SIMLI_API_KEY");
    const SIMLI_FACE_ID = Deno.env.get("SIMLI_FACE_ID");

    if (!SIMLI_API_KEY || !SIMLI_FACE_ID) {
      return new Response(
        JSON.stringify({ error: "Simli configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let faceId = SIMLI_FACE_ID;
    let maxSessionLength = 600;
    let maxIdleTime = 180;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.faceId) faceId = body.faceId;
        if (body.maxSessionLength) maxSessionLength = body.maxSessionLength;
        if (body.maxIdleTime) maxIdleTime = body.maxIdleTime;
      } catch {
        // use defaults
      }
    }

    const response = await fetch("https://api.simli.ai/startAudioToVideoSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: SIMLI_API_KEY,
        faceId,
        handleSilence: true,
        maxSessionLength,
        maxIdleTime,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Failed to create Simli session", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ session_token: data.session_token }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
