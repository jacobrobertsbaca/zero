import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey = process.env.SUPABASE_SERVER_KEY;

/* Supabase admin client for server use */
export const supabase = createClient(supabaseUrl!, supabaseServerKey!);