/*
  # Store ElevenLabs Webhook Secret in Supabase Vault

  Stores the webhook signing secret so the elevenlabs-webhook edge function
  can verify that incoming requests are genuinely from ElevenLabs.
*/

SELECT vault.create_secret(
  'wsec_8df2960eba42995f51ea1b287c9e5be7cf64f0924a96bdc9ec3642ee509b8341',
  'ELEVENLABS_WEBHOOK_SECRET'
) WHERE NOT EXISTS (
  SELECT 1 FROM vault.secrets WHERE name = 'ELEVENLABS_WEBHOOK_SECRET'
);
