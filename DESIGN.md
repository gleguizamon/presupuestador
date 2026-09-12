# Design

<!-- impeccable:design-schema 1 -->

## Scope

This system covers the app **chrome**: header, footer, home page, the
document editor's shell (side panel, breadcrumbs, buttons), and the
`/documentos` library. It does **not** cover the printable documents
themselves (the presupuesto/propuesta sheets and their PDFs) — those carry
their own literal per-layout palettes in `components/doc/paper.tsx` and
`components/doc/pdf/theme.ts`, chosen by the person filling out the
document, and must stay independent of the app's own theme.

## Reference

[thelaunchcompany.cc](https://www.thelaunchcompany.cc/), user-supplied.
Sampled directly (Playwright + computed styles), not approximated from
memory: body `#F6F5F2`, ink `#111110`, Inter, fully-rounded (`rounded-full`)
buttons, a floating pill-shaped nav capsule, pure-white cards on the cream
ground. The rocket hero, testimonials, and marketing copy are that site's
content, not transferable — only the chrome language was adapted, for a
one-person Operate tool, not a Persuade landing page.

## Color

**Strategy: Restrained** — neutrals plus black-as-accent. Product/tool
register (per PRODUCT.md); no brand hue is spent on chrome so it never
competes with a document's own accent color.

- `--background` `oklch(0.97 0.004 91)` — warm cream page ground (~`#F6F5F2`).
- `--card` / `--popover` `oklch(1 0 0)` — pure white, floated on the cream
  ground. The contrast between the two is the system's signature move: every
  panel, row-list, and document sheet is a white surface, never blended into
  the page.
- `--foreground` / `--primary` `oklch(0.177 0.002 107)` — near-black ink
  (~`#111110`), doubles as the solid fill for primary buttons.
- `--muted-foreground` `oklch(0.524 0.006 95)` — secondary text.
- `--secondary` / `--muted` / `--accent` `oklch(0.94 0.005 91)` — one shared
  light-neutral tint for hover states and inactive chips.
- `--border` / `--input` `oklch(0.9 0.006 91)` — hairlines, barely darker
  than the card they outline.
- `--destructive` unchanged from the prior system (red, used only for
  delete confirmation).

All hand-tuned to `#F6F5F2`/`#111110` via sRGB→OKLCH conversion, not eyeballed.
Dark mode is out of scope for this pass; `.dark` in `app/globals.css` is
untouched and dormant (no toggle exists in the app).

**One palette, everywhere.** Marketing (home, privacidad) and the `/crear`
dashboard share the warm cream skin above — the sidebar is `--sidebar`
`oklch(0.99 0.002 91)`, a hair warmer than the cream page, content is
pure-white `--card`. An earlier pass scoped a cooler `chroma 0` greyscale
(a `.theme-neutral` override) to the dashboard; it was removed per user
direction, class and all. Document Sheets/PDFs are unaffected either way
(they carry their own literal palettes).

## Shape language

- `--radius` `0.85rem` (up from `0.625rem`) — cards, popovers, inputs read
  softer and more generous than before.
- **Buttons are fully rounded** (`rounded-full`, set once at the base of
  `buttonVariants` in `components/ui/button.tsx`) — this is the system's
  other signature move, carried from the reference. Small utility icon
  buttons (duplicate/delete in the library rows) are also `rounded-full`,
  read as circular chips.
- Choice chips (document-kind picker, library filter tabs, font picker)
  are `rounded-full` pills with a border; selected state is a solid
  `bg-foreground`/`text-background` fill, not a colored highlight.
- Menu-style popovers (share-link options) keep `rounded-md` list items —
  pill radius is for buttons and chips, not every rectangle.

## Typography

Geist Sans throughout (unchanged — already close to the reference's Inter
in character; no new font family introduced). Small structural labels
("Elegí qué querés crear", the footer copyright, the features checklist)
keep the app's pre-existing Geist Mono accent — a deliberate contrast pair,
not the reference's system.

Display headings use `tracking-[-0.02em]` (library title) for a tighter, more
considered feel without crossing the -0.04em floor. The home hero goes a step
further to `-0.03em` — still inside the floor — for a louder, more modern first
impression.

## Header

Went through two shapes. It was briefly a **floating `rounded-full` capsule**
(`bg-card`, soft shadow, inset from the viewport edge) — sampled from the
reference — but at `max-w-5xl` with only two items it read as a stretched
stadium, and `rounded-full` on a wide bar clashed with the `0.85rem` radius
token everywhere else (pill radius is for buttons and chips, not chrome bars).

Now a **plain flat bar on the cream page**: no capsule, no card, no radius —
`sticky`, `bg-background/80` + `backdrop-blur-sm` for legibility as content
scrolls under, a single `border-b border-border/50` hairline. Wordmark left;
right side is the secondary-page nav (`Changelog`, `Preguntas frecuentes`,
`Privacidad` — text links, `hidden sm:flex`, also kept in the footer) plus the
GitHub star chip (every breakpoint). `print:static print:border-0
print:bg-transparent` keeps the print fallback. The `<header>`/`<footer>`
landmark tag is the outer element; an inner `<div>` carries the row layout.

## Home / hero

Centered, single-column, adapted from the reference's hero rhythm (not its
rocket-and-testimonials content). Top to bottom: a `rounded-full` eyebrow pill
(`bg-card` + border, Geist Mono, a small `bg-emerald-500` dot) reading "100% en
tu navegador"; a big `text-balance` headline with the recurring serif-italic
accent on "sin vueltas."; one line of muted subcopy; the single primary CTA
(`Crear un presupuesto`, enlarged past the `lg` button size via `className`, a
soft lifted shadow) with a Geist Mono microcopy line under it
("Gratis, sin cuenta, sin tarjeta.") that kills the "is this a trial?" read —
"sin tarjeta" is the concrete anti-trial signal.

Below the fold line, a real `QuoteSheet` (sample data, `aria-hidden`) **rises
from behind the footer's divider**: a full-width strip pinned to the page's
bottom edge — which lands exactly on the footer's `border-t` — clips the tall
sheet to its top and fades it (`from-background` gradient) so it dissolves
rather than hard-cuts. The `Footer` is a later sibling in
`app/(site)/layout.tsx`, so its divider and copyright paint on top and the
sheet reads as tucked behind the page. Decorative only; not shown in print.

## Cards as panels

The `/documentos` list is wrapped as a white card (`bg-card rounded-3xl
border shadow-sm`) floating on the cream page. Empty states and loading
skeletons use the same `bg-card`/`rounded-3xl`/`rounded-2xl` treatment
rather than a flat gray block, so a first-run screen doesn't look
unfinished next to a populated one.

## Dashboard shell (`/crear/**`)

The `/crear` routes run inside a shadcn **sidebar dashboard shell**
(`app/crear/layout.tsx`), its composition lifted from shadcn's `dashboard-01`
block — the structure only; none of that block's cards / charts / data table
(the app has no metrics and no backend to feed them).

- **`AppSidebar` (`variant="inset" collapsible="icon"`).** `SidebarHeader` is
  a plain wordmark (no logomark — there's no official logo yet; the collapsed
  icon rail falls back to just the brand's initial) as a menu-button linking
  home. **The sidebar chrome never scrolls**:
  `SidebarContent` is `overflow-hidden`, so the "Nuevo documento" action and
  the bottom **secondary nav** (Inicio, Privacidad, GitHub — keeps the
  open-source repo one click away, per PRODUCT.md) stay pinned; only the
  **"Documentos"** group (the local library — `DocRow`s with their rename /
  duplicate / delete menu, plus a multi-select mode for bulk delete) is a
  `flex-1 min-h-0 overflow-y-auto overscroll-contain` region that scrolls when
  the list is long (scrollbar hidden via `.no-scrollbar`, a soft bottom fade
  is the "more below" cue). There's no account, so no `NavUser` and no
  `SidebarFooter`.
- **Collapsed = icon rail (tablet+).** `collapsible="icon"`: below `md` the
  sidebar is the off-canvas Sheet (always full content); on `md`+ collapsing
  folds it to a `~3rem` vertical rail — the "P" mark, "Nuevo documento" (`+`),
  the **document list as a scrollable column of per-doc icons** (keeps the
  visual stack; each row keeps its active highlight and a `tooltip` with the
  doc number), and the secondary nav. Every rail button carries a `tooltip`
  (shown only while collapsed). The brand row is pinned to its full height in
  the rail (`group-data-[collapsible=icon]:!h-12`) so the column doesn't jump
  up mid-animation, and every label sits in a `<span>` so it clips on one line
  instead of reflowing while the panel narrows. Toggling is the
  `SidebarTrigger` in the SiteHeader (its `Tooltip` carries a `<Kbd>` shortcut
  hint) or `⌘/Ctrl+B`. Deliberately no `<SidebarRail />` (the invisible edge
  strip reads as an accidental hit target) and no in-panel collapse row (tried,
  didn't sit right).
- **The inset "contorno".** `variant="inset"` floats the content with a
  margin, `rounded-xl` and `shadow-sm`; that shadow is faint against the
  near-white sidebar ground, so `SidebarInset` also gets a hairline
  `md:peer-data-[variant=inset]:border` (the outline is the point) plus
  `md:peer-data-[variant=inset]:overflow-hidden` so the SiteHeader and panes
  clip to the rounded corners. (An earlier heavier right-cast shadow on the
  sidebar to mark the seam was tried and removed — the border alone reads
  cleaner.)
- **`SiteHeader`** (`components/editor/site-header.tsx`, adapted from `dashboard-01`):
  a `sticky top-0` bar at the top of the content area — `SidebarTrigger`
  (wrapped in a `Tooltip` whose content carries a `<Kbd>⌘B</Kbd>` /
  `Ctrl+B` hint, platform-detected), a vertical `Separator`, a breadcrumb slot
  (`children`), and an optional right-aligned `actions` slot. In the editor the
  breadcrumb is `<doc kind> › <number>`; the `actions` slot holds the whole-doc
  actions (Descargar PDF / Compartir / **Mostrar QR** / Empezar de nuevo — icon
  buttons with `Tooltip`s on `lg`, labelled and full-width below it) and, past a
  hairline divider, the preview zoom.
- **QR (`components/editor/qr-dialog.tsx`).** "Mostrar QR" builds a **read-only**
  share link (never an edit key — a screen gets photographed) and shows it big
  in a shadcn `Card` centred inside a full-viewport base-ui `Dialog.Popup`, over
  the same light `bg-black/10` + `backdrop-blur` as the mobile sidebar Sheet.
  The Popup is full-viewport (not sized to the card) on purpose: base-ui only
  dismisses a modal `Dialog` on outside press when the target is the popup or
  its backdrop, so a click on the padding around the card has to land on the
  Popup itself. The QR is `qrcode.react`'s `QRCodeSVG` on a white bordered
  tile. This is the privacy-preserving "share it fast" path — see CLAUDE.md on
  why there's no URL shortener.
- **Scroll model (`lg`+).** The `SidebarProvider` wrapper is
  `lg:h-svh lg:overflow-hidden`, so the page itself never scrolls; only the
  two editor panes and the sidebar's document-list group do, and every one of
  those is `overscroll-contain` so a gesture that reaches its end doesn't
  chain anywhere. Below `lg` the shell is the default `min-h-svh` and the
  page scrolls normally.
- Content padding follows the block's rhythm — `px-4 lg:px-6`.

## Editor: form + preview, not a floating panel

Superseded an earlier version of this system where editing happened
in-place on the document itself, with a small floating card of style
controls beside it. Per user direction (referencing rendercv.com), the
editor is now a **RenderCV-style split**: a plain, unstyled column of
labeled form fields (`Form` components, per doc kind, in
`components/docs/<kind>/form.tsx`) on the left, and the **always-read-only**
document preview (`Sheet` components — never receive `onChange` anymore)
beside it on the right, on `lg`+ viewports. The whole responsive layout
lives in `components/editor/editor-workspace.tsx` (`DocEditor` is now just the
state/IO controller around it). The whole dashboard/editor chrome —
`doc-editor.tsx`, `editor-workspace.tsx`, `app-sidebar.tsx`, `site-header.tsx` —
is grouped under `components/editor/`.

On `lg`+ the workspace is a flex column that fills the (viewport-capped)
`SidebarInset` — `h-full min-h-0`, no magic viewport maths. Top of it is the
shared **`SiteHeader`** (see the Dashboard shell section) carrying the
whole-doc actions and the preview **zoom** control (`− 100% +`,
integer-percent steps 50–150, click the number to reset) in its `actions`
slot. Below it, the split is a
**`react-resizable-panels` group** (shadcn `components/ui/resizable.tsx`,
`flex-1 min-h-0`): each pane scrolls entirely on its own — scrolling the
form never moves the preview, and the page itself never scrolls — with a
hairline drag handle between them. The form pane is `defaultSize="40%"`
clamped to 28–52%; the dragged width is remembered per browser in
`localStorage` (`presupuestafy:editor-split`, the v4 `onLayoutChanged` /
`defaultLayout` pair) — a convenience, never document data. Zoom is applied
with CSS `zoom` (not `transform: scale`) on a wrapper around the preview
`Sheet`, so the scroll container still sizes to the scaled document and a
long / multi-page quote scrolls inside the pane. The handle keeps the
system's hairline look (`bg-border` 1px) with a slightly taller, greyer
grip so it's discoverable.

Below `lg`, there isn't room for both, so editing adds a **primary**
"Editar" / "Vista previa" switch — a full-width filled segmented control
(`components/ui/tabs.tsx` at `variant="default"`, wrapping `@base-ui/react/tabs`).

The form's own sub-sections ("Contenido" / "Estilo" / "Configuración", both
breakpoints) use the **same primitive at `variant="line"`** — a RenderCV-style
underline tab menu. It's driven by `formTab` state (the panel body, `formBody`,
renders outside the `Tabs` tree), so only `TabsList` / `TabsTrigger` are used,
no `TabsContent`. The two weights must stay visually distinct: the filled
segmented control is the primary switch, the underline menu reads as a section
menu. "Contenido" is the `Form`; "Estilo" the layout/font/currency picker;
"Configuración" the `SettingsForm` (export file name, PDF keywords, creation
date, brand-footer toggle — all "empty = default").

Only one of {resizable split, tabs} is ever mounted at a time (a real
`useIsDesktop()` check, not CSS-hidden duplicates) — rendering both trees
at once duplicates every field's `id` and gives shared UI like the
"Compartir" popover two DOM instances fighting over one open/close state.

Form fields use plain `components/ui/input.tsx` / `textarea.tsx` chrome
(bordered, labeled) via shared primitives in `components/doc/form-fields.tsx`
(`FormField`, `FormSection`, `FormRepeatableCard`, `LogoField`) — a
different, more conventional register than the document sheet's own
seamless "text sits directly on the paper" editing style, which is gone
(the `EditableText`/`EditableBulletList` ghost-grid components that
powered it were deleted, not just unused). `LogoField`, once a logo is set,
shows the thumbnail with a `name · weight · Quitar` line under it — the
weight is computed from the stored (downscaled PNG) data URL, which is what
actually lands in the PDF. The original filename rides along on the doc as
`logoName` (cosmetic; dropped from share links with `logo`).

**Local-storage notice.** A one-time `LocalStorageNotice` callout at the top
of the form pane (scrolls away on desktop, above the tabs on mobile).
Deliberately **not a modal** — it must not interrupt the "I clicked Crear,
let me type" flow or read like a paywall/consent gate. Neutral card, `Info`
icon, no alert colours; positive framing ("Todo se guarda en este
navegador"), and it points at **Compartir → link editable** as the way to
back up / move a document (there's no Export/Import feature). `DocEditor`
owns the seen-flag (`localStorage['presupuestafy:seen-local-notice']`, read
in a lazy initializer — safe because the editor only mounts client-side past
the loading skeleton) and the share trigger; dismissing or clicking
Compartir marks it seen for good. Never shown in the read-only share view.

## What's deliberately unchanged

- The document sheets/PDFs and their four layout themes (`clasico`,
  `calido`, `moderno`, `oliva`) — user-facing customization, out of scope.
- Brand name and voice (plain, direct Argentine Spanish).
- `.dark` tokens — present but inert.
