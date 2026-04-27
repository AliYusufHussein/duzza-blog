import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Article = Tables<"articles">;
export type SeoData = {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  suggestedTags: string[];
  readabilityScore: string;
  seoTips: string[];
};

export async function listArticles(userId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createArticle(userId: string): Promise<Article> {
  const insert: TablesInsert<"articles"> = { user_id: userId };
  const { data, error } = await supabase.from("articles").insert(insert).select("*").single();
  if (error) throw error;
  return data;
}

export async function getArticle(id: string): Promise<Article | null> {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateArticle(id: string, patch: TablesUpdate<"articles">): Promise<Article> {
  const { data, error } = await supabase.from("articles").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}
