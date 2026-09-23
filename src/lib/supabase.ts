// Зорька. Supabase-клиент. Правило 02-architecture: UI не трогает SDK напрямую —
// только через repositories в src/data.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !publishableKey) {
  throw new Error(
    "Supabase не сконфигурирован: задайте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в .env",
  );
}

export const supabase = createClient(supabaseUrl, publishableKey);
