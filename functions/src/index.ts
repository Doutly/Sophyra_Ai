import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { Request, Response } from 'express';

admin.initializeApp();
const db = admin.firestore();

// ─── CORS helper ────────────────────────────────────────────────────────────
function setCors(res: Response) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
}

// ─── ElevenLabs Signed URL (callable) ───────────────────────────────────────
export const getElevenLabsSignedUrl = functions
  .https.onCall(async (data: any, _context: functions.https.CallableContext) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const defaultAgentId = process.env.ELEVENLABS_AGENT_ID || 'agent_6401kf6a3faqejpbsks4a5h1j3da';

    if (!apiKey) {
      throw new functions.https.HttpsError('internal', 'ElevenLabs API key not configured');
    }

    const agentId = data?.agentId || defaultAgentId;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new functions.https.HttpsError('internal', `ElevenLabs API error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    return { signed_url: result.signed_url };
  });

// ─── Simli Session Token ────────────────────────────────────────────────────
export const getSimliSessionToken = functions
  .https.onRequest(async (req: Request, res: Response) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const apiKey = process.env.SIMLI_API_KEY || 'ke47f43byck10xged4tx7rf';
      const faceId = process.env.SIMLI_FACE_ID || 'cace3ef7-a4c4-425d-a8cf-a5358eb0c427';

      const response = await fetch('https://api.simli.ai/compose/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-simli-api-key': apiKey,
        },
        body: JSON.stringify({
          faceId,
          handleSilence: true,
          maxSessionLength: 600,
          maxIdleTime: 180,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        res.status(500).json({ error: `Simli API error ${response.status}: ${errText}` });
        return;
      }

      const result = await response.json();
      if (!result.session_token) {
        res.status(500).json({ error: 'No session token in Simli response' });
        return;
      }

      res.status(200).json({ session_token: result.session_token });
    } catch (err) {
      console.error('getSimliSessionToken error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// ─── Gemini Proxy (keeps API key server-side) ───────────────────────────────
export const geminiProxy = functions
  .https.onRequest(async (req: Request, res: Response) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        res.status(500).json({ error: 'Gemini API key not configured' });
        return;
      }

      const { prompt, temperature = 0.4, maxOutputTokens = 2048, model = 'gemini-1.5-flash' } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Missing prompt in request body' });
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        res.status(response.status).json({ error: `Gemini API error: ${errText}` });
        return;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      res.status(200).json({ text });
    } catch (err) {
      console.error('geminiProxy error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// ─── ElevenLabs TTS Proxy (keeps API key server-side) ───────────────────────
export const elevenLabsTTSProxy = functions
  .https.onRequest(async (req: Request, res: Response) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'ElevenLabs API key not configured' });
        return;
      }

      const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL', voiceSettings } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Missing text in request body' });
        return;
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: voiceSettings || {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        res.status(response.status).json({ error: `ElevenLabs TTS error: ${errText}` });
        return;
      }

      const audioBuffer = await response.arrayBuffer();
      res.set('Content-Type', 'audio/mpeg');
      res.status(200).send(Buffer.from(audioBuffer));
    } catch (err) {
      console.error('elevenLabsTTSProxy error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// ─── ElevenLabs Voices List Proxy ───────────────────────────────────────────
export const elevenLabsVoicesProxy = functions
  .https.onRequest(async (req: Request, res: Response) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'ElevenLabs API key not configured' });
        return;
      }

      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey },
      });

      if (!response.ok) {
        const errText = await response.text();
        res.status(response.status).json({ error: `ElevenLabs error: ${errText}` });
        return;
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (err) {
      console.error('elevenLabsVoicesProxy error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// ─── Delete User (Admin only) ────────────────────────────────────────────────
export const deleteUser = functions
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const callerRecord = await admin.auth().getUser(context.auth.uid);
    const callerEmail = callerRecord.email || '';
    const adminEmail = process.env.ADMIN_EMAIL || '';

    if (callerEmail !== adminEmail) {
      throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }

    const { uid } = data;
    if (!uid) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing uid');
    }

    await db.collection('users').doc(uid).delete();
    await admin.auth().deleteUser(uid);

    return { success: true };
  });

// ─── ElevenLabs Webhook ─────────────────────────────────────────────────────
export const elevenLabsWebhook = functions
  .https.onRequest(async (req: Request, res: Response) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const rawBody = JSON.stringify(req.body);
      const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

      if (webhookSecret) {
        const signatureHeader = req.headers['elevenlabs-signature'] as string | undefined;
        if (!signatureHeader) {
          res.status(401).json({ error: 'Missing signature' });
          return;
        }

        const parts = signatureHeader.split(',');
        const tPart = parts.find((p) => p.startsWith('t='));
        const v0Part = parts.find((p) => p.startsWith('v0='));

        if (!tPart || !v0Part) {
          res.status(401).json({ error: 'Invalid signature format' });
          return;
        }

        const timestamp = tPart.slice(2);
        const receivedSig = v0Part.slice(3);
        const payload = `${timestamp}.${rawBody}`;
        const computedSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(payload)
          .digest('hex');

        if (computedSig !== receivedSig) {
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      }

      const event = req.body;

      if (event.type !== 'post_call_transcription') {
        res.status(200).json({ received: true, skipped: true });
        return;
      }

      const data = event.data || {};
      const conversationId = data.conversation_id;
      const agentId = data.agent_id;
      const status = data.status || 'done';
      const transcript = data.transcript || [];
      const analysis = data.analysis || {};
      const metadata = data.metadata || {};
      const dynamicVariables =
        data.conversation_initiation_client_data?.dynamic_variables || {};
      const callDurationSecs = metadata.call_duration_secs || 0;

      if (!conversationId) {
        res.status(400).json({ error: 'Missing conversation_id' });
        return;
      }

      await db
        .collection('interview_transcripts')
        .doc(conversationId)
        .set(
          {
            agent_id: agentId || '',
            conversation_id: conversationId,
            status,
            transcript,
            analysis,
            metadata,
            dynamic_variables: dynamicVariables,
            call_duration_secs: callDurationSecs,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      const sessionsSnapshot = await db
        .collection('sessions')
        .where('elevenLabsConversationId', '==', conversationId)
        .limit(1)
        .get();

      if (!sessionsSnapshot.empty) {
        const sessionDoc = sessionsSnapshot.docs[0];
        await sessionDoc.ref.update({
          transcriptId: conversationId,
          transcriptReady: true,
        });
      }

      res.status(200).json({ received: true, conversation_id: conversationId });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
