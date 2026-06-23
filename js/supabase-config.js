window.SANCTUARY_CONFIG = {
  SUPABASE_URL: 'https://tphsfjkqvbddxnisryfb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaHNmamtxdmJkZHhuaXNyeWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjc3NzYsImV4cCI6MjA5Nzc0Mzc3Nn0.mL1AdCrxIfKV9rpTSiWMvq4FHEo8qgQuAcFr9wCUOzY',
};

window.isSanctuaryConfigured = function isSanctuaryConfigured() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SANCTUARY_CONFIG;
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_SUPABASE') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE')
  );
};
