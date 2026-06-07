import { callAI } from "@/lib/ai.functions";

export async function runAI(system: string, user: string): Promise<string> {
  const res = await callAI({ data: { system, user } });
  return res.text;
}
