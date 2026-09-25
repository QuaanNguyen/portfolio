import { createClient } from "@supabase/supabase-js";

const supabaseURL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_KEY;

const supabase =
  supabaseURL && supabasePublishableKey
    ? createClient(supabaseURL, supabasePublishableKey)
    : {
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: null,
                  error: new Error("Supabase is not configured."),
                }),
            }),
          }),
        }),
      };

export default supabase;