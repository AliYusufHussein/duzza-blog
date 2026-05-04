import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { getArticle, updateArticle, type SeoData } from "@/lib/articles";
import { runAI } from "@/lib/ai-client";
import { BfButton, Card, Field, Spinner, inputClass } from "@/components/bf-ui";
import { toast } from "sonner";
import { PLATFORMS, PLATFORM_PROMPTS, type PlatformId, type RepurposedMap } from "@/lib/repurpose-prompts";
import {
  copyText,
  copyHtml,
  downloadHtmlFile,
  downloadDocxFromHtml,
  downloadDocxFromText,
  downloadPdfFromHtml,
  downloadPdfFromText,
  downloadCarouselZip,
} from "@/lib/exporters";

const CAROUSEL_PLATFORMS: PlatformId[] = ["li_carousel", "ig_carousel"];

const STEPS = ["Polish", "SEO", "Format", "Preview", "Repurpose"];
const TONES = ["Professional", "Conversational", "Witty", "Inspirational", "Educational"];
const CATEGORIES = ["Tech", "Lifestyle", "Travel", "Food", "Business", "Health", "Finance", "Other"];

export const Route = createFileRoute("/editor/$id")({
  component: EditorPage,
  head: () => ({ meta: [{ title: "Editor — Blogger Finalizer" }] }),
});

function EditorPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [user, authLoading, nav]);

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: () => getArticle(id),
    enabled: !!user,
  });

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [tone, setTone] = useState("Conversational");
  const [category, setCategory] = useState("Tech");
  const [keyword, setKeyword] = useState("");
  const [polished, setPolished] = useState<string | null>(null);
  const [seo, setSeo] = useState<SeoData | null>(null);
  const [formatted, setFormatted] = useState<string | null>(null);
  const [repurposed, setRepurposed] = useState<RepurposedMap>({});
  const [activePlatform, setActivePlatform] = useState<PlatformId>("twitter");
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [repurposeCopied, setRepurposeCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedDate, setSchedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [schedChannel, setSchedChannel] = useState("");
  const [schedSending, setSchedSending] = useState(false);

  async function sendToScheduler() {
    const content = repurposed[activePlatform]?.content;
    if (!content) return toast.error("Generate content first");
    if (!schedChannel.trim()) return toast.error("Channel is required");
    setSchedSending(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-from-polisher`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          article_id: id,
          channel: schedChannel,
          platform: PLATFORMS.find((p) => p.id === activePlatform)?.label ?? activePlatform,
          content,
          date: schedDate,
          source: "polisher",
        }),
      });
      if (!res.ok) throw new Error(`Scheduler returned ${res.status}`);
      toast.success("Sent to Scheduler ✓");
      setShowScheduler(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSchedSending(false);
    }
  }

  useEffect(() => {
    if (article && !hydrated) {
      setStep(article.step ?? 0);
      setTitle(article.title ?? "");
      setDraft(article.draft ?? "");
      setTone(article.tone ?? "Conversational");
      setCategory(article.category ?? "Tech");
      setKeyword(article.target_keyword ?? "");
      setPolished(article.polished);
      setSeo((article.seo_data as SeoData | null) ?? null);
      setFormatted(article.formatted);
      setRepurposed(((article as { repurposed?: RepurposedMap }).repurposed) ?? {});
      setHydrated(true);
    }
  }, [article, hydrated]);

  const saveMut = useMutation({
    mutationFn: (patch: Parameters<typeof updateArticle>[1]) => updateArticle(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles", user?.id] });
      qc.invalidateQueries({ queryKey: ["article", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function buildPatch(extra: Record<string, unknown> = {}) {
    return {
      title,
      draft,
      tone,
      category,
      target_keyword: keyword,
      polished,
      seo_data: seo as never,
      formatted,
      repurposed: repurposed as never,
      step,
      ...extra,
    };
  }

  async function persist(extra: Record<string, unknown> = {}, silent = false) {
    await saveMut.mutateAsync(buildPatch(extra));
    if (!silent) toast.success("Saved");
  }

  async function runPolish() {
    if (!draft.trim()) return;
    setAiBusy("Polishing your draft...");
    try {
      const text = await runAI(
        "You are an expert blog editor. Polish the given article draft to be engaging, clear, and well-structured. Keep the author's voice but fix grammar, flow, and clarity. Return ONLY the polished article text, no commentary.",
        `Title: ${title || "Untitled"}\nTone: ${tone}\n\nDraft:\n${draft}`,
      );
      setPolished(text);
      setStep(1);
      await saveMut.mutateAsync({ ...buildPatch(), polished: text, step: 1 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  }

  async function runSEO() {
    setAiBusy("Analysing SEO...");
    try {
      const text = await runAI(
        `You are an SEO specialist for Blogger. Analyze the article and return ONLY a valid JSON object (no markdown, no backticks):
{"metaTitle":"...","metaDescription":"...","focusKeyword":"...","suggestedTags":["tag1","tag2","tag3","tag4","tag5"],"readabilityScore":"Good/Fair/Needs Work","seoTips":["tip1","tip2","tip3"]}`,
        `Category:${category}\nTarget keyword:${keyword || "auto-detect"}\n\nArticle:\n${polished || draft}`,
      );
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as SeoData;
      setSeo(parsed);
      setStep(2);
      await saveMut.mutateAsync({ ...buildPatch(), seo_data: parsed as never, step: 2 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  }

  async function runFormat() {
    setAiBusy("Generating Blogger HTML...");
    try {
      const text = await runAI(
        "You are a Blogger platform expert. Convert the article into clean HTML optimized for Blogger's post editor. Use <h2> for main headings, <h3> for sub-headings, <p> for paragraphs, <strong> for emphasis, <ul>/<li> for lists. Add a compelling intro and CTA paragraph at the end. Do NOT include <html><head><body> tags. Return ONLY the HTML.",
        `Article:\n${polished || draft}\n\nMeta Title:${seo?.metaTitle || title}`,
      );
      const cleaned = text.replace(/```html|```/g, "").trim();
      setFormatted(cleaned);
      setStep(3);
      await saveMut.mutateAsync({ ...buildPatch(), formatted: cleaned, step: 3 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  }

  async function copyHTML() {
    try {
      await copyHtml(formatted ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  function articleBaseName() {
    return title || "blog-article";
  }

  async function exportArticle(kind: "html" | "docx" | "pdf") {
    if (!formatted) return toast.error("Generate the Blogger HTML first");
    try {
      if (kind === "html") downloadHtmlFile(articleBaseName(), formatted, title || "Article");
      else if (kind === "docx") await downloadDocxFromHtml(articleBaseName(), title, formatted);
      else downloadPdfFromHtml(articleBaseName(), title, formatted);
      toast.success(`Downloaded ${kind.toUpperCase()}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function runRepurpose(platform: PlatformId) {
    const source = formatted || polished || draft;
    if (!source.trim()) {
      toast.error("Nothing to repurpose yet — finish earlier steps first.");
      return;
    }
    const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
    setAiBusy(`Repurposing for ${platformLabel}...`);
    try {
      const text = await runAI(
        PLATFORM_PROMPTS[platform],
        `Title: ${title || "Untitled"}\nTarget keyword: ${keyword || "n/a"}\nTone: ${tone}\nCategory: ${category}\n\nArticle:\n${source}`,
      );
      const next: RepurposedMap = {
        ...repurposed,
        [platform]: { content: text, generatedAt: new Date().toISOString() },
      };
      setRepurposed(next);
      await saveMut.mutateAsync({ ...buildPatch(), repurposed: next as never });
      toast.success(`${platformLabel} ready`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  }

  async function copyRepurposed() {
    const content = repurposed[activePlatform]?.content;
    if (!content) return;
    try {
      await copyText(content);
      setRepurposeCopied(true);
      setTimeout(() => setRepurposeCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  async function exportRepurposed(kind: "txt" | "docx" | "pdf" | "carousel") {
    const content = repurposed[activePlatform]?.content;
    if (!content) return toast.error("Generate this platform first");
    const platformLabel = PLATFORMS.find((p) => p.id === activePlatform)?.label ?? activePlatform;
    const baseName = `${title || "article"}-${activePlatform}`;
    try {
      if (kind === "txt") {
        const { downloadText } = await import("@/lib/exporters");
        downloadText(`${baseName}.txt`, content);
      } else if (kind === "docx") {
        await downloadDocxFromText(baseName, `${title || "Article"} — ${platformLabel}`, content);
      } else if (kind === "pdf") {
        downloadPdfFromText(baseName, `${title || "Article"} — ${platformLabel}`, content);
      } else if (kind === "carousel") {
        const n = await downloadCarouselZip(baseName, content);
        toast.success(`Exported ${n} slide images`);
        return;
      }
      toast.success(`Downloaded ${kind.toUpperCase()}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (authLoading || isLoading || !article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-muted-foreground text-xl leading-none hover:text-foreground">←</Link>
          <span className="font-display text-lg font-bold text-accent">✦ Blogger Finalizer</span>
        </div>
        <div className="flex items-center gap-2">
          <BfButton variant="ghost" onClick={() => persist()} className="px-3 py-1.5 text-xs" disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving..." : "Save Draft"}
          </BfButton>
        </div>
      </header>

      {/* Steps */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-3.5 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] border-2 ${
                i < step
                  ? "bg-primary border-transparent text-primary-foreground"
                  : i === step
                  ? "bg-primary/30 border-accent text-foreground"
                  : "bg-secondary border-transparent text-muted-foreground"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${i === step ? "text-accent" : i < step ? "text-primary" : "text-muted-foreground"}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className={`h-px w-5 ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <main className="mx-auto max-w-3xl px-6 py-7">
        {/* STEP 0 */}
        {step === 0 && (
          <div>
            <h2 className="font-display text-xl mb-5">Paste Your Draft</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Article Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your article title..." className={inputClass} />
              </Field>
              <Field label="Target Keyword">
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. AI tools for business" className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Writing Tone">
                <select value={tone} onChange={(e) => setTone(e.target.value)} className={inputClass}>
                  {TONES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Draft Content">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={14}
                placeholder="Paste your rough draft here — notes, bullets, or full paragraphs..."
                className={`${inputClass} leading-relaxed resize-y`}
              />
            </Field>
            <div className="flex flex-wrap gap-3 mt-2">
              {aiBusy ? (
                <Spinner label={aiBusy} />
              ) : (
                <BfButton onClick={runPolish} disabled={!draft.trim()}>✦ Polish with AI →</BfButton>
              )}
              <BfButton variant="ghost" onClick={() => persist()}>Save Draft</BfButton>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-xl mb-1">Polished Article</h2>
            <div className="text-xs text-muted-foreground mb-3">Review and edit before SEO analysis</div>
            <textarea
              value={polished ?? ""}
              onChange={(e) => setPolished(e.target.value)}
              rows={18}
              className={`${inputClass} leading-relaxed resize-y`}
            />
            <div className="flex flex-wrap gap-3 mt-4">
              {aiBusy ? <Spinner label={aiBusy} /> : <BfButton onClick={runSEO}>Analyse SEO →</BfButton>}
              <BfButton variant="ghost" onClick={() => setStep(0)}>← Back</BfButton>
              <BfButton variant="ghost" onClick={() => persist()}>Save</BfButton>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && seo && (
          <div>
            <h2 className="font-display text-xl mb-5">SEO Analysis</h2>
            <div className="grid gap-4">
              <Card>
                <Label>Meta Title</Label>
                <div className="font-display text-[15px] text-accent">{seo.metaTitle}</div>
              </Card>
              <Card>
                <Label>Meta Description</Label>
                <div className="text-sm text-muted-foreground leading-relaxed">{seo.metaDescription}</div>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <Label>Focus Keyword</Label>
                  <div className="text-sm font-medium text-success">🔑 {seo.focusKeyword}</div>
                </Card>
                <Card>
                  <Label>Readability</Label>
                  <div className={`text-sm font-medium ${
                    seo.readabilityScore === "Good" ? "text-success"
                    : seo.readabilityScore === "Fair" ? "text-warning"
                    : "text-destructive"
                  }`}>
                    {seo.readabilityScore === "Good" ? "✓" : "⚠"} {seo.readabilityScore}
                  </div>
                </Card>
              </div>
              <Card>
                <Label>Suggested Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {seo.suggestedTags?.map((t) => (
                    <span key={t} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-accent">{t}</span>
                  ))}
                </div>
              </Card>
              <Card>
                <Label>SEO Tips</Label>
                <ul className="list-disc pl-5 space-y-1">
                  {seo.seoTips?.map((t, i) => (
                    <li key={i} className="text-sm text-muted-foreground leading-relaxed">{t}</li>
                  ))}
                </ul>
              </Card>
            </div>
            <div className="flex flex-wrap gap-3 mt-5">
              {aiBusy ? <Spinner label={aiBusy} /> : <BfButton onClick={runFormat}>Generate Blogger HTML →</BfButton>}
              <BfButton variant="ghost" onClick={() => setStep(1)}>← Back</BfButton>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && formatted && (
          <div>
            <h2 className="font-display text-xl mb-1">Ready to Post! 🎉</h2>
            <div className="text-xs text-muted-foreground mb-4">Copy the HTML and paste into Blogger's HTML editor</div>

            <Label>Preview</Label>
            <div
              className="hp rounded-lg border border-border bg-card px-6 py-5 mb-4 max-h-[340px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: formatted }}
            />

            <Label>Raw HTML</Label>
            <div className="rounded-lg border border-border bg-background/60 p-3.5 mb-4 max-h-[180px] overflow-y-auto">
              <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed m-0">{formatted}</pre>
            </div>

            <div className="rounded-xl border border-success/30 bg-success/5 p-4 mb-5">
              <div className="text-sm font-semibold text-success mb-2">📋 How to post on Blogger</div>
              <ol className="list-decimal pl-5 space-y-1">
                {[
                  "Open Blogger → New Post",
                  "Click the HTML view button (⟨⟩) in the toolbar",
                  "Paste the copied HTML",
                  "Add labels: " + (seo?.suggestedTags?.slice(0, 3).join(", ") || "your tags"),
                  "Preview, then Publish!",
                ].map((s, i) => (
                  <li key={i} className="text-xs text-success/90 leading-relaxed">{s}</li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap gap-3">
              <BfButton variant={copied ? "success" : "primary"} onClick={copyHTML}>
                {copied ? "✓ Copied!" : "Copy HTML"}
              </BfButton>
              <BfButton variant="outline" onClick={() => exportArticle("html")}>⬇ HTML</BfButton>
              <BfButton variant="outline" onClick={() => exportArticle("docx")}>⬇ DOCX</BfButton>
              <BfButton variant="outline" onClick={() => exportArticle("pdf")}>⬇ PDF</BfButton>
              <BfButton onClick={() => { setStep(4); persist({ step: 4 }, true); }}>Repurpose →</BfButton>
              <BfButton variant="ghost" onClick={() => persist({ status: "published" })}>Mark as Published</BfButton>
              <BfButton variant="ghost" onClick={() => setStep(2)}>← Back</BfButton>
            </div>
          </div>
        )}

        {/* STEP 4 — Repurpose */}
        {step === 4 && (
          <div>
            <h2 className="font-display text-xl mb-1">Repurpose for Other Platforms</h2>
            <div className="text-xs text-muted-foreground mb-4">
              Turn this article into publish-ready content for any channel
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {PLATFORMS.map((p) => {
                const has = !!repurposed[p.id];
                const active = activePlatform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePlatform(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/60"
                    }`}
                  >
                    <span className="font-mono text-[11px]">{p.emoji}</span>
                    <span>{p.label}</span>
                    {has && <span className="text-success">●</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {aiBusy ? (
                <Spinner label={aiBusy} />
              ) : (
                <>
                  <BfButton onClick={() => runRepurpose(activePlatform)}>
                    {repurposed[activePlatform] ? "↻ Regenerate" : "✦ Generate"}
                  </BfButton>
                  {repurposed[activePlatform] && (
                    <>
                      <BfButton variant={repurposeCopied ? "success" : "outline"} onClick={copyRepurposed}>
                        {repurposeCopied ? "✓ Copied!" : "Copy"}
                      </BfButton>
                      <BfButton variant="outline" onClick={() => exportRepurposed("txt")}>⬇ TXT</BfButton>
                      <BfButton variant="outline" onClick={() => exportRepurposed("docx")}>⬇ DOCX</BfButton>
                      <BfButton variant="outline" onClick={() => exportRepurposed("pdf")}>⬇ PDF</BfButton>
                      {CAROUSEL_PLATFORMS.includes(activePlatform) && (
                        <BfButton variant="outline" onClick={() => exportRepurposed("carousel")}>
                          🎞 Slide Images (.zip)
                        </BfButton>
                      )}
                      <BfButton onClick={() => setShowScheduler(true)}>
                        Send to Scheduler →
                      </BfButton>
                    </>
                  )}
                </>
              )}
              <BfButton variant="ghost" onClick={() => setStep(3)}>← Back</BfButton>
            </div>

            {repurposed[activePlatform] ? (
              <Card className="p-0">
                <pre className="m-0 max-h-[520px] overflow-y-auto whitespace-pre-wrap p-4 text-[13px] leading-relaxed text-foreground font-sans">
                  {repurposed[activePlatform]?.content}
                </pre>
              </Card>
            ) : (
              <Card>
                <div className="text-sm text-muted-foreground">
                  No content yet for{" "}
                  <span className="text-accent">
                    {PLATFORMS.find((p) => p.id === activePlatform)?.label}
                  </span>
                  . Click Generate to create a publish-ready version.
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{children}</div>;
}
