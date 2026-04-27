import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AiInput = { system: string; user: string; model?: string };

export const callAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AiInput) => {
    if (!input || typeof input.system !== "string" || typeof input.user !== "string") {
      throw new Error("Invalid input");
    }
    if (input.system.length > 8000 || input.user.length > 60000) {
      throw new Error("Input too large");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: data.model || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: data.system },
          { role: "user", content: data.user },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace.");
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI gateway error: ${res.status} ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";
    return { text };
  });
