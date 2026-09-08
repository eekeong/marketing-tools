import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

// Server-only client — uses the secret key which bypasses RLS.
// Never import this file from a "use client" component.
export const supabaseAdmin = createClient(url, secretKey, {
  auth: { persistSession: false },
});
