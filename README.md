# KabarKode CMS

Editorial workspace (Next.js App Router) untuk mengelola konten website berita teknologi **KabarKode**. Dibangun mengikuti `requirement/kabarkode-cms-requirement.md`, lalu di-redesign penuh UI/UX mengikuti `requirement/kabarkode-cms-redesaignui.md` (Editorial Workspace: hitam/putih/warm-neutral + aksen electric green `#A3FF12`, brand `K</>`, Inter + JetBrains Mono).

## Arsitektur

```text
KabarKode CMS (Next.js, Vercel)
      │ HTTPS / REST (Bearer JWT)
      ▼
KabarKode Backend (Express)  ──►  PostgreSQL
      │  presign (host publik)           
      ▼                                 ▼
cdn.fhanalabs.site (MinIO via Cloudflare Tunnel, path-style /{bucket}/{key})
```

CMS **tidak pernah** menyentuh PostgreSQL/MinIO secara langsung dan **tidak menyimpan** kredensial infrastruktur apa pun. Upload gambar: presigned PUT **langsung dari browser** ke host CDN publik (backend men-sign dengan `MINIO_PRESIGN_ENDPOINT`) — proxy dev `app/api/minio-proxy` hanya dipakai bila backend men-sign dengan host internal.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui · TanStack Query · Axios · React Hook Form + Zod · Tiptap (lowlight code block + NodeView copy) · react-dropzone · date-fns · Sonner · DOMPurify.

## Struktur

```text
app/            (auth)/login, (dashboard)/{dashboard,articles,categories,tags,authors,media,profile,settings}
components/     ui/ (shadcn + Kbd, Progress, SegmentedControl), layout/ (sidebar, header, auth & navigation guard),
                forms/ (Tiptap), media/ (picker), brand/ (logo K</>, empty state, user avatar), command palette
features/       auth/, articles/, taxonomy/, media/ — api/hooks/komponen per domain
lib/            api/ (client axios + normalisasi error), auth/ (token, permissions), utils/, nav-shortcuts.ts
types/          kontrak API & model domain
proxy.ts        route protection lapis awal (redirect berbasis cookie token)
```

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi sesuai environment
npm run dev                  # http://localhost:3005 (port bebas)
```

Build: gunakan `env -u NODE_ENV npm run build` bila shell-mu men-set `NODE_ENV=development` (Next build menolak env itu).

### Environment

| Variabel | Dev | Testing | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api/backend` (via rewrite dev) | `https://kabarkodeapi.fhanalabs.site` | `https://api.kabarkode.id` |
| `NEXT_PUBLIC_MEDIA_URL` | `https://cdn.fhanalabs.site` | `https://cdn.fhanalabs.site` | `https://cdn.kabarkode.id` |

`next.config.ts` punya rewrite dev-only `/api/backend/*` → API publik supaya tidak perlu mengubah `CORS_ORIGINS` backend production saat develop lokal. `remotePatterns` next/image diambil dari `NEXT_PUBLIC_MEDIA_URL` (tanpa hardcode domain).

## Role & Permission (UI)

Backend otoritas final; permission map di `lib/auth/permissions.ts` hanya menyembunyikan aksi yang tidak bisa dilakukan role.

| Role | Cara dibuat | Akses UI |
|---|---|---|
| `admin` | seed (`SEED_ADMIN_EMAIL`) | Semua: konten, taxonomy, media (termasuk hapus), pengaturan |
| `editor` | (belum ada UI pembuatan user) | Konten & taxonomy penuh, tanpa hapus artikel |
| `author` | Halaman **Authors → New Author** dengan email + password (backend membuat user role `author` tertaut profil) | Dashboard, Articles (hanya artikel miliknya via `GET /articles/mine`), publish/archive artikel sendiri, Media (upload & lihat; tanpa hapus), Profil (`/profile`: nama/bio/avatar/ganti password) |

Detail perilaku author di CMS:
- Daftar artikel memakai fetcher role-aware (`/articles/mine` vs `/articles/admin/all`).
- Di editor, `author_id` terkunci ke profil sendiri (badge); inline create kategori/tag disembunyikan (backend menolak).
- Avatar gambar author tampil konsisten di kartu Authors, AuthorPicker, sidebar, dan topbar (`UserAvatar` membaca `/authors/me`).

## Catatan Auth

Backend hanya mendukung **Bearer JWT** (belum cookie-based). Sesuai requirement §11, dipakai *secure client-side authentication adapter*: token di cookie non-httpOnly `kk_cms_token` (SameSite=Lax), terpusat di `lib/auth/token.ts`. Saat backend menambah cookie auth, hanya modul ini yang diganti.

## UX Highlights (hasil redesign)

- **Command palette** global `Ctrl/Cmd+K`: Create / Navigate / pencarian artikel server-side.
- **Mode gelap/terang**: toggle di header (next-themes, default ikut sistem, persist di localStorage); token dark = warm charcoal dengan primary putih/hitam terbalik — identitas `K</>` tetap konsisten di kedua tema.
- **Shortcut**: `Alt+1` Dashboard, `Alt+2` Articles, `Alt+3` Media, `Alt+N` New Article, `Ctrl/Cmd+K` palette, `Ctrl/Cmd+S` Save draft, `Ctrl/Cmd+Enter` Publish — badge shortcut tampil di dalam palette dan menyesuaikan platform (⌘/⌥ di Mac, Ctrl/Alt di Windows/Linux). Navigasi sengaja memakai `Alt`, bukan `Ctrl+angka`, karena `Ctrl+1..9` dan `Ctrl+Shift+A` adalah shortcut bawaan Chrome/Edge yang tidak bisa di-intercept web app.
- **Article editor** ala ruang menulis: judul 48px auto-grow, excerpt sekunder, slug inline (`kabarkode.dev/… [Edit]`), save state terlihat (Saved/Saving…/Unsaved), metadata compact di sidebar sticky, status via aksi eksplisit Publish/Archive.
- **Scheduled publish**: aksi "Schedule" di header editor & menu baris artikel — pilih waktu manual atau preset (1 jam lagi, malam ini 19:00, besok 09:00, Senin 09:00). Backend scheduler mem-publish otomatis saat jatuh tempo (browser boleh tertutup); badge "Terjadwal" di daftar, info jadwal + tombol batalkan di dialog, dan peringatan saat publish manual menimpa jadwal.
- **Filter artikel** persist di URL (`/articles?status=draft&category=security&tag=react`) + tabs status + popover Filters.
- **Upload dropzone** (drag & drop + klik + progress + preview + replace/remove) untuk cover artikel & Media Library; multi-file upload berurutan lewat presigned flow.
- **NavigationGuard**: semua link SPA tertahan dialog "perubahan belum disimpan" saat editor punya perubahan nyata (deteksi dirty membandingkan HTML dengan snapshot terakhir tersimpan — blur pasca-save tidak memicu popup palsu).
- Tiptap: `immediatelyRender: false` (wajib di SSR/Next — tanpa ini editor bisa tampil tapi tidak bisa diketik di production), toolbar tidak sticky (sticky menutupi baris pertama editor), code block dengan header + tombol Copy.

## Backend Contract Gaps (update Sept 2026)

1. ~~Presigned URL host internal~~ — **selesai** di backend v1.1 (`MINIO_PRESIGN_ENDPOINT` men-sign dengan host publik; proxy dev tetap ada sebagai fallback).
2. **Tidak ada `GET /media` (list).** Media Library masih memakai indeks ID lokal browser (hasil upload) + `GET /media/:id` per item. Metadata kanonik tetap di PostgreSQL; endpoint list dengan pagination akan membuat fitur penuh lintas-device.
3. **Tidak ada endpoint statistik dashboard.** Statistik dihitung dari `meta.total` query list (`limit=1`) via fetcher role-aware.
4. **Tidak ada refresh token.** `JWT_EXPIRES_IN=7d`; setelah kedaluwarsa user login ulang (interceptor 401 membersihkan sesi).
5. **Belum ada endpoint create user admin/editor.** Role `author` bisa dibuat lewat halaman Authors; akun admin/editor baru masih butuh seed/manual DB.

## Roadmap (dari Phase Plan requirement)

- [x] Phase 1–3 — project init, app shell, API layer
- [x] Phase 4 — authentication (login, guard, role)
- [x] Phase 5 — dashboard
- [x] Phase 6 — article management (list editorial, search, filter URL-state, pagination)
- [x] Phase 7 — article editor (Tiptap, slug, excerpt, cover dropzone, tag chips, source)
- [x] Phase 8 — media (library, presigned upload, picker, delete)
- [x] Phase 9 — categories / tags / authors CRUD (+ akun login author)
- [x] Phase 10 — preview (HTML disanitasi DOMPurify)
- [x] Phase 11 — UX hardening (skeleton, empty/error state, toast, dialog konfirmasi, unsaved-changes)
- [x] Phase 11b — UI/UX redesign penuh (requirement redesign §1–§91) + role author end-to-end + shortcut navigasi
- [ ] Phase 12 — testing (Vitest + Playwright)
- [ ] Phase 13 — deployment (Vercel + cloudflare tunnel `cms.fhanalabs.site`, CORS backend perlu menambah origin CMS saat deploy)

## Deploy

Push ke `main` = auto-deploy Vercel (`https://kabarkode-cms.vercel.app`). Set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_MEDIA_URL` di env Vercel sesuai tabel Environment.

## Git

Branch: `main` ← `dev` ← `feature/*`. Jangan commit `.env*` (sudah di-gitignore).
