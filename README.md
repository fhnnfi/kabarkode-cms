# KabarKode CMS

Dashboard internal (Next.js App Router) untuk mengelola konten website berita teknologi **KabarKode**. Dibangun mengikuti `requirement/kabarkode-cms-requirement.md`.

## Arsitektur

```text
KabarKode CMS (Next.js)
      │ HTTPS / REST (Bearer JWT)
      ▼
KabarKode Backend (Express)  ──►  PostgreSQL
      │                           MinIO (presigned PUT)
      ▼
cdn.fhanalabs.site (Cloudflare)
```

CMS **tidak pernah** menyentuh PostgreSQL/MinIO secara langsung dan **tidak menyimpan** kredensial infrastruktur apa pun (Rule 1 & 7 requirement).

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui · TanStack Query + Table · Axios · React Hook Form + Zod · Tiptap (lowlight code block) · date-fns · Sonner · DOMPurify.

## Struktur

```text
app/            (auth)/login, (dashboard)/{dashboard,articles,categories,tags,authors,media,settings}
components/     ui/ (shadcn), layout/ (sidebar, header, guard), forms/ (Tiptap), media/ (picker)
features/       auth/, articles/, taxonomy/, media/ — api/hooks/schemas per domain
lib/api/        client.ts (axios + normalisasi error), auth, articles, categories, tags, authors, media
lib/auth/       token.ts (adapter token terpusat), permissions.ts
providers/      query-provider.tsx
types/          kontrak API & model domain
proxy.ts        route protection lapis awal (Next.js proxy/middleware)
```

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi sesuai environment
npm run dev                  # http://localhost:3005 (port bebas)
```

### Environment

| Variabel | Dev | Testing | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api/backend` (via rewrite dev) | `https://kabarkodeapi.fhanalabs.site` | `https://api.kabarkode.id` |
| `NEXT_PUBLIC_MEDIA_URL` | `https://cdn.fhanalabs.site` | `https://cdn.fhanalabs.site` | `https://cdn.kabarkode.id` |

`next.config.ts` punya rewrite dev-only `/api/backend/*` → API publik supaya tidak perlu mengubah `CORS_ORIGINS` backend production saat develop lokal.

## Catatan Auth

Backend saat ini hanya mendukung **Bearer JWT** (belum cookie-based). Sesuai requirement §11, dipakai *secure client-side authentication adapter*: token disimpan di cookie non-httpOnly `kk_cms_token` (SameSite=Lax), penanganannya terpusat di `lib/auth/token.ts` — tidak tersebar di komponen. Saat backend menambah cookie auth, hanya modul ini yang perlu diganti.

## Backend Contract Gaps (ditemukan saat implementasi, TIDAK diubah di backend)

Backend adalah production — tidak ada kode yang dimodifikasi. Gap berikut didokumentasikan sesuai requirement §86:

1. **Presigned URL di-sign dengan host internal.** `MINIO_ENDPOINT=http://minio:9000` membuat presigned URL hasil `POST /media/presign` berisi host `minio:9000` yang tidak terjangkau browser (diverifikasi: rewrite host → `SignatureDoesNotMatch`).
   *Solusi dev saat ini:* proxy dev-only `app/api/minio-proxy/[...path]/route.ts` meneruskan PUT ke `127.0.0.1:9000` (MinIO di-bind loopback di host yang sama) dengan mempertahankan header `Host` agar signature valid.
   *Solusi proper (perlu keputusan backend, non-breaking):* sign dengan endpoint publik yang sama dengan `MINIO_PUBLIC_URL` (mis. tunnel `cdn.fhanalabs.site → http://127.0.0.1:9000`), atau tambah env `MINIO_PRESIGN_ENDPOINT`.
2. **Tidak ada `GET /media` (list).** Media Library memakai indeks ID lokal browser (hasil upload) + `GET /media/:id` per item. Metadata kanonik tetap di PostgreSQL. Endpoint list (dengan pagination) akan membuat fitur ini penuh.
3. **Tidak ada endpoint statistik dashboard.** Statistik dihitung dari `meta.total` query list (`limit=1`) — hemat tapi boros query; endpoint `/articles/stats` akan lebih baik.
4. **Tidak ada refresh token.** `JWT_EXPIRES_IN=7d`; setelah kedaluwarsa user login ulang (interceptor 401 membersihkan sesi).

## Roadmap (dari Phase Plan requirement)

- [x] Phase 1–3 — project init, app shell, API layer
- [x] Phase 4 — authentication (login, guard, role)
- [x] Phase 5 — dashboard
- [x] Phase 6 — article management (tabel, search, filter URL-state, pagination)
- [x] Phase 7 — article editor (Tiptap, slug, excerpt, cover, tags multi-select, source)
- [x] Phase 8 — media (library, presigned upload, picker, delete)
- [x] Phase 9 — categories / tags / authors CRUD
- [x] Phase 10 — preview (HTML disanitasi DOMPurify)
- [x] Phase 11 — UX hardening (skeleton, empty/error state, toast, dialog konfirmasi, unsaved-changes)
- [ ] Phase 12 — testing (Vitest + Playwright)
- [ ] Phase 13 — deployment (Vercel + cloudflare tunnel `cms.fhanalabs.site`, CORS backend perlu menambah origin CMS saat deploy)

## Git

Branch: `main` ← `dev` ← `feature/*`. Jangan commit `.env*` (sudah di-gitignore).
