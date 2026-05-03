import { saveAs } from "file-saver";
import JSZip from "jszip";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

function sanitize(name: string) {
  return (name || "untitled").replace(/[^\w\d-_]+/g, "_").slice(0, 60) || "untitled";
}

/* ---------- Clipboard ---------- */
export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export async function copyHtml(html: string) {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      /* fall through */
    }
  }
  await navigator.clipboard.writeText(html);
}

/* ---------- Plain text / HTML downloads ---------- */
export function downloadText(filename: string, text: string, mime = "text/plain") {
  saveAs(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}

export function downloadHtmlFile(baseName: string, html: string, title = "Article") {
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`;
  downloadText(`${sanitize(baseName)}.html`, doc, "text/html");
}

/* ---------- DOCX ---------- */
function textToParagraphs(text: string): Paragraph[] {
  return text.split(/\n/).map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line)],
      }),
  );
}

export async function downloadDocxFromText(baseName: string, title: string, body: string) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title || baseName)] }),
          ...textToParagraphs(body),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${sanitize(baseName)}.docx`);
}

export async function downloadDocxFromHtml(baseName: string, title: string, html: string) {
  // Strip HTML to readable text while preserving block breaks.
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  // Insert newlines at block boundaries.
  tmp.querySelectorAll("h1,h2,h3,h4,p,li,br,div").forEach((el) => {
    el.append("\n");
  });
  const text = (tmp.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  await downloadDocxFromText(baseName, title, text);
}

/* ---------- PDF ---------- */
export function downloadPdfFromText(baseName: string, title: string, body: string) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const height = pdf.internal.pageSize.getHeight() - margin * 2;
  let y = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  const titleLines = pdf.splitTextToSize(title || baseName, width);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 22 + 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  const lineHeight = 15;
  const paragraphs = body.split(/\n/);
  for (const p of paragraphs) {
    const lines = pdf.splitTextToSize(p || " ", width);
    for (const line of lines) {
      if (y > margin + height) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }
  }
  pdf.save(`${sanitize(baseName)}.pdf`);
}

export function downloadPdfFromHtml(baseName: string, title: string, html: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  tmp.querySelectorAll("h1,h2,h3,h4,p,li,br,div").forEach((el) => el.append("\n"));
  const text = (tmp.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  downloadPdfFromText(baseName, title, text);
}

/* ---------- Carousel slide images ---------- */

/**
 * Split a generated carousel script into individual slides.
 * Splits on lines starting with "Slide N" or "Slide N -" / "Slide N:".
 */
export function splitCarouselSlides(text: string): { title: string; body: string }[] {
  const lines = text.split(/\r?\n/);
  const slides: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;
  const slideRe = /^\s*(?:[*_#-]*\s*)?slide\s*\d+\b[^\n]*$/i;

  for (const raw of lines) {
    const line = raw.replace(/^[#*_\-\s]+|[#*_\s]+$/g, "");
    if (slideRe.test(raw)) {
      if (current) slides.push(current);
      current = { title: line, body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + raw;
    }
  }
  if (current) slides.push(current);
  return slides
    .map((s) => ({ title: s.title.trim(), body: s.body.trim() }))
    .filter((s) => s.title || s.body);
}

function renderSlideImage(
  slide: { title: string; body: string },
  index: number,
  total: number,
  opts: { size: number; bg: string; fg: string; accent: string },
): Blob {
  const { size, bg, fg, accent } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, "#1a0d2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Border
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, size - 48, size - 48);

  const padding = 80;
  const maxWidth = size - padding * 2;

  // Slide counter
  ctx.fillStyle = accent;
  ctx.font = "600 28px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${index + 1} / ${total}`, padding, padding);

  // Title
  ctx.fillStyle = fg;
  ctx.font = "700 56px sans-serif";
  const titleLines = wrapText(ctx, slide.title || `Slide ${index + 1}`, maxWidth);
  let y = padding + 80;
  for (const line of titleLines.slice(0, 4)) {
    ctx.fillText(line, padding, y);
    y += 64;
  }

  // Body
  ctx.fillStyle = fg;
  ctx.font = "400 32px sans-serif";
  y += 40;
  const bodyLines = wrapText(ctx, slide.body, maxWidth);
  const maxBody = Math.floor((size - y - padding) / 42);
  for (const line of bodyLines.slice(0, maxBody)) {
    ctx.fillText(line, padding, y);
    y += 42;
  }

  // Footer accent line
  ctx.fillStyle = accent;
  ctx.fillRect(padding, size - padding, 80, 6);

  return dataURItoBlob(canvas.toDataURL("image/png"));
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
    if (!para) out.push("");
  }
  return out;
}

function dataURItoBlob(dataURI: string): Blob {
  const [meta, b64] = dataURI.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

export async function downloadCarouselZip(baseName: string, text: string) {
  const slides = splitCarouselSlides(text);
  if (slides.length === 0) {
    throw new Error("Could not detect slide markers (e.g. 'Slide 1') in the generated content.");
  }
  const zip = new JSZip();
  const opts = { size: 1080, bg: "#0b0719", fg: "#f5f3ff", accent: "#a78bfa" };
  slides.forEach((s, i) => {
    const blob = renderSlideImage(s, i, slides.length, opts);
    zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
  });
  // Also include the source script
  zip.file("script.txt", text);
  const out = await zip.generateAsync({ type: "blob" });
  saveAs(out, `${sanitize(baseName)}-carousel.zip`);
  return slides.length;
}
