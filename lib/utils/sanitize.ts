import DOMPurify from "dompurify";

/**
 * Sanitasi HTML konten artikel sebelum dirender (requirement §55–56).
 * Konten dari Tiptap/backend diperlakukan sebagai TIDAK dipercaya.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["target", "rel", "class"],
    FORBID_TAGS: ["style", "form", "input", "script"],
  });
}
