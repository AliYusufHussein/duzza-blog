import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_article",
  title: "Update article",
  description:
    "Update fields on one of the signed-in user's articles, such as the title, draft, polished text, status or workflow step.",
  inputSchema: {
    id: z.string().describe("The article id to update."),
    title: z.string().optional().describe("New title."),
    draft: z.string().optional().describe("New raw draft body."),
    polished: z.string().optional().describe("New polished body."),
    status: z.string().optional().describe("New status, e.g. 'draft', 'published' or 'completed'."),
    step: z.number().int().optional().describe("Workflow step index (0 = draft)."),
    target_keyword: z.string().optional().describe("New primary SEO keyword."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ id, ...patch }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const updates = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    ) as Record<string, unknown>;
    if (Object.keys(updates).length === 0) {
      return { content: [{ type: "text", text: "No fields to update" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("articles")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No article found with id ${id}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { article: data },
    };
  },
});
