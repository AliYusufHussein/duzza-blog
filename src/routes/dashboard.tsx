import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { listArticles, createArticle, deleteArticle } from "@/lib/articles";
import { BfButton, Card, Spinner } from "@/components/bf-ui";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type InboxRow = {
  id: string;
  title: string;
  article: string;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "My Articles — Blogger Finalizer" }] }),
});

function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [user, authLoading, nav]);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles", user?.id],
    queryFn: () => listArticles(user!.id),
    enabled: !!user,
  });

  const createMut = useMutation({
    mutationFn: () => createArticle(user!.id),
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ["articles", user?.id] });
      nav({ to: "/editor/$id", params: { id: a.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: inbox = [] } = useQuery({
    queryKey: ["polisher_inbox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polisher_inbox" as never)
        .select("id, title, article, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InboxRow[];
    },
    enabled: !!user,
  });

  const openInboxMut = useMutation({
    mutationFn: async (row: InboxRow) => {
      const { error: updErr } = await supabase
        .from("polisher_inbox" as never)
        .update({ status: "opened" } as never)
        .eq("id", row.id);
      if (updErr) throw updErr;
      const { data, error } = await supabase
        .from("articles")
        .insert({
          user_id: user!.id,
          title: row.title || "",
          draft: row.article || "",
          status: "draft",
          step: 0,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ["polisher_inbox"] });
      qc.invalidateQueries({ queryKey: ["articles", user?.id] });
      nav({ to: "/editor/$id", params: { id: a.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading..." />
      </div>
    );
  }

  const drafts = articles.filter((a) => a.status !== "published");
  const published = articles.filter((a) => a.status === "published");
  const stageLabels = ["Draft", "Polished", "SEO Done", "Ready"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="font-display text-xl font-bold text-accent">
          ✦ Blogger Finalizer
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">👤 {user.email}</span>
          <BfButton variant="ghost" onClick={() => { signOut(); nav({ to: "/login" }); }} className="px-3 py-1.5 text-xs">
            Sign Out
          </BfButton>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl">My Articles</h1>
          <BfButton onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            + New Article
          </BfButton>
        </div>

        <Section title={`Inbox (${inbox.length})`}>
          {inbox.length === 0 ? (
            <div className="py-3 text-sm text-muted-foreground">No new articles from Generator</div>
          ) : (
            inbox.map((row) => (
              <div key={row.id} className="flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="truncate font-display text-[15px]">{row.title || "Untitled"}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    From Generator · {new Date(row.created_at).toLocaleString()}
                  </div>
                </div>
                <BfButton
                  onClick={() => openInboxMut.mutate(row)}
                  disabled={openInboxMut.isPending}
                  className="px-3 py-1.5 text-xs"
                >
                  Open →
                </BfButton>
              </div>
            ))
          )}
        </Section>

        {isLoading ? (
          <Spinner label="Loading articles..." />
        ) : articles.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-4xl mb-3">✍️</div>
            <div className="text-muted-foreground">No articles yet — start your first one!</div>
          </Card>
        ) : (
          <>
            {drafts.length > 0 && (
              <Section title={`In Progress (${drafts.length})`}>
                {drafts.map((a) => (
                  <Row
                    key={a.id}
                    a={a}
                    stage={stageLabels[Math.min(a.step ?? 0, 3)]}
                    onDelete={() => {
                      if (confirm("Delete this article? This cannot be undone.")) deleteMut.mutate(a.id);
                    }}
                  />
                ))}
              </Section>
            )}
            {published.length > 0 && (
              <Section title={`Published (${published.length})`}>
                {published.map((a) => (
                  <Row
                    key={a.id}
                    a={a}
                    stage="Published"
                    onDelete={() => {
                      if (confirm("Delete this article? This cannot be undone.")) deleteMut.mutate(a.id);
                    }}
                  />
                ))}
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="mb-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{title}</div>
      <Card className="p-0 px-4">{children}</Card>
    </div>
  );
}

function Row({
  a,
  stage,
  onDelete,
}: {
  a: { id: string; title: string; category: string; updated_at: string; status: string };
  stage: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="truncate font-display text-[15px]">{a.title || "Untitled"}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {a.category} · {stage} · {new Date(a.updated_at).toLocaleDateString()}
        </div>
      </div>
      <span
        className={`text-[10px] rounded-full px-2 py-0.5 border whitespace-nowrap ${
          a.status === "published"
            ? "bg-success/10 text-success border-success/30"
            : "bg-secondary text-accent border-border"
        }`}
      >
        {a.status === "published" ? "Published" : "Draft"}
      </span>
      <Link
        to="/editor/$id"
        params={{ id: a.id }}
        className="rounded-md bg-secondary px-3 py-1.5 text-xs text-accent hover:bg-secondary/70 transition-colors"
      >
        Open
      </Link>
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive text-lg leading-none px-1">
        ×
      </button>
    </div>
  );
}
