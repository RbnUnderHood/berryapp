// supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPA_URL = "https://lbeepnoyaxilwwqxtmoi.supabase.co";
export const SUPA_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZWVwbm95YXhpbHd3cXh0bW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1Njk1MDcsImV4cCI6MjA3NDE0NTUwN30.m7ROY7P6y9jogh1skLGYVC9GZIbU9ZFEkqErjzJ-8d8";

export const supabase = createClient(SUPA_URL, SUPA_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});
