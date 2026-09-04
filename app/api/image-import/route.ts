import { NextRequest, NextResponse } from "next/server";

/**
 * Import gambar dari URL eksternal (mis. Unsplash) untuk Media Library.
 *
 * Server-side fetch (menghindari CORS browser), dengan penjagaan:
 * - hanya http/https;
 * - blokir host privat/loopback (anti-SSRF);
 * - redirect diikuti manual maks 3x dengan cek yang sama di tiap hop;
 * - content-type harus image/* yang didukung;
 * - ukuran dibatasi 10 MB (baca stream dengan batas, bukan Content-Length saja).
 *
 * Respons: binary gambar + header metadata — sisi klien membungkusnya jadi
 * File lalu mengunggahnya lewat presigned flow normal (tersimpan di MinIO,
 * tidak hotlink ke sumber eksternal).
 */
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "metadata.google.internal" || h.endsWith(".internal") || h.endsWith(".local")) return true;
  // IPv4 privat/loopback/link-local/multicast + IPv6 unik-lokal
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }
  if (h.startsWith("[")) {
    const inner = h.slice(1, -1);
    if (/^f[cd][0-9a-f]{2}:/i.test(inner) || inner === "::1" || inner.startsWith("fe80")) return true;
  }
  return false;
}

async function safeFetch(url: string): Promise<{ res: Response | null; error?: string }> {
  let current = url;
  for (let hop = 0; hop <= 3; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      return { res: null, error: "URL tidak valid" };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { res: null, error: "Hanya URL http/https yang diizinkan" };
    }
    if (isPrivateHost(parsed.hostname)) {
      return { res: null, error: "Host tidak diizinkan" };
    }
    const res = await fetch(parsed.toString(), {
      redirect: "manual",
      headers: { "User-Agent": "KabarKode-CMS/1.0 (image import)" },
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    if (!res) return { res: null, error: "Gagal mengambil gambar" };
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return { res: null, error: "Redirect tanpa lokasi" };
      current = new URL(loc, parsed).toString();
      continue;
    }
    if (!res.ok) return { res: null, error: `Sumber membalas ${res.status}` };
    return { res };
  }
  return { res: null, error: "Terlalu banyak redirect" };
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Parameter url wajib" }, { status: 400 });

  const { res, error } = await safeFetch(url);
  if (!res) return NextResponse.json({ error: error ?? "Gagal" }, { status: 502 });

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    return NextResponse.json(
      { error: `Tipe konten bukan gambar yang didukung (dapat: ${contentType || "?"})` },
      { status: 415 },
    );
  }

  // Baca stream dengan batas keras — jangan percaya Content-Length.
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) {
    return NextResponse.json({ error: "Gambar melebihi 10 MB" }, { status: 413 });
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (res.body) {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_BYTES) {
          await reader.cancel().catch(() => undefined);
          return NextResponse.json({ error: "Gambar melebihi 10 MB" }, { status: 413 });
        }
        chunks.push(value);
      }
    }
  }
  if (total === 0) return NextResponse.json({ error: "Berkas kosong" }, { status: 502 });

  const name = new URL(url).pathname.split("/").pop()?.slice(0, 80) || `imported.${ext}`;
  return new NextResponse(new Blob(chunks as BlobPart[], { type: contentType }), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(total),
      "Content-Disposition": `inline; filename="${name.replace(/[^\w.\-]/g, "_")}"`,
      "X-Image-Name": encodeURIComponent(name),
    },
  });
}
