import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_articles",
  title: "List articles",
  description:
    "List the signed-in user's articles with their id, title, status, workflow step and last update time.",
  inputSchema: {
    status: z
      .string()
      .optional()
      .describe("Optional status filter, e.g. 'draft', 'published' or 'completed'."),
    limit: z.number().int().optional().describe("Maximum number of articles to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const max = Math.min(Math.max(limit ?? 25, 1), 100);
    let query = supabase
      .from("articles")
      .select("id, title, status, step, category, target_keyword, updated_at")
      .order("updated_at", { ascending: false })
      .limit(max);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { articles: data ?? [] },
    };
  },
});
