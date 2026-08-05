import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listArticlesTool from "./tools/list-articles";
import getArticleTool from "./tools/get-article";
import createArticleTool from "./tools/create-article";
import updateArticleTool from "./tools/update-article";
import deleteArticleTool from "./tools/delete-article";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "blogger-finalizer",
  title: "Blogger Finalizer",
  version: "0.1.0",
  instructions:
    "Tools for Blogger Finalizer, a content polishing and repurposing workspace. Use `list_articles` to browse the signed-in user's articles, `get_article` to read one in full (draft, polished text, SEO data, repurposed platform content), and `create_article` / `update_article` / `delete_article` to manage them.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listArticlesTool, getArticleTool, createArticleTool, updateArticleTool, deleteArticleTool],
});
