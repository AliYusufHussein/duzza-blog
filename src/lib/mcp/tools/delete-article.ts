import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "delete_article",
  title: "Delete article",
  description: "Permanently delete one of the signed-in user's articles by id.",
  inputSchema: { id: z.string().describe("The article id to delete.") },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("articles").delete().eq("id", id).select("id");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data || data.length === 0) {
      return { content: [{ type: "text", text: `No article found with id ${id}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Deleted article ${id}` }],
      structuredContent: { deleted_id: id },
    };
  },
});
