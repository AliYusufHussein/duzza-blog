import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SHARED_SECRET = "duzza_polisher_secret_2026";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body?.secret !== SHARED_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { campaign_id, title, article, extraction } = body;
  if (typeof title !== "string" || typeof article !== "string") {
    return json({ error: "Missing required fields: title, article" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("polisher_inbox")
    .insert({
      campaign_id: campaign_id ?? null,
      title,
      article,
      extraction: extraction ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Insert failed:", error);
    return json({ error: error.message }, 500);
  }

  return json({ success: true, inbox_id: data.id });
});
