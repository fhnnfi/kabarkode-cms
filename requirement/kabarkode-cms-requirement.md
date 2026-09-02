# KabarKode CMS — Frontend Requirements

## 1. Project Overview

KabarKode CMS adalah aplikasi web internal untuk mengelola seluruh konten dan operasional website berita teknologi **KabarKode**.

CMS digunakan oleh:

- Admin
- Editor

CMS bertanggung jawab terhadap:

- Authentication
- Dashboard
- Article management
- Article editor
- Draft management
- Publishing
- Category management
- Tag management
- Author management
- Media management
- Search
- Filtering
- Pagination
- Content preview
- User/session management

CMS **tidak boleh berkomunikasi langsung dengan PostgreSQL atau MinIO**.

Semua komunikasi dengan backend harus melalui:

```text
KabarKode CMS
      │
      │ HTTPS / REST API
      ▼
KabarKode Backend
      │
      ├── PostgreSQL
      └── MinIO
```

---

# 2. Project Separation

CMS harus dibuat sebagai project/repository terpisah dari:

```text
kabar-kode-backend
```

dan nantinya juga terpisah dari:

```text
kabar-kode-web
```

serta aplikasi mobile.

Recommended repository structure:

```text
KabarKode/
│
├── kabarkode-backend
│
├── kabarkode-cms
│
├── kabarkode-web
│
└── kabarkode-mobile
```

Untuk tahap sekarang hanya implementasikan:

```text
kabarkode-cms
```

Jangan implementasikan public website atau mobile application dalam project ini.

---

# 3. Primary Goal

Tujuan utama CMS:

> Menyediakan interface yang nyaman, aman, dan efisien bagi Admin/Editor untuk membuat, mengedit, mengelola, dan mempublikasikan artikel KabarKode.

CMS harus terasa seperti aplikasi dashboard profesional, bukan seperti halaman CRUD sederhana.

Prioritas:

1. Usability
2. Reliability
3. Type safety
4. Validation
5. Good content editing experience
6. Responsive desktop/tablet layout
7. Security
8. Maintainability

---

# 4. Recommended Stack

Gunakan:

```text
Framework       : Next.js
Language        : TypeScript
Rendering       : App Router
Styling         : Tailwind CSS
UI Components   : shadcn/ui
Icons           : Lucide React
Data Fetching   : TanStack Query
HTTP Client     : Axios
Forms           : React Hook Form
Validation      : Zod
Rich Text       : Tiptap
Date Utilities  : date-fns
Notifications   : Sonner
Tables          : TanStack Table
Charts           : Recharts
```

Recommended package categories:

```text
next
react
typescript

tailwindcss
shadcn/ui
lucide-react

@tanstack/react-query
@tanstack/react-table

axios

react-hook-form
zod
@hookform/resolvers

@tiptap/react
@tiptap/starter-kit

date-fns

sonner

recharts
```

Do not install libraries that are not required by the current feature set.

Avoid unnecessary global state libraries unless a real requirement appears.

---

# 5. Why Next.js

The CMS is an internal web application.

Next.js is preferred because it provides:

- App Router
- TypeScript support
- Route groups
- Layout system
- Server/Client component separation
- Middleware/proxy capabilities
- Easy deployment
- Good developer experience

The CMS does NOT need to be SEO-oriented because it is not the public news website.

Therefore, CMS pages may prioritize application usability over SEO.

---

# 6. Rendering Strategy

Use a hybrid approach.

Prefer:

```text
Server Components
```

for:

- Initial page shell
- Static UI
- Layout
- Navigation
- Non-interactive content

Use:

```text
Client Components
```

for:

- Forms
- Rich text editor
- Data tables
- Dialogs
- Dropdowns
- Upload interfaces
- Interactive filters
- Article editor
- Dashboard charts

Do not make the entire application `"use client"`.

---

# 7. Backend API

Backend base URL must come from environment variables.

Example:

```env
NEXT_PUBLIC_API_URL=https://api.fhanafii.my.id
```

Development example:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Production later:

```env
NEXT_PUBLIC_API_URL=https://api.kabarkode.id
```

Do not hardcode API URLs inside components.

---

# 8. API Architecture

Create a centralized API client.

Recommended:

```text
src/lib/api/
├── client.ts
├── auth.ts
├── articles.ts
├── categories.ts
├── tags.ts
├── authors.ts
└── media.ts
```

Example conceptual architecture:

```text
Component
   │
   ▼
TanStack Query
   │
   ▼
API Service
   │
   ▼
Axios Client
   │
   ▼
KabarKode Backend
```

Components should not contain raw Axios requests.

Bad:

```typescript
axios.get(...)
```

directly inside page components.

Good:

```typescript
articleApi.getArticles(...)
```

---

# 9. TanStack Query

Use TanStack Query for server state.

Responsibilities:

- Fetching
- Caching
- Refetching
- Mutations
- Loading states
- Error states
- Query invalidation

Example queries:

```text
articles
article
categories
tags
authors
media
```

After mutation:

```text
create article
update article
publish article
archive article
delete article
```

invalidate the relevant queries.

Example:

```text
publish article
      │
      ▼
invalidate:
articles
article:{id}
```

---

# 10. Authentication

CMS authentication must use the backend authentication system.

Backend already provides:

```text
POST /api/v1/auth/login
```

CMS must not implement a second authentication system.

Login flow:

```text
User
 │
 ▼
CMS Login
 │
 ▼
Backend /auth/login
 │
 ▼
JWT
 │
 ▼
CMS session
```

---

# 11. Token Handling

Do not store authentication tokens in:

```text
localStorage
```

unless there is an explicit architectural reason.

Prefer a secure authentication mechanism.

Recommended approach:

```text
CMS
 │
 ▼
Secure HTTP-only cookie
 │
 ▼
Backend authentication
```

If the current backend only supports Bearer JWT and does not yet support cookie-based authentication, implement a secure client-side authentication adapter while keeping the token handling centralized.

Do not scatter token handling across components.

---

# 12. Authentication State

Create:

```text
src/features/auth/
```

Recommended:

```text
src/features/auth/
├── api.ts
├── hooks.ts
├── types.ts
├── auth-provider.tsx
└── permissions.ts
```

CMS should know:

```text
authenticated
unauthenticated
loading
```

and user information:

```text
id
email
role
```

Never expose:

```text
password_hash
JWT secret
backend secrets
MinIO credentials
```

---

# 13. Roles

Current backend roles:

```text
admin
editor
```

CMS must respect these roles.

Recommended permissions:

### Admin

Can:

```text
View dashboard
Manage articles
Publish articles
Archive articles
Manage categories
Manage tags
Manage authors
Manage media
Manage users
```

### Editor

Can:

```text
View dashboard
Create articles
Edit articles
Manage drafts
Manage media
Manage categories/tags where permitted
```

Publishing permissions should follow the backend authorization rules.

The CMS must not rely solely on frontend permission checks.

Backend remains the final authorization authority.

---

# 14. Route Structure

Recommended App Router structure:

```text
app/
├── (auth)/
│   └── login/
│       └── page.tsx
│
├── (dashboard)/
│   ├── layout.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── articles/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   │
│   ├── categories/
│   │   └── page.tsx
│   │
│   ├── tags/
│   │   └── page.tsx
│   │
│   ├── authors/
│   │   └── page.tsx
│   │
│   └── media/
│       └── page.tsx
│
└── layout.tsx
```

Use route groups:

```text
(auth)
(dashboard)
```

to separate authenticated and unauthenticated layouts.

---

# 15. Dashboard

Dashboard should provide an overview of CMS activity.

Initial statistics:

```text
Total Articles
Published
Draft
Archived
Categories
Tags
Authors
```

Example:

```text
┌─────────────────────────────────────────┐
│ KabarKode CMS                            │
├────────────┬────────────┬───────────────┤
│ Articles   │ Published  │ Draft         │
│ 128        │ 97         │ 24            │
├────────────┴────────────┴───────────────┤
│ Recent Articles                          │
│                                         │
│ Article A                     Published  │
│ Article B                     Draft      │
│ Article C                     Published  │
└─────────────────────────────────────────┘
```

Use Recharts only when there is meaningful data to visualize.

Do not create unnecessary charts just for decoration.

---

# 16. Sidebar Navigation

Recommended navigation:

```text
Dashboard

Content
├── Articles
├── Categories
├── Tags
└── Authors

Media
└── Media Library

System
└── Settings
```

The sidebar should support:

- Active route
- Collapsed state
- Mobile drawer
- Role-based navigation

---

# 17. Articles

Article management is the most important CMS feature.

Article list must support:

```text
Search
Filter
Pagination
Sorting
Status
Category
Author
Article type
Date
```

Columns:

```text
Cover
Title
Status
Type
Category
Author
Published At
Updated At
Actions
```

---

# 18. Article Status

Backend statuses:

```text
draft
published
archived
```

CMS must visually distinguish them.

Example:

```text
Draft       → neutral badge
Published   → success badge
Archived    → muted badge
```

Do not hardcode business logic in UI components.

Use a centralized status configuration.

---

# 19. Article Type

Supported types:

```text
news
analysis
tutorial
security
release
```

CMS should provide a select input.

---

# 20. Article Creation

Route:

```text
/articles/new
```

Form fields:

```text
Title
Slug
Excerpt
Content
Cover Image
Author
Category
Tags
Article Type
Source Name
Source URL
Status
```

Required fields should follow backend validation.

---

# 21. Article Editor

Use Tiptap as the rich text editor.

Recommended functionality:

```text
Bold
Italic
Underline
Strike
Heading
Paragraph
Bullet list
Ordered list
Blockquote
Code
Code block
Link
Image
Horizontal rule
Undo
Redo
```

The editor should be extensible.

Do not build a rich text editor from scratch.

---

# 22. Developer-Focused Content

Because KabarKode is a technology publication, the editor must support technical content.

Code blocks must support:

```text
JavaScript
TypeScript
Python
Java
Kotlin
Go
Rust
PHP
HTML
CSS
JSON
Bash
SQL
```

The editor should preserve code formatting.

Syntax highlighting can be added if supported cleanly by the selected Tiptap implementation.

---

# 23. Article Content Model

The CMS should send article content in a format supported by the backend.

If the backend currently stores HTML:

```text
content: string
```

CMS may serialize Tiptap output to HTML.

If the backend later changes to JSON:

```text
content: JSON
```

the editor adapter should be isolated.

Do not tightly couple Tiptap implementation to every component.

---

# 24. Slug

Slug should be generated automatically from title.

Example:

```text
Title:
"Next.js 16 Resmi Dirilis"

Slug:
"nextjs-16-resmi-dirilis"
```

User should still be able to manually edit the slug.

Slug must be validated by backend.

---

# 25. Excerpt

Provide a dedicated excerpt field.

Purpose:

- Article card
- Search result
- Social preview
- Public website metadata

CMS should display an appropriate character guidance indicator.

Do not enforce arbitrary limits different from backend validation.

---

# 26. Cover Image

Article editor must support cover image selection.

Flow:

```text
Article Editor
      │
      ▼
Media Picker
      │
      ├── Existing media
      │
      └── Upload new media
```

After selecting an image:

```text
media.id
```

should be associated with:

```text
cover_media_id
```

---

# 27. Media Upload

The CMS must use the backend's presigned upload endpoint.

Flow:

```text
CMS
 │
 │ POST /media/presign
 ▼
Backend
 │
 ▼
Presigned URL
 │
 ▼
CMS
 │
 │ PUT binary
 ▼
MinIO
 │
 ▼
CMS
 │
 │ POST /media
 ▼
Backend
```

The CMS MUST NOT receive or store:

```text
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
```

---

# 28. Media Library

Route:

```text
/media
```

Media library should support:

```text
Grid view
List view
Search
Pagination
Upload
Delete
Select media
```

Media card:

```text
┌───────────────────┐
│                   │
│      IMAGE        │
│                   │
├───────────────────┤
│ cover.webp        │
│ 512 KB             │
└───────────────────┘
```

---

# 29. Media Domain

CMS should use:

```env
NEXT_PUBLIC_MEDIA_URL=https://cdn.fhanafii.my.id
```

for the current testing environment.

Production later:

```env
NEXT_PUBLIC_MEDIA_URL=https://cdn.kabarkode.id
```

Do not hardcode either URL in components.

---

# 30. Next.js Image Configuration

Configure `next/image` to allow the current CDN host:

```text
cdn.fhanafii.my.id
```

Later production:

```text
cdn.kabarkode.id
```

Use `remotePatterns` rather than broad wildcard domains.

Do not allow arbitrary external image hosts.

---

# 31. Categories

Route:

```text
/categories
```

CRUD:

```text
Create
Read
Update
Delete
```

Fields:

```text
Name
Slug
Description
```

Table:

```text
Name
Slug
Description
Article Count
Created At
Actions
```

---

# 32. Tags

Route:

```text
/tags
```

CRUD:

```text
Create
Read
Update
Delete
```

Fields:

```text
Name
Slug
```

Article editor should support selecting multiple tags.

Use a searchable multi-select component.

---

# 33. Authors

Route:

```text
/authors
```

Fields:

```text
Name
Slug
Bio
Avatar
```

Author avatar should use the Media Library.

---

# 34. Source Information

Because KabarKode will publish technology news gathered from external sources, articles should preserve:

```text
Source Name
Source URL
```

CMS should provide these fields.

Example:

```text
Source:
The Verge

URL:
https://example.com/article
```

Source URL must be validated as a valid URL by backend.

Do not remove source attribution during content rewriting.

---

# 35. Article Publishing

Publishing must be an explicit action.

Example:

```text
Save Draft
Publish
Archive
```

Do not automatically publish when an article is created.

Recommended confirmation:

```text
Publish Article?

This article will become publicly available.

[Cancel] [Publish]
```

---

# 36. Article Actions

Depending on role/status:

```text
Edit
Preview
Publish
Archive
Delete
```

Destructive actions must use confirmation dialogs.

Example:

```text
Delete Article?

This action cannot be undone.

[Cancel] [Delete]
```

---

# 37. Preview

CMS should provide an article preview.

Preferred route:

```text
/articles/[id]/preview
```

The preview should render the article approximately as it will appear publicly.

Do not require the public website project to be completed before implementing a basic CMS preview.

Preview should support:

```text
Title
Excerpt
Cover
Content
Author
Category
Tags
Source
```

---

# 38. Forms

Use:

```text
React Hook Form
+
Zod
```

for forms.

Example:

```text
ArticleForm
CategoryForm
TagForm
AuthorForm
LoginForm
```

Validation should be centralized where possible.

Frontend validation improves UX.

Backend validation remains authoritative.

---

# 39. Error Handling

Every API request must handle:

```text
Loading
Success
Error
Empty
```

Example:

```text
Loading:
Skeleton

Error:
Error message + Retry

Empty:
No articles found

Success:
Data
```

Do not leave users with blank screens.

---

# 40. API Error Format

Backend uses:

```json
{
  "success": false,
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  }
}
```

CMS API client should normalize this format.

Example:

```text
API error
   │
   ▼
normalizeApiError()
   │
   ▼
UI-friendly message
```

Do not display raw stack traces.

---

# 41. Notifications

Use Sonner for transient notifications.

Examples:

```text
Article saved successfully
Article published successfully
Media uploaded successfully
Category created successfully
Failed to publish article
```

Do not use toast notifications for critical confirmations.

Use dialogs for destructive/important actions.

---

# 42. Loading UX

Use skeletons for:

```text
Article table
Dashboard cards
Media grid
Author list
```

Use disabled/loading states for:

```text
Save
Publish
Delete
Upload
Login
```

Prevent accidental duplicate submissions.

---

# 43. Responsive Design

CMS is primarily desktop-oriented.

Target:

```text
Desktop
Laptop
Tablet
```

Minimum practical support:

```text
1280px+
```

But the interface should remain usable around:

```text
1024px
768px
```

Mobile support is useful but not the primary design target.

The public KabarKode website and mobile app will have a separate responsive strategy.

---

# 44. UI Design Direction

Use a professional editorial/admin design.

Recommended characteristics:

```text
Clean
Dense but readable
Minimal
Modern
Information-focused
```

Avoid:

```text
Excessive gradients
Huge decorative elements
Excessive animations
Glassmorphism everywhere
Unnecessary dashboard charts
```

The CMS should prioritize productivity.

---

# 45. Color System

Use a neutral dashboard foundation.

Recommended:

```text
Background:
neutral/slate

Primary:
KabarKode brand color

Success:
green

Warning:
yellow/orange

Danger:
red
```

Do not hardcode colors throughout components.

Use Tailwind design tokens.

---

# 46. Component Architecture

Recommended:

```text
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   ├── dialogs/
│   └── media/
│
├── features/
│   ├── auth/
│   ├── articles/
│   ├── categories/
│   ├── tags/
│   ├── authors/
│   └── media/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── utils/
│   └── validation/
│
├── hooks/
│
├── types/
│
└── app/
```

---

# 47. Feature-Based Architecture

Business-specific components should live close to their feature.

Example:

```text
features/articles/
├── components/
│   ├── article-table.tsx
│   ├── article-form.tsx
│   ├── article-status-badge.tsx
│   ├── article-filters.tsx
│   └── article-actions.tsx
│
├── api.ts
├── hooks.ts
├── schemas.ts
├── types.ts
└── utils.ts
```

This prevents the project from becoming one giant `components/` directory.

---

# 48. Suggested Full Structure

```text
kabarkode-cms/
│
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── articles/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── edit/
│   │   │       │   └── page.tsx
│   │   │       └── preview/
│   │   │           └── page.tsx
│   │   │
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   │
│   │   ├── tags/
│   │   │   └── page.tsx
│   │   │
│   │   ├── authors/
│   │   │   └── page.tsx
│   │   │
│   │   └── media/
│   │       └── page.tsx
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   ├── dialogs/
│   └── media/
│
├── features/
│   ├── auth/
│   ├── articles/
│   ├── categories/
│   ├── tags/
│   ├── authors/
│   └── media/
│
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── articles.ts
│   │   ├── categories.ts
│   │   ├── tags.ts
│   │   ├── authors.ts
│   │   └── media.ts
│   │
│   ├── auth/
│   └── utils/
│
├── hooks/
│
├── providers/
│   └── query-provider.tsx
│
├── types/
│
├── public/
│
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── tsconfig.json
├── next.config.ts
├── components.json
└── README.md
```

---

# 49. Environment Variables

Development:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_MEDIA_URL=https://cdn.fhanafii.my.id
```

Production testing:

```env
NEXT_PUBLIC_API_URL=https://api.fhanafii.my.id
NEXT_PUBLIC_MEDIA_URL=https://cdn.fhanafii.my.id
```

Future production:

```env
NEXT_PUBLIC_API_URL=https://api.kabarkode.id
NEXT_PUBLIC_MEDIA_URL=https://cdn.kabarkode.id
```

Do not hardcode environment-specific URLs.

---

# 50. Image Handling

Use Next.js `Image` for displayed media where practical.

Configure only trusted domains.

Example:

```text
cdn.fhanafii.my.id
```

Never configure:

```text
*
```

as an unrestricted image host.

---

# 51. API Pagination

Backend pagination should be reflected in CMS.

Example query:

```text
?page=1&limit=20
```

CMS table should support:

```text
Previous
1
2
3
...
Next
```

Default:

```text
20 items/page
```

Maximum page size must follow backend constraints.

---

# 52. Search and Filters

Article search should be server-side.

Do not download all articles and filter them in the browser.

Example:

```text
GET /articles?search=nextjs
```

Filters:

```text
search
status
category
tag
author
article_type
date
```

Use URL query parameters where practical so filters can be shared/bookmarked.

---

# 53. Table Implementation

Use TanStack Table for complex tables.

Tables should support:

```text
Sorting
Pagination
Column visibility where useful
Row actions
Selection where useful
```

Do not over-engineer the table.

---

# 54. Accessibility

All interactive elements must have:

```text
Accessible labels
Keyboard navigation
Focus states
Semantic HTML
```

Dialogs must correctly trap focus.

Buttons must not rely only on icons without accessible labels.

---

# 55. Security

CMS must follow:

```text
Never expose secrets
Never expose MinIO credentials
Never expose JWT secret
Never directly access database
Never trust frontend authorization
Never trust frontend validation
Never render arbitrary unsanitized HTML
```

Rich text HTML must be sanitized appropriately before rendering.

---

# 56. XSS Protection

Article content may contain HTML.

Any HTML rendered by CMS preview must be treated as untrusted.

Use a sanitization layer before rendering arbitrary HTML.

Do not blindly use:

```typescript
dangerouslySetInnerHTML
```

without sanitization.

---

# 57. Authentication Guard

All dashboard routes must require authentication.

Unauthenticated users:

```text
/dashboard
/articles
/categories
/tags
/authors
/media
```

should be redirected to:

```text
/login
```

Do not rely exclusively on UI hiding.

Backend authorization remains mandatory.

---

# 58. Middleware / Route Protection

Use Next.js middleware/proxy capabilities where appropriate to provide early route protection.

However, middleware should not become the only security layer.

The architecture must be:

```text
CMS route protection
        +
Backend authentication
        +
Backend authorization
```

---

# 59. API Request Interceptor

Central Axios client may handle:

```text
Authentication
401 responses
API error normalization
Request configuration
```

Do not create multiple independent Axios clients unless necessary.

Recommended:

```text
src/lib/api/client.ts
```

as the central client.

---

# 60. React Query Provider

Create:

```text
providers/query-provider.tsx
```

Configure:

```text
QueryClient
```

with sensible defaults.

Avoid aggressive automatic refetching for CMS data unless useful.

For example, article lists do not need to refetch every few seconds.

---

# 61. Cache Strategy

CMS data can use TanStack Query cache.

Example:

```text
articles:
staleTime ≈ 30 seconds

categories:
staleTime ≈ several minutes

tags:
staleTime ≈ several minutes

authors:
staleTime ≈ several minutes
```

Exact values may be adjusted later.

After mutations, explicitly invalidate affected queries.

---

# 62. Article Draft Autosave

Do NOT implement autosave in the first MVP unless the backend supports it cleanly.

Initial version:

```text
Save Draft
```

must be explicit.

Future:

```text
Autosave
Revision history
Draft recovery
```

can be added later.

---

# 63. Unsaved Changes

Article editor should warn users when leaving a page with unsaved changes.

Example:

```text
You have unsaved changes.

Leave without saving?
```

This is especially important for long articles.

---

# 64. Article Editor Layout

Recommended:

```text
┌──────────────────────────────────────────────────┐
│ ← Articles                 Save Draft   Publish  │
├──────────────────────────────────────────────────┤
│                                                  │
│ Title                                            │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Slug                                             │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Content                                          │
│ ┌──────────────────────────────────────────────┐ │
│ │ Tiptap                                       │ │
│ │                                              │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
├───────────────────────────┬──────────────────────┤
│ Main Content              │ Publishing           │
│                           │                      │
│ Excerpt                   │ Status               │
│                           │ Category             │
│                           │ Author               │
│                           │ Tags                 │
│                           │ Article Type         │
│                           │ Cover Image          │
│                           │                      │
│                           │ Source               │
└───────────────────────────┴──────────────────────┘
```

Desktop editor should use a two-column layout.

---

# 65. Media Picker

When selecting a cover image:

```text
Choose Media
```

should open a dialog/drawer.

Features:

```text
Existing media
Search
Upload
Select
Cancel
```

Selected media should display:

```text
Preview
Filename
Size
```

---

# 66. Article Source

Provide dedicated source fields:

```text
Source Name
Source URL
```

Do not place source information inside article content automatically.

---

# 67. Dashboard Recent Articles

Display recent articles:

```text
Title
Status
Author
Updated At
```

Clicking an article should navigate to its editor.

---

# 68. Empty States

Every collection page must have an empty state.

Example:

```text
No articles yet.

Create your first KabarKode article.

[Create Article]
```

For search:

```text
No articles found.

Try changing your search or filters.
```

---

# 69. Error Pages

Implement:

```text
error.tsx
not-found.tsx
loading.tsx
```

where appropriate.

Provide useful recovery actions:

```text
Try Again
Back to Dashboard
```

---

# 70. Toast vs Dialog

Use toast for:

```text
Success
Non-critical errors
Background status
```

Use dialog for:

```text
Delete
Publish
Archive
Discard changes
```

---

# 71. Performance

Avoid:

```text
Fetching all articles
Rendering huge tables
Loading all media simultaneously
Large client components
Unnecessary global state
```

Use:

```text
Server pagination
Lazy loading
Pagination
React Query caching
Next/Image
Code splitting where useful
```

---

# 72. SEO

SEO is NOT a priority for the CMS.

Do not spend development time implementing:

```text
Open Graph
JSON-LD
Sitemap
Article SEO
```

Those belong to the future public KabarKode website.

---

# 73. Analytics

No analytics implementation is required for the CMS MVP.

Public website analytics will be implemented separately.

---

# 74. Internationalization

Do not implement i18n in the MVP.

CMS interface can initially be:

```text
Bahasa Indonesia
```

or English depending on implementation preference.

Keep UI strings centralized enough that i18n can be introduced later.

---

# 75. Testing

Minimum testing:

```text
Login
Authentication guard
Article creation
Article editing
Article deletion
Article publishing
Category CRUD
Tag CRUD
Author CRUD
Media upload
Media deletion
Form validation
API error handling
```

Recommended:

```text
Vitest
Testing Library
Playwright
```

Use Playwright for critical end-to-end flows.

---

# 76. Critical E2E Flow

At minimum test:

```text
Open CMS
    ↓
Login
    ↓
Dashboard
    ↓
Create Article
    ↓
Upload Cover
    ↓
Enter Content
    ↓
Save Draft
    ↓
Edit Article
    ↓
Publish
    ↓
Verify Published State
```

---

# 77. Docker

CMS should be containerizable.

Production architecture:

```text
Vercel
   │
   ▼
KabarKode CMS
   │
   ▼
KabarKode API
```

If deployed to Vercel, Docker is not required for deployment.

However, maintain a Dockerfile if self-hosting becomes necessary.

---

# 78. Deployment

Development:

```text
localhost
```

Testing:

```text
cms.fhanafii.my.id
```

Production:

```text
admin.kabarkode.id
```

The CMS should NOT be exposed publicly as the main website.

---

# 79. Domain Architecture

Current testing:

```text
fhanafii.my.id
│
├── cms.fhanafii.my.id
├── api.fhanafii.my.id
└── cdn.fhanafii.my.id
```

Future:

```text
kabarkode.id
│
├── admin.kabarkode.id
├── api.kabarkode.id
└── cdn.kabarkode.id
```

The current `fhanafii.my.id` domains are only for development/testing.

---

# 80. Project Naming

Recommended:

```text
kabarkode-cms
```

Package name:

```text
@kabarkode/cms
```

if using a package namespace is desired.

Do not introduce a monorepo yet.

A separate repository is preferred for the current stage.

---

# 81. Git Requirements

Recommended branches:

```text
main
dev
```

Development flow:

```text
feature/*
    ↓
dev
    ↓
main
```

Do not commit:

```text
.env
.env.local
JWT secrets
API credentials
MinIO credentials
```

---

# 82. Environment Files

Use:

```text
.env.local
.env.example
```

`.env.example` may contain placeholders:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_MEDIA_URL=
```

Never put production secrets into `.env.example`.

---

# 83. Code Quality

Use:

```text
ESLint
Prettier
TypeScript strict mode
```

Avoid:

```text
any
```

unless there is a documented reason.

Prefer:

```text
unknown
```

with proper narrowing.

---

# 84. Type Safety

Types should reflect backend API contracts.

Example:

```typescript
type ArticleStatus =
  | "draft"
  | "published"
  | "archived";

type ArticleType =
  | "news"
  | "analysis"
  | "tutorial"
  | "security"
  | "release";
```

Do not use arbitrary strings throughout the application.

---

# 85. API Types

Centralize API response types.

Example:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

# 86. Backend Contract

CMS implementation must follow the existing KabarKode Backend API.

Do not modify backend behavior merely to simplify the frontend.

If an API contract is missing, document the required endpoint/response before implementing a frontend workaround.

Do not bypass the API by connecting directly to PostgreSQL.

---

# 87. MVP Scope

The CMS MVP consists of:

### Authentication

- [ ] Login
- [ ] Logout
- [ ] Authentication guard
- [ ] Role handling

### Dashboard

- [ ] Statistics
- [ ] Recent articles

### Articles

- [ ] Article list
- [ ] Search
- [ ] Filters
- [ ] Pagination
- [ ] Create article
- [ ] Edit article
- [ ] Delete article
- [ ] Save draft
- [ ] Publish
- [ ] Archive
- [ ] Preview

### Editor

- [ ] Tiptap
- [ ] Formatting
- [ ] Links
- [ ] Images
- [ ] Code blocks
- [ ] Excerpt
- [ ] Slug

### Categories

- [ ] CRUD

### Tags

- [ ] CRUD

### Authors

- [ ] CRUD

### Media

- [ ] Media library
- [ ] Upload
- [ ] Select
- [ ] Delete
- [ ] Preview

### UX

- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Toasts
- [ ] Confirmation dialogs
- [ ] Unsaved changes warning
- [ ] Responsive layout

---

# 88. Phase Plan

## Phase 1 — Project Initialization

- [ ] Create `kabarkode-cms`
- [ ] Initialize Next.js
- [ ] Configure TypeScript
- [ ] Configure Tailwind
- [ ] Configure shadcn/ui
- [ ] Configure ESLint
- [ ] Configure environment variables
- [ ] Create basic layout

---

## Phase 2 — Application Shell

- [ ] Dashboard layout
- [ ] Sidebar
- [ ] Header
- [ ] User menu
- [ ] Responsive navigation
- [ ] Route groups
- [ ] Loading states

---

## Phase 3 — API Layer

- [ ] Axios client
- [ ] API error normalization
- [ ] Authentication integration
- [ ] Article API
- [ ] Category API
- [ ] Tag API
- [ ] Author API
- [ ] Media API

---

## Phase 4 — Authentication

- [ ] Login page
- [ ] Login API integration
- [ ] Session handling
- [ ] Logout
- [ ] Route protection
- [ ] Role handling

---

## Phase 5 — Dashboard

- [ ] Statistics cards
- [ ] Recent articles
- [ ] Dashboard loading states
- [ ] Dashboard error states

---

## Phase 6 — Article Management

- [ ] Article table
- [ ] Search
- [ ] Filters
- [ ] Pagination
- [ ] Status badges
- [ ] Actions

---

## Phase 7 — Article Editor

- [ ] Create article
- [ ] Edit article
- [ ] Tiptap integration
- [ ] Slug generation
- [ ] Excerpt
- [ ] Category
- [ ] Tags
- [ ] Author
- [ ] Article type
- [ ] Source
- [ ] Cover image
- [ ] Save draft
- [ ] Publish
- [ ] Archive

---

## Phase 8 — Media

- [ ] Media library
- [ ] Upload
- [ ] Presigned upload
- [ ] Media selection
- [ ] Delete
- [ ] CDN preview
- [ ] Image configuration

---

## Phase 9 — Taxonomy

- [ ] Categories CRUD
- [ ] Tags CRUD
- [ ] Authors CRUD

---

## Phase 10 — Preview

- [ ] Article preview
- [ ] Preview layout
- [ ] Cover image
- [ ] Content rendering
- [ ] Metadata display

---

## Phase 11 — UX Hardening

- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Toasts
- [ ] Confirmation dialogs
- [ ] Unsaved changes warning
- [ ] Accessibility
- [ ] Responsive behavior

---

## Phase 12 — Testing

- [ ] Unit tests
- [ ] Component tests
- [ ] API integration tests
- [ ] Playwright E2E
- [ ] Critical article publishing flow

---

## Phase 13 — Deployment

- [ ] Production environment
- [ ] `cms.fhanafii.my.id`
- [ ] Cloudflare configuration
- [ ] API CORS configuration
- [ ] Production environment variables
- [ ] Vercel deployment
- [ ] Final smoke testing

---

# 89. Definition of Done

CMS MVP is complete when:

- [ ] Admin can login
- [ ] Editor can login according to backend permissions
- [ ] Dashboard works
- [ ] Articles can be created
- [ ] Articles can be edited
- [ ] Articles can be saved as draft
- [ ] Articles can be published
- [ ] Articles can be archived
- [ ] Articles can be deleted
- [ ] Categories can be managed
- [ ] Tags can be managed
- [ ] Authors can be managed
- [ ] Images can be uploaded
- [ ] Images are uploaded directly to MinIO using presigned URLs
- [ ] Media metadata is stored in PostgreSQL
- [ ] Images are displayed through `cdn.fhanafii.my.id`
- [ ] Cloudflare cached images work
- [ ] Article preview works
- [ ] Search works
- [ ] Filtering works
- [ ] Pagination works
- [ ] Form validation works
- [ ] API errors are handled
- [ ] Loading states exist
- [ ] Empty states exist
- [ ] Destructive actions require confirmation
- [ ] Authentication is protected
- [ ] Role permissions are respected
- [ ] No database credentials exist in the frontend
- [ ] No MinIO credentials exist in the frontend
- [ ] No secrets are committed
- [ ] Production deployment works

---

# 90. Important Architectural Rules

The agent MUST follow these rules.

### Rule 1

CMS must communicate only with the KabarKode Backend API.

```text
CMS → Backend → Database
CMS → Backend → MinIO
```

Never:

```text
CMS → PostgreSQL
CMS → MinIO credentials
```

---

### Rule 2

The CMS is a separate project.

Do not combine CMS with:

```text
public website
mobile application
backend
```

---

### Rule 3

The public KabarKode website will be developed later.

Do not build public SEO features into the CMS.

---

### Rule 4

The future public client may be React Native.

Therefore, the CMS must not introduce API assumptions that prevent:

```text
React Native Web
React Native Android
React Native iOS
```

from consuming the same backend API.

---

### Rule 5

Backend remains the source of truth for:

```text
Authentication
Authorization
Validation
Article state
Publishing
Media permissions
```

---

### Rule 6

Frontend validation is for UX.

Backend validation is authoritative.

---

### Rule 7

Do not expose infrastructure credentials.

The frontend may know:

```text
API URL
Public CDN URL
```

but must never know:

```text
DATABASE_URL
JWT_SECRET
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
```

---

# 91. Future Architecture

Once CMS MVP is complete:

```text
                         KabarKode Backend
                                │
                ┌───────────────┼────────────────┐
                │               │                │
                ▼               ▼                ▼
          KabarKode CMS    KabarKode Web    KabarKode App
             Next.js       React Native      React Native
                │               │                │
                └───────────────┴────────────────┘
                                │
                                ▼
                         REST API Contract
```

The important objective is that **CMS, website, and mobile application are clients of the same backend**, rather than each having separate business logic.

---

# 92. Final Technology Stack

```text
CMS Framework
Next.js

Language
TypeScript

UI
Tailwind CSS
shadcn/ui
Lucide React

Server State
TanStack Query

HTTP
Axios

Forms
React Hook Form

Validation
Zod

Rich Text
Tiptap

Tables
TanStack Table

Charts
Recharts

Dates
date-fns

Notifications
Sonner

Testing
Vitest
Testing Library
Playwright

Deployment
Vercel

Backend
KabarKode Express API

Database
PostgreSQL / Supabase

Media
MinIO

Media CDN
Cloudflare
```

---

# 93. Final Development Priority

Do not attempt to implement everything simultaneously.

Recommended order:

```text
1. Project setup
       ↓
2. Dashboard shell
       ↓
3. API client
       ↓
4. Authentication
       ↓
5. Article list
       ↓
6. Article editor
       ↓
7. Media upload
       ↓
8. Categories / Tags / Authors
       ↓
9. Publishing workflow
       ↓
10. Preview
       ↓
11. UX hardening
       ↓
12. Testing
       ↓
13. Deployment
```

The most important milestone is:

```text
Login
  ↓
Create Article
  ↓
Upload Cover
  ↓
Write Content
  ↓
Save Draft
  ↓
Edit
  ↓
Publish
```

This complete workflow must work reliably before adding secondary features.