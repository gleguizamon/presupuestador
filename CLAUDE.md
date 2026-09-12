# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The line above is not decoration: this repo runs **Next.js 16 / React 19**. APIs
> and conventions differ from older versions — read the relevant guide under
> `node_modules/next/dist/docs/` before writing framework code.

## Commands

- `pnpm dev` — dev server (http://localhost:3000)
- `pnpm build` — production build
- `pnpm lint` — ESLint (flat config, `eslint-config-next` + prettier)
- `pnpm prettier` — format in place

Package manager is **pnpm 11.11.0** (pinned via `packageManager`); Node 22 (`.nvmrc`).
There is **no test suite** and no CI workflow — `lint` and `build` are the only gates.

## The big picture

Presupuestapp is a **100% client-side** tool for producing a freelancer's
**presupuesto** (client quote), exporting it to PDF, and sharing it by link.
**No backend exists.** Document content lives only in the visitor's browser
(IndexedDB) or encoded in a share URL's hash. See `PRODUCT.md` for product intent
and `DESIGN.md` for the app-chrome design system.

> There used to be a multi-document-kind registry (propuesta / contrato / factura).
> It was ripped out — **presupuesto is the only kind now**, and the model is a
> plain type, not a discriminated union. Don't reintroduce a `kind` field or a
> registry without asking.

### The document model

- `lib/doc/types.ts` — `Doc` (the presupuesto shape; `QuoteDoc` is an alias),
  `emptyDoc()`, `SheetProps`, `computeTotals`, `formatMoney`, and the
  `LAYOUTS` / `FONTS` / `CURRENCIES` tables.
- `components/docs/quote/` — `form.tsx` (the editing UI), `sheet.tsx` (read-only
  preview), `pdf.tsx` (`@react-pdf` renderer), `meta.ts` (name / icon / lazy
  `loadQuotePdf`). No registry — the editor imports these directly.
- `components/doc/` — shared rendering primitives (`paper.tsx` layout/font themes,
  `item-table.tsx`, `quote-totals.tsx`, `form-fields.tsx`, `signature-pad.tsx`).

### Two route families, two chrome shells

`app/layout.tsx` is a bare shell (fonts, `Toaster`, `TooltipProvider`). Chrome is
per-group:

- `app/(site)/` — marketing pages (`/`, `/privacy`, `/changelog`, `/faqs`)
  wrapped in `Header`/`Footer`.
- `app/editor/` — the dashboard shell (`app/editor/layout.tsx` → `SidebarProvider`
  - `AppSidebar`). The sidebar layout **persists across navigations** between
    documents; `DocEditor` itself intentionally remounts per doc (`key` on the
    `[id]` page).

> Routes and every internal identifier are English. Only user-facing text is
> es-AR. `/crear` / `/privacidad` / `/documentos` no longer exist.

Routes: bare `/editor` redirects to the most-recently-**created** doc's own
`/editor/[id]` — the one at the top of `listDocs()`, ordered by `createdAt` desc
(a stable order that opening/autosaving doesn't reshuffle) — or shows the empty-
library state if there isn't one, or (when the URL carries a `#c=`/`#d=` hash)
the shared document; `/editor/[id]` opens one specific saved doc (library "Abrir"
link). Creating is always an explicit action (sidebar button / home CTA), never
automatic. New docs go through `createDoc()` in `lib/storage.ts`, which assigns
the next free `NNN` number (`nextDocNumber`).

### The editor (`components/editor/doc-editor.tsx`)

The dashboard/editor chrome is grouped under `components/editor/`: `doc-editor.tsx`
(state/IO controller), `editor-workspace.tsx` (responsive form/preview layout),
`app-sidebar.tsx` (dashboard sidebar + doc library), `site-header.tsx` (breadcrumb
bar). Shared document-rendering primitives stay in `components/doc/`, the
presupuesto's own components in `components/docs/quote/`, marketing chrome
(`header`, `footer`, …) at `components/` root.

RenderCV-style: a labeled-field `Form` edits the doc, a **`Sheet` that is always
read-only** shows the result (the same component renders
the on-screen preview, the Cmd+P print view, and the read-only share view — so what
is edited never drifts from what is printed). `Sheet` never receives `onChange`.

- Desktop (`useIsDesktop()`, real `matchMedia` check): form column + `sticky`
  preview side by side. Below `lg`: an "Editar"/"Vista previa" tab split. Only one
  tree is mounted at a time — never CSS-hidden duplicates (would double every
  field `id`).
- Autosave is debounced ~400ms to IndexedDB; a `readOnly` doc (share link opened
  without the edit key) never writes.

### Persistence & sharing (no server involved)

- `lib/storage.ts` — IndexedDB (`idb`), DB `presupuestafy` at version 1, single
  store `docs`, **no indexes** (the library is small — scan + sort in memory).
  CRUD + `duplicateDoc`. After any write it dispatches the `DOCS_CHANGED_EVENT`
  window event so the persistent sidebar list refreshes without polling. No
  migrations — the app was never published; a schema change means wiping the DB.
  `isStorageAvailable()` probes a throwaway DB (write+read+delete) so a blocked
  browser degrades instead of crashing.
- `lib/quote.ts` — share codec. The doc is serialized to base64url JSON in the URL
  **hash** (`#c=` deflate-compressed via `CompressionStream`, or `#d=`
  uncompressed) — the hash never reaches the server. `id` + timestamps, and
  `body.logo` + `body.signature` (heavy PNGs) are dropped; then `stripDefaults()`
  drops every field still equal to its `emptyDoc` value (except `date` /
  `validUntil`, which are time-derived and must survive) so the URL only carries
  what the user changed. `withDocDefaults()` `deepMerge`s the parsed payload back
  onto a fresh `emptyDoc()` (deep, so a trimmed partial `body` fills back its
  default siblings). Edit protection without a backend: every payload carries
  `eh` = SHA-256(random key); only the editable link also carries `&k=<key>`,
  and `hash(k) === eh` unlocks editing. Deliberately **no URL shortener** — that
  would put every shared doc's contents (client PII) on a server; the QR action
  (`components/editor/qr-dialog.tsx`) is the client-side "share it quickly" path
  instead, and falls back to "copy link" when the URL is too big for a QR.

### Layout/font theming vs. app chrome

Document appearance uses `LayoutId` (`clasico` | `calido` | `moderno` | `oliva` |
`personalizado`) × `FontId` (`sans` | `serif` | `mono`), **orthogonal** — any
layout pairs with any font pairs with any kind. Two parallel theme tables that
must stay in sync:

- `components/doc/paper.tsx` — on-screen (`LAYOUT_THEMES` as Tailwind classes).
- `components/doc/pdf/theme.ts` — PDF (`LAYOUT_THEMES` as hex, `FONT_FAMILIES`).

`personalizado` is the "bring your own colours" layout: structure of `clasico`,
palette from `doc.style.custom` (`{ bg?, ink? }`, set via the "Personalizado"
section of the Estilo tab; rules/lines follow `ink`). On screen its
`LAYOUT_THEMES` entry uses
`*-[var(--doc-*)]` classes (static, so Tailwind still emits them) and `Paper`
sets the vars inline from `custom`; for PDF, `customPdfTheme(custom)` in
`pdf/theme.ts` resolves the palette (both PDF components branch on it).
`LAYOUT_COLORS` in `lib/doc/types.ts` holds the per-layout base hexes,
dependency-free so the editor can seed the pickers without importing the PDF
renderer.

These are **document-owner customization** and are deliberately independent of the
app's own chrome theme (see `DESIGN.md` "Scope").

### PDF export

`@react-pdf/renderer`, generated in the browser via `pdf().toBlob()`.
`loadQuotePdf()` (in `components/docs/quote/meta.ts`) is lazy — the heavy
renderer only enters the bundle on actual export. Geist Mono is self-hosted from `public/fonts/` and registered as a
module-level side effect in `components/doc/pdf/theme.ts` (built-in Helvetica/Times
need no registration).

## Conventions

- **UI primitives:** shadcn/ui, style `base-nova`, built on **`@base-ui/react`
  (not Radix)**. Composition uses base-ui's `render={<Component />}` prop, not
  `asChild`. `cva`-based variants (e.g. `buttonVariants`, `tabsListVariants`);
  `components/ui/*` import `cn` from the `cn` package, app code from
  `@/lib/utils`. `Tabs` has `variant="default"` (filled segmented) and
  `variant="line"` (underline menu).
- **Do not hand-edit `components/ui/*`** — treat them as vendored shadcn
  primitives. Customize per call site via `className`/props, or wrap them in a
  feature component (`components/get-started-button.tsx` enlarges the button
  purely with `className`). Changing a primitive itself is a deliberate call to
  raise, not a silent edit.
- **Styling:** Tailwind v4, CSS-first — tokens and `@theme` live in
  `app/globals.css`, there is no `tailwind.config`. `.dark` tokens exist but are
  inert (no toggle).
- **Prettier:** `printWidth: 100`, single quotes, no trailing comma,
  `arrowParens: avoid`. Import order matters to the tailwind plugin.
- **Path alias:** `@/*` → repo root.
- **Language:** all user-facing copy is Argentine Spanish (es-AR); ARS is the
  default currency. Keep the voice plain and direct (see `PRODUCT.md`).
