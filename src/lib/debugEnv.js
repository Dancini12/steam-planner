export function debugEnv() {
  console.log("==== DEBUG ENV ====");
  console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log("===================");
}
