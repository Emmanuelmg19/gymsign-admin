import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falla rápido y con un mensaje claro en vez de errores crípticos
  // más adelante en el flujo de registro.
  throw new Error(
    "Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalo."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
