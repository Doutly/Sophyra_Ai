/*
  # Store ElevenLabs secrets in Supabase Vault

  Stores the ElevenLabs API key and Agent ID so edge functions can access them
  via Deno.env.get() as ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID.
*/

SELECT vault.create_secret(
  '3962ab55c2cce53b25a1777ffb58e2dc8ea7eb3cd7a6f2c18e94dcd3c384e5e2',
  'ELEVENLABS_API_KEY'
) WHERE NOT EXISTS (
  SELECT 1 FROM vault.secrets WHERE name = 'ELEVENLABS_API_KEY'
);

SELECT vault.create_secret(
  'agent_6401kf6a3faqejpbsks4a5f1j3da',
  'ELEVENLABS_AGENT_ID'
) WHERE NOT EXISTS (
  SELECT 1 FROM vault.secrets WHERE name = 'ELEVENLABS_AGENT_ID'
);
