import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const getElevenLabsSignedUrl = functions
  .runWith({ secrets: ['ELEVENLABS_API_KEY', 'ELEVENLABS_AGENT_ID'] })
  .https.onCall(async (data, context) => {
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

export const getSimliSessionToken = functions
  .runWith({ secrets: ['SIMLI_API_KEY', 'SIMLI_FACE_ID'] })
  .https.onCall(async (_data, _context) => {
    const apiKey = process.env.SIMLI_API_KEY;
    const faceId = process.env.SIMLI_FACE_ID;

    if (!apiKey || !faceId) {
      throw new functions.https.HttpsError('internal', 'Simli credentials not configured');
    }

    const response = await fetch('https://api.simli.ai/startAudioToVideoSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        faceId,
        handleSilence: true,
        maxSessionLength: 600,
        maxIdleTime: 180,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new functions.https.HttpsError('internal', `Simli API error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    if (!result.session_token) {
      throw new functions.https.HttpsError('internal', 'No session token in Simli response');
    }

    return { session_token: result.session_token };
  });

export const elevenLabsWebhook = functions
  .runWith({ secrets: ['ELEVENLABS_WEBHOOK_SECRET'] })
  .https.onRequest(async (req, res) => {
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') {
      res.status(200).send();
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
