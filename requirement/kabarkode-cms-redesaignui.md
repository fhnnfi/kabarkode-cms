# KabarKode CMS — UI/UX Redesign Requirements

## 1. Overview

Project:

**KabarKode CMS**

Status:

- CMS MVP sudah berjalan
- Backend API sudah berjalan
- Authentication sudah berjalan
- Article CRUD sudah berjalan
- Media upload sudah berjalan
- Category/Tag/Author management sudah berjalan

Task ini **bukan membuat ulang CMS dari nol**.

Task ini adalah **full UI/UX redesign** terhadap CMS yang sudah ada.

Fokus utama:

> Membuat KabarKode CMS terasa seperti produk editorial profesional, modern, premium, dan sangat nyaman digunakan oleh editor yang bekerja dengan banyak artikel.

Jangan mengubah business logic atau API contract kecuali benar-benar diperlukan untuk mendukung UX.

---

# 2. Main Design Direction

KabarKode bukan sekadar dashboard CRUD.

CMS harus terasa seperti:

```text
Editorial Workspace
+
Developer-focused Product
+
Modern SaaS Dashboard
```

UI harus mengutamakan:

1. Speed
2. Clarity
3. Discoverability
4. Minimal interaction
5. Visual hierarchy
6. Keyboard-friendly workflow
7. Drag & drop
8. Contextual actions
9. Reduced dropdown dependency
10. Strong KabarKode branding

---

# 3. Current UX Problems To Solve

Redesign harus secara khusus menyelesaikan masalah berikut:

### Problem 1 — Too many dropdowns

UI saat ini terlalu sering menggunakan dropdown untuk memilih:

- Category
- Tags
- Author
- Article type
- Status
- Media
- Actions

Dropdown tidak boleh menjadi solusi default.

Gunakan alternatif seperti:

```text
Command palette
Combobox
Searchable popover
Chips
Inline selection
Segmented control
Tabs
Contextual action
Drag & drop
```

Gunakan dropdown hanya jika memang merupakan pola UX yang paling tepat.

---

### Problem 2 — Image upload terlalu primitive

Jangan gunakan hanya:

```text
[ Upload Image ]
```

sebagai pengalaman utama.

Gunakan visual upload area:

```text
┌─────────────────────────────────────────────┐
│                                             │
│                    ↓                        │
│             Drop image here                 │
│                                             │
│       or click to browse from device        │
│                                             │
│       JPG · PNG · WEBP · AVIF · Max 10MB    │
│                                             │
└─────────────────────────────────────────────┘
```

Upload area harus mendukung:

- Drag & drop
- Click to browse
- Paste image where practical
- Upload progress
- Preview
- Remove
- Replace
- Error state

---

### Problem 3 — CRUD feeling

Jangan membuat setiap halaman terasa seperti:

```text
Table
+
Dropdown
+
Button
+
Modal
```

CMS harus terasa seperti satu workspace yang terintegrasi.

---

### Problem 4 — Too much navigation

User tidak boleh terlalu sering berpindah halaman hanya untuk menyelesaikan satu task.

Contoh:

```text
Create Article
→ Category
→ Categories page
→ Create category
→ Back
→ Article
```

Sebisa mungkin:

```text
Create Article
        │
        ▼
Category field
        │
        ▼
[ + Create Category ]
        │
        ▼
Inline dialog
        │
        ▼
Category created
        │
        ▼
Automatically selected
```

---

# 4. Brand Identity

KabarKode harus memiliki visual identity yang kuat.

Primary brand mark:

```text
┌─────┐
│ K</>│
└─────┘
```

Konsep:

- Huruf `K` = Kabar
- `</>` = Kode
- Kotak = sistem / platform / teknologi
- Black background
- White `K</>`

Logo harus terasa:

```text
Technical
Editorial
Minimal
Bold
Modern
Developer-oriented
```

---

# 5. Logo Specification

Primary logo:

```text
┌──────────┐
│          │
│   K</>   │
│          │
└──────────┘
```

Background:

```text
#000000
```

Foreground:

```text
#FFFFFF
```

Typography:

- Bold
- Geometric
- Monospace-inspired where appropriate
- Strong visual weight

The `</>` symbol should feel integrated with `K`, not like a separate generic code icon.

---

# 6. Logo Usage

The logo should appear in:

- Sidebar
- Login page
- Loading screen where appropriate
- Browser/app branding
- Empty states where appropriate

Sidebar:

```text
┌─────────────────────────────┐
│ ┌─────┐                      │
│ │K</> │  KabarKode           │
│ └─────┘                      │
│                             │
│ Overview                    │
│                             │
│ ✦ Dashboard                 │
│                             │
│ CONTENT                     │
│   Articles                  │
│   Media                     │
│   Categories                │
│   Tags                      │
│   Authors                   │
│                             │
└─────────────────────────────┘
```

---

# 7. Color System

Primary brand:

```text
Black
#000000
```

White:

```text
#FFFFFF
```

Use a sophisticated neutral system:

```text
Background:
#F7F7F5

Surface:
#FFFFFF

Border:
#E7E7E5

Primary text:
#111111

Secondary text:
#6B6B6B

Muted:
#999999
```

Avoid making the entire interface pure black.

Black should be used as a strong branding/action color.

---

# 8. Accent Color

The UI should have one subtle accent color derived from the KabarKode identity.

Recommended:

```text
Electric green:
#A3FF12
```

Use it sparingly for:

- Active indicators
- Focus states
- Success states where appropriate
- Small brand highlights
- Editor status indicators
- Interactive accents

Do NOT make the entire dashboard neon green.

The visual hierarchy should remain mostly:

```text
Black
White
Neutral
Small green accents
```

---

# 9. Typography

Recommended:

### UI

Use a modern sans-serif.

Example:

```text
Inter
```

### Technical content

Use:

```text
JetBrains Mono
```

for:

- Code
- Slugs
- URLs
- Technical metadata
- Keyboard shortcuts

Typography should create a clear difference between:

```text
Editorial content
```

and:

```text
Technical metadata
```

---

# 10. Design Philosophy

The interface should follow:

> "Show the user what they need, when they need it."

Avoid showing every possible control at once.

Use:

```text
Progressive disclosure
```

Example:

Instead of:

```text
[ Edit ] [ Delete ] [ Publish ] [ Archive ] [ Duplicate ] [ More ]
```

use:

```text
[ Edit ] [ Publish ] [ ... ]
```

with secondary actions inside the contextual menu.

---

# 11. Global Layout

Desktop layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Sidebar │ Header                                        │
│         ├───────────────────────────────────────────────┤
│         │                                               │
│         │ Main Workspace                                │
│         │                                               │
│         │                                               │
│         │                                               │
│         │                                               │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

Sidebar:

- Fixed
- Collapsible
- Persistent on desktop

Main content:

- Fluid
- Max-width based on page type
- Comfortable whitespace

---

# 12. Sidebar

Sidebar should not feel like a generic admin template.

Design:

```text
┌─────────────────────────────┐
│ ┌─────┐                     │
│ │ K</>│ KabarKode           │
│ └─────┘                     │
│                             │
│ WORKSPACE                   │
│                             │
│  Dashboard                  │
│  Articles                   │
│  Media                      │
│                             │
│ ORGANIZE                    │
│                             │
│  Categories                 │
│  Tags                       │
│  Authors                    │
│                             │
│                             │
│ ─────────────────────────── │
│                             │
│  ● Fahmi                    │
│    Admin                    │
└─────────────────────────────┘
```

Use section labels instead of excessive visual separators.

---

# 13. Sidebar Interaction

Support:

### Expanded

```text
[K</>] KabarKode

Dashboard
Articles
Media
Categories
Tags
Authors
```

### Collapsed

```text
[K</>]

⌂
▤
▧
#
@
```

Icons must have tooltips in collapsed mode.

---

# 14. Top Header

Header should contain contextual information.

Example:

```text
┌──────────────────────────────────────────────────────────┐
│ Articles / Edit Article                ⌘ K    ● Fahmi     │
└──────────────────────────────────────────────────────────┘
```

Possible elements:

- Breadcrumb
- Search / command shortcut
- Save state
- User menu

Do not fill the header with unnecessary controls.

---

# 15. Command Palette

Implement a global command palette.

Shortcut:

```text
⌘ K
```

Mac

and:

```text
Ctrl K
```

Windows/Linux.

Example:

```text
┌─────────────────────────────────────────┐
│ Search KabarKode...                     │
├─────────────────────────────────────────┤
│                                         │
│ CREATE                                  │
│   New Article                            │
│   Upload Media                           │
│                                         │
│ NAVIGATE                                │
│   Articles                               │
│   Media                                  │
│   Categories                             │
│   Tags                                   │
│                                         │
│ ACTIONS                                 │
│   Publish current article               │
└─────────────────────────────────────────┘
```

This should reduce unnecessary navigation and dropdown usage.

---

# 16. Dashboard Redesign

Dashboard should not simply display statistic cards.

It should feel like an editorial control center.

Example:

```text
┌────────────────────────────────────────────────────┐
│ Good evening, Fahmi.                               │
│ Here's what's happening with KabarKode.            │
├────────────────────────────────────────────────────┤
│                                                    │
│ 128 Articles     97 Published     24 Draft         │
│                                                    │
├──────────────────────────┬─────────────────────────┤
│ Recent Articles           │ Quick Actions           │
│                          │                         │
│ Next.js 16...            │ + New Article           │
│ React 20...              │ Upload Media            │
│ CVE-2026...              │                         │
│                          │                         │
└──────────────────────────┴─────────────────────────┘
```

---

# 17. Dashboard Quick Actions

Provide prominent quick actions:

```text
+ New Article
Upload Media
```

Do not create 10 quick action buttons.

Only surface frequently used operations.

---

# 18. Articles Page

Redesign article management into an editorial workspace.

Top:

```text
Articles

Manage your stories and publishing workflow.

[ Search articles... ]                [+ New Article]
```

Below:

```text
All     Drafts     Published     Archived
```

Tabs should replace status dropdowns where practical.

---

# 19. Article Filters

Instead of multiple visible dropdowns:

```text
Status ▼
Category ▼
Author ▼
Type ▼
Date ▼
```

use:

```text
[ Search... ] [ Filters + ]
```

Clicking Filters opens:

```text
┌───────────────────────────────┐
│ Filters                       │
│                               │
│ Status                        │
│ ○ All                         │
│ ○ Draft                       │
│ ○ Published                   │
│ ○ Archived                    │
│                               │
│ Category                      │
│ [ Search category... ]        │
│                               │
│ Author                        │
│ [ Search author... ]          │
│                               │
│ Article Type                  │
│ [ News ] [ Security ] [...]   │
│                               │
│          Reset    Apply       │
└───────────────────────────────┘
```

---

# 20. Article List

Avoid an overly dense traditional data table.

Recommended editorial list:

```text
┌─────────────────────────────────────────────────────┐
│ Article                              Status   Date   │
├─────────────────────────────────────────────────────┤
│ ┌────┐ Next.js 16 officially...     Published       │
│ │IMG │ Framework · Fahmi             2h ago          │
│ └────┘                                               │
├─────────────────────────────────────────────────────┤
│ ┌────┐ New CVE affects...            Draft           │
│ │IMG │ Security · Fahmi              Yesterday       │
│ └────┘                                               │
└─────────────────────────────────────────────────────┘
```

Use a table only when it improves information density.

---

# 21. Article Editor

This is the most important UX redesign.

The article editor should feel like a professional writing environment.

Do NOT create a long traditional form.

Instead:

```text
┌───────────────────────────────────────────────────────────┐
│ ← Articles                       Saved · Draft     Publish │
├───────────────────────────────────────────────┬────────────┤
│                                               │            │
│  Write your story                             │ Publishing │
│                                               │            │
│  Article title                                │ Status     │
│                                               │ Draft      │
│                                               │            │
│  Short description...                         │ Category   │
│                                               │            │
│  ───────────────────────────────────────────   │            │
│                                               │ Author     │
│  Tiptap editor                                │            │
│                                               │ Tags       │
│                                               │            │
│                                               │ Cover      │
│                                               │            │
│                                               │ Source     │
└───────────────────────────────────────────────┴────────────┘
```

---

# 22. Article Title

Title should not look like a normal form input.

Use a large editorial title:

```text
What's happening in the world of code?
```

Typography:

```text
48px+
font-weight: 700
line-height: 1.1
```

On smaller screens:

```text
32px
```

---

# 23. Article Excerpt

Place excerpt directly below title.

Example:

```text
Write a concise description of this article...
```

Make it visually secondary.

---

# 24. Slug UX

Do not always show slug as a large visible form field.

Use:

```text
Slug
kabarkode.dev/nextjs-16-release
[Edit]
```

Clicking Edit opens an inline editor.

This reduces visual clutter.

---

# 25. Save State

The editor should display save state.

Examples:

```text
● Saved
● Saving...
● Unsaved changes
```

Use subtle visual indicators.

Do not force the user to wonder whether their work has been saved.

---

# 26. Publishing Header

Publish should always be visible.

Example:

```text
Saved · Draft                         [Preview] [Publish]
```

Publish is the primary action.

Save Draft can be secondary.

---

# 27. Cover Image UX

This must be redesigned completely.

DO NOT use:

```text
[Upload Cover]
```

as the only interaction.

Use a visual dropzone.

Empty:

```text
┌─────────────────────────────────────────────┐
│                                             │
│                 ↓                           │
│                                             │
│          Drop cover image here              │
│                                             │
│       or click to browse                    │
│                                             │
│     JPG · PNG · WEBP · AVIF · Max 10MB      │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 28. Drag & Drop Behavior

When dragging an image over the area:

```text
┌─────────────────────────────────────────────┐
│                                             │
│          Drop image to upload               │
│                                             │
└─────────────────────────────────────────────┘
```

The border should visually react.

Use subtle animation.

Do not use excessive bouncing effects.

---

# 29. Upload State

After selecting:

```text
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │               IMAGE                     │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ uploading.webp                              │
│ ███████████████░░░░ 72%                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 30. Uploaded State

After upload:

```text
┌─────────────────────────────────────────────┐
│                                             │
│                  IMAGE                      │
│                                             │
│                                             │
│                         Replace   Remove    │
└─────────────────────────────────────────────┘
```

Actions should appear on hover/focus.

---

# 31. Media Library Interaction

When choosing existing media:

```text
[ Choose from Media Library ]
```

should open a large media picker.

Layout:

```text
┌──────────────────────────────────────────────┐
│ Select Media                                  │
│                                               │
│ [ Search media... ]                           │
│                                               │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                 │
│ │IMG │ │IMG │ │IMG │ │IMG │                  │
│ └────┘ └────┘ └────┘ └────┘                 │
│                                               │
│                         [Cancel] [Select]     │
└──────────────────────────────────────────────┘
```

---

# 32. Inline Creation

Avoid forcing users to leave context.

Example:

Category field:

```text
Category

[ Technology                     ]

+ Create new category
```

Click:

```text
+ Create new category
```

opens a small contextual dialog.

After creation:

```text
Technology ✓
```

automatically selected.

Apply the same principle where practical to:

- Categories
- Tags
- Authors

---

# 33. Tags UX

Tags should use chips rather than a generic multi-select dropdown.

Example:

```text
Tags

[ React ] [ Next.js ] [ TypeScript ] [+ Add]
```

Click Add:

```text
Search or create tag...
```

Allow:

```text
Existing tag
Create new tag
```

---

# 34. Category UX

Use a searchable popover.

Example:

```text
Category

┌───────────────────────────┐
│ Search category...        │
├───────────────────────────┤
│ Development               │
│ AI                        │
│ Security                  │
│ Open Source               │
│                           │
│ + Create category         │
└───────────────────────────┘
```

---

# 35. Author UX

Use an avatar + name presentation.

Example:

```text
Author

┌─────────────────────────────┐
│ [avatar] Fahmi Hanafi       │
│          @fhanalabs         │
└─────────────────────────────┘
```

Do not use a plain text dropdown.

---

# 36. Article Type UX

Use segmented controls when the number of options is small.

Example:

```text
Type

[ News ] [ Analysis ] [ Tutorial ]

[ Security ] [ Release ]
```

Selected state should be visually obvious.

---

# 37. Status UX

Do not make status a normal dropdown.

Status should be controlled through explicit actions:

```text
Draft
    ↓
Publish
    ↓
Published
    ↓
Archive
```

This better represents the workflow.

---

# 38. Source UX

Source section:

```text
Source

[ The Verge                              ]

https://example.com/article
```

Use a compact metadata section.

---

# 39. Editor Toolbar

Toolbar should remain compact.

Example:

```text
B  I  U  S  |  H1 H2  • 1.  |  🔗  <>  "  ─
```

Avoid making the toolbar consume excessive vertical space.

Toolbar may become sticky while editing.

---

# 40. Slash Commands

Consider implementing slash commands in Tiptap.

Example:

```text
/
```

opens:

```text
┌──────────────────────────────┐
│ Add block                    │
├──────────────────────────────┤
│ Heading 1                    │
│ Heading 2                    │
│ Bullet List                  │
│ Code Block                   │
│ Quote                        │
│ Image                        │
└──────────────────────────────┘
```

This is especially useful for developer-oriented editorial content.

---

# 41. Code Block UX

Code blocks should visually differ from normal text.

Example:

```text
┌──────────────────────────────────────┐
│ TypeScript                     Copy   │
├──────────────────────────────────────┤
│ const app = express();               │
│ app.listen(3000);                    │
└──────────────────────────────────────┘
```

Include copy button.

---

# 42. Keyboard Shortcuts

CMS should support common shortcuts:

```text
Ctrl/Cmd + K
Command palette

Ctrl/Cmd + S
Save draft

Ctrl/Cmd + Enter
Publish confirmation
```

Do not override browser/system shortcuts unnecessarily.

---

# 43. Unsaved Changes

When navigating away with unsaved article changes:

```text
┌────────────────────────────────────┐
│ Unsaved changes                    │
│                                    │
│ Your article has unsaved changes.  │
│                                    │
│ [Stay] [Discard changes]           │
└────────────────────────────────────┘
```

---

# 44. Mobile / Tablet

CMS is desktop-first but must remain usable on tablet.

On smaller screens:

Sidebar:

```text
drawer
```

Editor:

```text
single column
```

Metadata:

```text
collapsible sections
```

Do not simply shrink the desktop layout.

---

# 45. Media Library Redesign

Media should feel like a visual asset manager.

Header:

```text
Media

Manage your article images and assets.

[ Search media... ]                  [ Upload Media ]
```

Main:

```text
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ IMG  │ │ IMG  │ │ IMG  │ │ IMG  │
│      │ │      │ │      │ │      │
└──────┘ └──────┘ └──────┘ └──────┘
```

---

# 46. Media Upload Page

Large dropzone:

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│                  ↑                              │
│                                                 │
│             Drop files here                    │
│                                                 │
│       or click to browse files                 │
│                                                 │
│                                                 │
│ JPG · PNG · WEBP · AVIF                        │
│ Maximum 10 MB per file                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

Allow multiple images where backend supports it.

If multiple upload is not supported by the current API, implement sequential uploads through the existing presigned flow.

---

# 47. Upload Queue

For multiple files:

```text
Uploads

┌────────────────────────────────────────────┐
│ cover-1.webp        ██████████ 100% ✓      │
│ article-2.webp      ███████░░░ 72%         │
│ image-3.webp        Waiting...              │
└────────────────────────────────────────────┘
```

---

# 48. Media Preview

Clicking an image opens a detail panel:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                    IMAGE                     │
│                                              │
├──────────────────────────────────────────────┤
│ filename.webp                                │
│ 1280 × 720                                    │
│ 482 KB                                        │
│ image/webp                                    │
│                                              │
│ URL                                           │
│ https://cdn.fhanafii.my.id/...               │
│                                              │
│ [Copy URL]                       [Delete]     │
└──────────────────────────────────────────────┘
```

---

# 49. Categories Page

Do not make it a generic CRUD table.

Use:

```text
Categories

Organize your editorial content.

[ Search categories... ]          [+ New Category]
```

List:

```text
Development          32 articles
AI                    18 articles
Security              14 articles
Open Source           21 articles
```

---

# 50. Tags Page

Use compact tag cards/chips.

Example:

```text
[ React × ] [ Next.js × ] [ TypeScript × ]
[ AI × ] [ Kubernetes × ] [ Docker × ]
```

Clicking a tag shows article usage.

---

# 51. Authors Page

Use profile cards rather than a dense table where practical.

```text
┌──────────────────────┐
│      [Avatar]        │
│                      │
│   Fahmi Hanafi       │
│   42 articles        │
│                      │
│   View profile →     │
└──────────────────────┘
```

---

# 52. Empty States

Empty states should reinforce the brand.

Example:

```text
┌─────┐
│ K</>│
└─────┘

No articles yet.

Your first story starts here.

[ Create Article ]
```

Avoid generic:

```text
"No data found"
```

---

# 53. Loading States

Use skeletons that match actual content shape.

Do not show a giant spinner in the middle of the screen for every request.

Example article skeleton:

```text
████████████████████████
██████████████

████████████████████████████████
████████████████████████
```

---

# 54. Error States

Example:

```text
Something went wrong.

We couldn't load your articles.

[ Try again ]
```

Do not expose technical stack traces.

---

# 55. Micro-interactions

Use subtle animation for:

- Dropdown/popover opening
- Dialog
- Sidebar collapse
- Drag & drop
- Upload progress
- Toast
- Save state
- Hover states

Recommended duration:

```text
150ms – 250ms
```

Avoid excessive animations.

---

# 56. Hover States

Interactive elements should clearly respond to hover.

Especially:

- Article rows
- Media cards
- Sidebar items
- Buttons
- Chips
- Action menus

---

# 57. Focus States

Keyboard focus must be visible.

Use a strong but tasteful focus ring.

Do not remove:

```css
outline: none;
```

without replacing it with an accessible focus indicator.

---

# 58. Accessibility

Follow basic WCAG principles.

Requirements:

- Keyboard navigation
- Visible focus
- Proper labels
- Semantic buttons
- Accessible dialogs
- Accessible drag/drop fallback
- Screen-reader-friendly status messages

Drag & drop must ALWAYS have a click-to-upload fallback.

---

# 59. Do Not Overuse Modals

Use modal/dialog for:

- Confirmation
- Small contextual creation
- Media picker
- Important focused tasks

Do not use modal for every CRUD operation.

For example:

Category editing can use an inline side panel if it provides a better workflow.

---

# 60. Drawer / Side Panel

Use side panels for contextual editing where useful.

Example:

```text
┌───────────────────────────────┬───────────────────────┐
│ Articles                      │ Edit Category         │
│                               │                       │
│ ...                           │ Name                  │
│ ...                           │ [ Security ]          │
│                               │                       │
│                               │ Description           │
│                               │                       │
│                               │ [Cancel] [Save]       │
└───────────────────────────────┴───────────────────────┘
```

This keeps the user in context.

---

# 61. Responsive Sidebar

Desktop:

```text
Expanded
```

Tablet:

```text
Collapsed
```

Mobile:

```text
Drawer
```

---

# 62. User Profile Menu

Bottom/sidebar user area:

```text
┌────────────────────────────┐
│ [Avatar] Fahmi Hanafi      │
│          Admin             │
│                            │
│ Profile                    │
│ Keyboard shortcuts         │
│ Logout                     │
└────────────────────────────┘
```

Keep it simple.

---

# 63. Login Page

Login page should establish the brand immediately.

Example:

```text
┌────────────────────────────────────────────────────┐
│                                                    │
│                    ┌─────┐                         │
│                    │K</> │                         │
│                    └─────┘                         │
│                                                    │
│                    KabarKode                       │
│               Editorial Workspace                  │
│                                                    │
│        ┌──────────────────────────────────┐        │
│        │ Email                            │        │
│        └──────────────────────────────────┘        │
│                                                    │
│        ┌──────────────────────────────────┐        │
│        │ Password                         │        │
│        └──────────────────────────────────┘        │
│                                                    │
│        ┌──────────────────────────────────┐        │
│        │             Sign in              │        │
│        └──────────────────────────────────┘        │
│                                                    │
└────────────────────────────────────────────────────┘
```

Use the black `K</>` logo prominently.

---

# 64. Branding Copy

Use consistent terminology.

Preferred:

```text
KabarKode
Editorial Workspace
Stories
Articles
Media
Publishing
```

Avoid generic:

```text
Admin Panel
CRUD
Manage Data
```

The interface should feel like a professional editorial product.

---

# 65. Article Terminology

Use:

```text
Article
Story
Publish
Draft
Archive
Preview
Media
```

Avoid overly technical wording for editors.

---

# 66. Status Language

Use:

```text
Draft
Published
Archived
Saving...
Saved
```

Do not expose backend enum terminology unnecessarily.

---

# 67. Destructive Actions

Delete/archive must clearly communicate consequences.

Delete:

```text
This article will be permanently deleted.
```

Archive:

```text
This article will no longer be publicly visible.
```

---

# 68. Confirmation Design

Primary destructive button should clearly communicate action:

```text
[ Delete article ]
```

not:

```text
[ Confirm ]
```

---

# 69. Article Metadata Sidebar

The sidebar should remain compact.

Recommended sections:

```text
Publishing
├── Status
├── Publish date

Organization
├── Category
├── Tags
├── Author
├── Type

Media
└── Cover

Source
├── Source name
└── Source URL
```

Each section can be collapsible.

---

# 70. Sticky Editor Sidebar

On desktop:

```text
Editor content                 Metadata
       │                          │
       │                          │
       │                          │
       ▼                          ▼
```

Metadata sidebar may remain sticky while scrolling.

This improves long article editing.

---

# 71. Article Preview

Preview should feel like the public article.

Example:

```text
┌─────────────────────────────────────────────┐
│ KabarKode                                   │
│                                             │
│ Next.js 16 Resmi Dirilis                    │
│                                             │
│ Framework · 3 September 2026                │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │                 COVER                   │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Article content...                          │
└─────────────────────────────────────────────┘
```

---

# 72. Design Tokens

Do not hardcode design values everywhere.

Create centralized tokens for:

```text
Colors
Spacing
Radius
Typography
Shadows
Transitions
```

Use Tailwind theme/configuration.

---

# 73. Border Radius

Avoid excessive rounded cards.

Recommended:

```text
Small controls:
8px

Cards:
12px

Large panels:
16px

Logo:
12px
```

Some surfaces may remain square/low-radius to reinforce the technical/editorial aesthetic.

---

# 74. Shadows

Use subtle shadows only.

Prefer:

```text
border
+
very subtle shadow
```

instead of floating every element.

---

# 75. Cards

Do not put everything inside cards.

Use cards for:

- Dashboard summary
- Media
- Profile
- Important contextual blocks

Article editor should primarily use whitespace and hierarchy rather than dozens of cards.

---

# 76. Density

CMS is a productivity tool.

Avoid excessive whitespace that forces scrolling.

Balance:

```text
Editorial breathing room
+
Information density
```

Article editor can be spacious.

Article lists should be relatively dense.

---

# 77. Tables

If tables are used:

- Row height around 64–80px
- Clear hover
- Sticky header where useful
- Compact actions
- Responsive behavior

Do not make tables unnecessarily tall.

---

# 78. Filter Persistence

Filters should preferably persist in URL query parameters.

Example:

```text
/articles?status=draft&category=security
```

This enables:

- Bookmarking
- Sharing
- Browser navigation

---

# 79. Search

Search should support:

```text
Title
Slug
Excerpt
```

where supported by backend.

Search input should include keyboard shortcut:

```text
⌘ /
```

or:

```text
Ctrl /
```

if implemented.

---

# 80. Global UX Principle

Every screen should answer:

1. Where am I?
2. What can I do here?
3. What is the primary action?
4. What happened after I clicked?
5. How do I recover if something fails?

If any of these are unclear, improve the UI.

---

# 81. Technical Constraints

Do NOT change:

```text
Backend API architecture
Database schema
Authentication protocol
MinIO architecture
Cloudflare CDN architecture
```

unless required.

Do NOT:

```text
Add another backend
Add another database
Add another CMS framework
Add another state management library unnecessarily
```

---

# 82. Existing Functionality Must Remain

Redesign must preserve all existing MVP functionality:

- Login
- Logout
- Dashboard
- Article CRUD
- Publishing
- Archiving
- Categories
- Tags
- Authors
- Media
- Presigned uploads
- Cloudflare CDN URLs
- Search
- Filtering
- Pagination
- Preview

The redesign must not introduce regressions.

---

# 83. Recommended UI Libraries

Existing project may use shadcn/ui.

Use components such as:

```text
Button
Input
Textarea
Popover
Command
Dialog
Sheet
Tabs
Badge
Tooltip
DropdownMenu
AlertDialog
Progress
Skeleton
Avatar
Separator
```

But do not blindly use every component.

Choose the interaction pattern based on UX.

---

# 84. Drag & Drop Library

For robust drag-and-drop upload behavior, use a mature library such as:

```text
react-dropzone
```

Do not implement low-level drag/drop handling manually unless necessary.

Requirements:

- Multiple file support where possible
- File type validation
- File size validation
- Preview
- Progress state
- Error state
- Keyboard/click fallback

---

# 85. Editor Libraries

Use:

```text
Tiptap
```

for rich text.

Potential extensions:

```text
StarterKit
Link
Image
Placeholder
CodeBlock
CodeBlockLowlight
Typography
Underline
```

Only install extensions that are actually needed.

---

# 86. UX Priority Ranking

When making implementation decisions, prioritize:

```text
1. Article creation/editing
2. Media upload
3. Publishing workflow
4. Search/navigation
5. Taxonomy management
6. Dashboard
7. Secondary settings
```

The article editor is the heart of the CMS.

---

# 87. Acceptance Criteria

The redesign is successful when:

### Navigation

- [ ] User can navigate the CMS without confusion
- [ ] Sidebar clearly communicates current location
- [ ] Command palette works
- [ ] Important actions are easy to discover

### Article

- [ ] Creating an article feels like writing, not filling a CRUD form
- [ ] Title is visually prominent
- [ ] Editor is comfortable for long-form writing
- [ ] Metadata does not dominate the screen
- [ ] Publish action is always easy to access
- [ ] Save state is visible

### Media

- [ ] Images can be dragged into upload areas
- [ ] Upload area is visually obvious
- [ ] Click-to-upload remains available
- [ ] Upload progress is visible
- [ ] Uploaded image preview is visible
- [ ] Existing media can be selected easily
- [ ] Replace/remove actions are clear

### Forms

- [ ] Dropdown dependency is reduced
- [ ] Categories use searchable selection
- [ ] Tags use chips
- [ ] Article type uses segmented controls
- [ ] Inline creation is available where appropriate

### Branding

- [ ] `K</>` logo is consistently visible
- [ ] Black/white identity is dominant
- [ ] UI feels technical and editorial
- [ ] Branding does not feel like a generic admin template

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Drag/drop has click fallback
- [ ] Dialogs are accessible
- [ ] Buttons have accessible labels

---

# 88. Final Visual Direction

The final CMS should visually communicate:

```text
KABARKODE

K</>
────

Editorial workspace for people who care about technology.
```

The visual language:

```text
Black
White
Warm neutral
Small electric green accents
Bold typography
Technical monospace details
Clean editorial layouts
Minimal but powerful interactions
```

Avoid:

```text
Generic SaaS dashboard
Generic Bootstrap admin
Excessive cards
Excessive dropdowns
Excessive gradients
Excessive rounded corners
Huge unnecessary charts
Button-only upload
CRUD-oriented visual hierarchy
```

---

# 89. Final UX Concept

The CMS should feel like:

```text
┌────────────────────────────────────────────────────┐
│ K</> KabarKode                     ⌘K      Fahmi    │
├─────────────┬──────────────────────────────────────┤
│             │                                      │
│ Dashboard   │  Write your story                    │
│             │                                      │
│ Articles    │  Next.js 16 Resmi Dirilis            │
│ Media       │                                      │
│             │  Framework modern untuk...            │
│ Categories  │                                      │
│ Tags        │  ─────────────────────────────────   │
│ Authors     │                                      │
│             │  Tiptap Editor                       │
│             │                                      │
│             │                                      │
│             │                                      │
│             ├───────────────────────┬──────────────┤
│             │                       │              │
│             │                       │ Publishing   │
│             │                       │              │
│             │                       │ Category     │
│             │                       │ Tags         │
│             │                       │ Author       │
│             │                       │              │
│             │                       │ ┌──────────┐ │
│             │                       │ │  DROP    │ │
│             │                       │ │  IMAGE   │ │
│             │                       │ └──────────┘ │
│             │                       │              │
└─────────────┴───────────────────────┴──────────────┘
```

The user should feel:

> **"Saya sedang menulis dan mengelola berita teknologi."**

Not:

> **"Saya sedang mengisi form CRUD."**

---

# 90. Implementation Instruction For Agent

Before modifying code:

1. Inspect the existing CMS structure.
2. Identify current components.
3. Identify existing API integration.
4. Identify current authentication flow.
5. Identify current article editor.
6. Identify current media upload implementation.
7. Identify existing shadcn/ui components.
8. Preserve working functionality.
9. Do not rewrite backend.
10. Do not rewrite API integration unnecessarily.

Then implement the redesign incrementally.

Recommended order:

```text
1. Design tokens
       ↓
2. Logo / branding
       ↓
3. Global layout
       ↓
4. Sidebar
       ↓
5. Header
       ↓
6. Command palette
       ↓
7. Dashboard
       ↓
8. Article list
       ↓
9. Article editor
       ↓
10. Media dropzone
       ↓
11. Media library
       ↓
12. Categories / Tags / Authors
       ↓
13. Preview
       ↓
14. Responsive UX
       ↓
15. Accessibility
       ↓
16. Polish / micro-interactions
```

Do not modify multiple unrelated architectural layers at once.

After every major redesign phase, verify that existing functionality still works.

---

# 91. Final Requirement

This redesign should produce a CMS that is:

**Bold. Technical. Editorial. Fast. Intuitive.**

The most important transformation is:

```text
OLD

CRUD Dashboard
↓
Dropdown
↓
Form
↓
Button
↓
Modal


NEW

Editorial Workspace
↓
Contextual interaction
↓
Drag & Drop
↓
Inline editing
↓
Command palette
↓
Visual media management
↓
Fast publishing workflow
```

The `K</>` identity must become a recognizable visual signature throughout the product without overwhelming the usability.