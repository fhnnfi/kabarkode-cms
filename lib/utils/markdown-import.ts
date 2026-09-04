import { marked } from "marked";

/**
 * Parser impor berkas .md editorial (format newscrap) menjadi komponen
 * artikel CMS: judul, excerpt, HTML konten (rich text), sumber, dan URL
 * cover. Konversi markdown memakai `marked`; hasil HTML disanitasi DOMPurify
 * oleh pemanggil sebelum masuk editor.
 */
export interface ParsedMarkdownArticle {
  title: string;
  excerpt: string;
  contentHtml: string;
  source_name: string | null;
  source_url: string | null;
  /** URL gambar cover pertama di dokumen (untuk di-import ke Media Library). */
  cover_image_url: string | null;
  /** Nama penulis tertulis di dokumen (informasi — tidak auto-map ke profil). */
  author_name: string | null;
}

const META_PATTERNS = {
  title: /^#\s+(.+?)\s*$/m,
  author: /^\*\*Penulis:?\*\*\s*(.+?)\s*$/im,
  source:
    /^\*\*Sumber Asli:?\*\*\s*(?:\[([^\]]*)\]\(([^)\s]+)\)|(\S+))\s*$/im,
  date: /^\*\*Tanggal Publikasi:?\*\*\s*(.+?)\s*$/im,
  image: /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/m,
};

/** Baris metadata newscrap (Penulis/Sumber/Tanggal) — dihapus dari konten. */
function stripMetaLines(md: string): string {
  return md
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/^\*\*(Penulis|Sumber Asli|Tanggal Publikasi)\b/i.test(line.trim()),
    )
    .join("\n");
}

/** Buang judul H1 pertama + gambar cover pertama + hr pembuka dari body. */
function stripLeadBlocks(md: string, title: string, coverUrl: string | null): string {
  let body = md;
  if (title) {
    body = body.replace(new RegExp(`^#\\s+${escapeRe(title)}\\s*(?:\\r?\\n|$)`, "m"), "");
  }
  if (coverUrl) {
    body = body.replace(new RegExp(`^!\\[[^\\]]*\\]\\(${escapeRe(coverUrl)}[^)]*\\)\\s*(?:\\r?\\n|$)`, "m"), "");
  }
  // Garis pemisah (---) pertama setelah blok metadata bukan bagian konten.
  body = body.replace(/^(?:\s*\r?\n)*---\s*(?:\r?\n|$)/, "\n");
  return body.trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** HTML -> teks polos untuk excerpt. */
function htmlToText(html: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.innerHTML = html;
    return (div.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Judul fallback dari nama berkas: `aws_gpt56_kiro_id.md` -> "aws gpt56 kiro id". */
function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.(md|markdown)$/i, "").replace(/[_-]+/g, " ").trim();
}

export function parseMarkdownArticle(markdown: string, fileName = ""): ParsedMarkdownArticle {
  const md = markdown.replace(/^\uFEFF/, "");

  const title = md.match(META_PATTERNS.title)?.[1]?.trim() || titleFromFileName(fileName) || "Tanpa judul";
  const authorName = md.match(META_PATTERNS.author)?.[1]?.trim() || null;

  const src = md.match(META_PATTERNS.source);
  const sourceName = src?.[1]?.trim() || src?.[3]?.trim() || null;
  const sourceUrl = src?.[2]?.trim() || (src?.[3]?.trim() && /^https?:\/\//i.test(src[3]) ? src[3].trim() : null) || null;

  const coverUrl = md.match(META_PATTERNS.image)?.[2]?.trim() || null;

  const body = stripLeadBlocks(stripMetaLines(md), title, coverUrl);

  marked.setOptions({ gfm: true, breaks: false });
  const contentHtml = marked.parse(body, { async: false }) as string;

  // Paragraf pertama jadi excerpt (soft limit 300 karakter, keras 2000).
  const firstPara = contentHtml.match(/<p>([\s\S]*?)<\/p>/);
  const excerptText = firstPara ? htmlToText(firstPara[1]) : htmlToText(contentHtml);
  const excerpt =
    excerptText.length > 300 ? excerptText.slice(0, 297).trimEnd() + "…" : excerptText;

  return {
    title,
    excerpt,
    contentHtml: contentHtml.trim(),
    source_name: sourceName,
    source_url: sourceUrl,
    cover_image_url: coverUrl,
    author_name: authorName,
  };
}

/** Ambil tanggal publikasi tertulis (informasi; format teks bebas). */
export function publicationDateOf(markdown: string): string | null {
  return markdown.replace(/^\uFEFF/, "").match(META_PATTERNS.date)?.[1]?.trim() || null;
}
