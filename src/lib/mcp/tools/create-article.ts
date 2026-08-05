import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_article",
  title: "Create article",
  description:
    "Create a new draft article for the signed-in user with an optional title, draft body and target keyword.",
  inputSchema: {
    title: z.string().optional().describe("Article title."),
    draft: z.string().optional().describe("Raw draft body text."),
    target_keyword: z.string().optional().describe("Primary SEO keyword."),
    category: z.string().optional().describe("Article category."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, draft, target_keyword, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const insert: Record<string, unknown> = { user_id: ctx.getUserId() };
    if (title !== undefined) insert.title = title;
    if (draft !== undefined) insert.draft = draft;
    if (target_keyword !== undefined) insert.target_keyword = target_keyword;
    if (category !== undefined) insert.category = category;
    const { data, error } = await supabase.from("articles").insert(insert).select("*").single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { article: data },
    };
  },
});
