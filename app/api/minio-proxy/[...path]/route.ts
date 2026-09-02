import { NextRequest, NextResponse } from "next/server";

/**
 * DEV-ONLY proxy untuk presigned upload MinIO.
 *
 * Masalah kontrak backend: presigned URL di-sign dengan endpoint internal
 * `http://minio:9000` (lihat docker-compose MINIO_ENDPOINT), sehingga tidak
 * bisa diakses browser. Solusi proper = backend men-sign dengan endpoint
 * publik (perubahan konfigurasi backend — TIDAK dilakukan di sini karena
 * backend sudah production). Selama dev, Next.js server yang meneruskan PUT
 * ke 127.0.0.1:9000 (MinIO di-bind loopback di host yang sama) dengan
 * mempertahankan header Host + Content-Type agar signature SigV4 tetap valid.
 */
const MINIO_INTERNAL = process.env.MINIO_INTERNAL_ORIGIN ?? "http://127.0.0.1:9000";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "minio proxy is dev-only" }, { status: 404 });
  }
  const { path } = await params;
  const key = path.map(encodeURIComponent).join("/");
  const search = request.nextUrl.search; // query SigV4 harus utuh

  const upstream = await fetch(`${MINIO_INTERNAL}/${key}${search}`, {
    method: "PUT",
    headers: {
      // Host harus sama dengan yang di-sign (minio:9000), bukan 127.0.0.1.
      host: "minio:9000",
      "content-type": request.headers.get("content-type") ?? "application/octet-stream",
    },
    body: request.body,
    // @ts-expect-error undici duplex required untuk streaming body
    duplex: "half",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "text/plain" },
  });
}
