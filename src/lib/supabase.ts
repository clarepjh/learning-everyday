import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function validateSupabaseConfig(
  url: string | undefined,
  key: string | undefined,
) {
  if (!url?.trim() || !key?.trim()) {
    return "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart the app.";
  }

  try {
    const parsedUrl = new URL(url);
    const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(
      parsedUrl.hostname,
    );
    if (
      (!localHost && parsedUrl.protocol !== "https:") ||
      (localHost && !["https:", "http:"].includes(parsedUrl.protocol)) ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return "VITE_SUPABASE_URL must be a valid HTTPS URL.";
    }
  } catch {
    return "VITE_SUPABASE_URL must be a valid HTTPS URL.";
  }

  return null;
}

export const supabaseConfigError = validateSupabaseConfig(
  supabaseUrl,
  supabasePublishableKey,
);

export const supabase =
  supabaseConfigError || !supabaseUrl || !supabasePublishableKey
    ? null
    : createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
