import { supabase } from "@/integrations/supabase/client";
import { callAI } from "@/server/ai";

export async function runAI(system: string, user: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");
  const res = await callAI({
    data: { system, user },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return res.text;
}
