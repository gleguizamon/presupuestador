'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Copy,
  Download,
  Home,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Shield,
  SquareMousePointerIcon,
  SquareOffIcon,
  Trash2,
  X
} from 'lucide-react';
import { GitHubMark } from '@/components/github-star-button';
import { useDownloadAll } from '@/components/editor/use-download-all';
import { useStorageAvailable } from '@/hooks/use-storage-available';
import { confirmLeave } from '@/lib/unsaved-guard';
import { QuoteIcon } from '@/components/docs/quote/meta';
import { BRAND_NAME, FEEDBACK_FORM_ID, GITHUB_REPO } from '@/lib/constants';
import { openFeedbackPopup } from '@/lib/tally';
import {
  DOCS_CHANGED_EVENT,
  DocSummary,
  createDoc,
  deleteDoc,
  deleteManyDocs,
  duplicateDoc,
  listDocs,
  renameDoc
} from '@/lib/storage';

/** Footer nav rows (Inicio / Privacidad / GitHub / Feedback): larger label on
 *  mobile so they're comfortable to tap; compact from `md` up. Icons keep their
 *  default size. */
const NAV_LINK_CLASS = 'text-sm md:text-xs';

/** "+ Nuevo documento" — one click, creates a doc and opens it by id. */
function NewDocumentButton() {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);

  const create = async () => {
    if (creating) return;
    // Degraded mode: starting a new doc replaces the unsaved one in the editor.
    if (!confirmLeave()) return;
    setCreating(true);
    try {
      // Navigate to the new doc *by id*: the sidebar layout persists across
      // navigations, so this component never unmounts — the bare `/editor`
      // route wouldn't remount DocEditor when you're already on it, and its
      // load effect (keyed on `docId`) wouldn't pick up the new doc.
      const created = await createDoc();
      router.push(`/editor/${created.id}`);
    } catch {
      // storage unavailable: fall back to the bare route, the editor still
      // creates a blank doc on load.
      router.push('/editor');
    } finally {
      // Same reason: no unmount to clear this, so reset it by hand or the
      // button stays disabled forever.
      setCreating(false);
    }
  };

  return (
    <SidebarMenuButton
      disabled={creating}
      tooltip="Nuevo documento"
      onClick={create}
      variant="outline"
    >
      <Plus />
      <span>Nuevo documento</span>
    </SidebarMenuButton>
  );
}

/** One document row: a link to open it, plus a hover-revealed "⋯" menu for
 *  renaming (swaps the row for an input), duplicating, and deleting (behind
 *  an AlertDialog confirm — this is destructive and can't be undone). */
function DocRow({
  doc,
  active,
  collapsed,
  selecting,
  checked,
  onToggleSelect,
  onRenamed,
  onDuplicate,
  onDeleteRequest
}: {
  doc: DocSummary;
  active: boolean;
  collapsed: boolean;
  selecting: boolean;
  checked: boolean;
  onToggleSelect: (id: string) => void;
  onRenamed: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (doc: DocSummary) => void;
}) {
  const [renaming, setRenaming] = React.useState(false);
  const [value, setValue] = React.useState(doc.name);

  const commit = async () => {
    setRenaming(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === doc.name) {
      setValue(doc.name);
      return;
    }
    await renameDoc(doc.id, trimmed);
    onRenamed(doc.id, trimmed);
  };

  if (renaming) {
    return (
      <SidebarMenuItem>
        <Input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setValue(doc.name);
              setRenaming(false);
            }
          }}
          aria-label="Nombre del documento"
          // Same reason as the row buttons: the list's `overflow` clip slices an
          // outset focus ring at the sides — keep it inset.
          className="h-8 focus-visible:ring-inset"
        />
      </SidebarMenuItem>
    );
  }

  // In multi-select mode the row stops being a link: the whole button toggles
  // this doc's checkbox instead of navigating, and the "⋯" menu is hidden.
  if (selecting) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={checked}
          aria-pressed={checked}
          title={new Date(doc.updatedAt).toLocaleString('es-AR')}
          onClick={() => onToggleSelect(doc.id)}
          // Rows run edge-to-edge inside the list's `overflow` clip, so an
          // outset focus ring gets sliced at the sides — keep it inset.
          className="focus-visible:ring-inset"
        >
          <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none" />
          <span className="truncate">{doc.name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        // Only wrap in a tooltip in the collapsed rail (where the label is
        // hidden). Expanded, a plain `render` keeps the `<Link>` un-nested —
        // wrapping it in a `TooltipTrigger` was breaking navigation between
        // documents.
        tooltip={collapsed ? doc.name : undefined}
        title={new Date(doc.updatedAt).toLocaleString('es-AR')}
        // Double-click the row to rename in place (same as the "⋯" menu's
        // "Renombrar"). Single click still opens the doc.
        onDoubleClick={() => setRenaming(true)}
        render={<Link href={`/editor/${doc.id}`} />}
        // Rows run edge-to-edge inside the list's `overflow` clip, so an
        // outset focus ring gets sliced at the sides — keep it inset. The
        // sibling "⋯" `SidebarMenuAction` below makes the base sidebar
        // component reserve `pr-8` for it (`group-has-data-[sidebar=menu-
        // action]/menu-item:pr-8`) — that action is hidden in the collapsed
        // rail, but the reserved padding isn't, so it was squeezing the
        // 32px-wide collapsed row's icon out its right edge. Reset it back
        // to the row's normal padding there.
        className="group-data-[collapsible=icon]:pr-2! focus-visible:ring-inset"
      >
        <QuoteIcon />
        <span className="truncate">{doc.name}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              showOnHover
              aria-label={`Acciones para ${doc.name}`}
              className="[&>svg]:size-5 md:[&>svg]:size-4"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-48">
          <DropdownMenuItem onClick={() => setRenaming(true)}>
            <Pencil /> Renombrar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(doc.id)}>
            <Copy /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDeleteRequest(doc)}>
            <Trash2 /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  // Tablet+ only: below `md` the sidebar is the off-canvas Sheet (always the
  // full expanded content), never a rail.
  const collapsed = state === 'collapsed' && !isMobile;
  const { run: downloadAll, busy: downloading } = useDownloadAll();
  const storageOk = useStorageAvailable();
  const [docs, setDocs] = React.useState<DocSummary[] | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DocSummary | null>(null);
  // Multi-select mode for the document list.
  const [selecting, setSelecting] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [bulkConfirm, setBulkConfirm] = React.useState(false);
  // The document list is client-only data (IndexedDB, loaded in an effect), and
  // `SidebarMenuSkeleton` picks a `Math.random()` width — rendering it during
  // SSR mismatches on hydration. Gate the loading state so the server and the
  // first client render agree (both render nothing); the skeleton only appears
  // once mounted on the client.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Bottom fade + chevron on the (scrollable) document list, shown only while
  // there's more list below the fold so a long library reads as scrollable.
  const listRef = React.useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = React.useState(false);
  const checkScroll = React.useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  const refresh = React.useCallback(() => {
    // Degraded mode: no library at all — don't even read (and don't let a
    // dev override that only fakes the probe still surface real rows).
    if (storageOk === false) {
      setDocs([]);
      return;
    }
    listDocs()
      .then(setDocs)
      .catch(() => setDocs([])); // storage unavailable — nothing to list
  }, [storageOk]);

  React.useEffect(() => {
    // Deferred so the initial list load doesn't setState synchronously inside
    // the effect (`refresh` can resolve `setDocs([])` right away in degraded
    // mode). Later refreshes come through the event below.
    queueMicrotask(refresh);
    window.addEventListener(DOCS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(DOCS_CHANGED_EVENT, refresh);
  }, [refresh]);

  // Re-measure the scroll indicator whenever the list content or its box
  // could have changed.
  React.useEffect(() => {
    checkScroll();
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkScroll, docs, selecting]);

  // `/editor/[id]` names its doc directly; bare `/editor` opens the most
  // recently created one — the same doc the list shows first.
  const [, , maybeId] = (pathname ?? '').split('/');
  const activeId = maybeId ?? docs?.[0]?.id ?? undefined;

  const onRenamed = (id: string, name: string) =>
    setDocs(d => d?.map(doc => (doc.id === id ? { ...doc, name } : doc)) ?? d);

  const onDuplicate = async (id: string) => {
    const copy = await duplicateDoc(id);
    if (copy) toast.success('Documento duplicado');
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(deleteTarget.id);
    toast.success('Documento eliminado');
    setDeleteTarget(null);
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Intersect with the live list rather than pruning `selected` in an effect —
  // ids can disappear (a delete from another tab) between renders.
  const selectedIds = docs ? docs.filter(d => selected.has(d.id)).map(d => d.id) : [];
  const allSelected = !!docs && docs.length > 0 && selectedIds.length === docs.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(docs?.map(d => d.id)));

  const exitSelection = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  // Selection mode's own chrome (names, count, "seleccionar todos", bulk
  // actions) can't fit — or even render — in the collapsed rail, leaving
  // just checkboxes nobody can see the effect of. Rather than clearing the
  // selection outright on collapse (setState-from-effect, and needlessly
  // destructive if the collapse was a misclick), derive whether selection
  // mode is actually *showing* from both flags: collapsing suppresses it,
  // re-expanding resumes exactly where it was, selection intact.
  const effectiveSelecting = selecting && !collapsed;

  const onBulkDelete = async () => {
    await deleteManyDocs(selectedIds);
    toast.success(
      selectedIds.length === 1
        ? 'Documento eliminado'
        : `${selectedIds.length} documentos eliminados`
    );
    setBulkConfirm(false);
    exitSelection();
  };

  return (
    <>
      <Sidebar {...props}>
        {/* A touch more side padding in the mobile sheet; the desktop rail
            keeps the tighter gutter. */}
        <SidebarHeader className="px-3 md:px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={collapsed ? BRAND_NAME : undefined}
                render={<Link href="/" />}
                // Keep the brand row at its full height in the collapsed rail —
                // otherwise it snaps 48→32px and the whole column visibly jumps
                // up mid-animation. Width still collapses like every other row.
                className="group-data-[collapsible=icon]:!h-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0"
              >
                {/* No logomark — plain wordmark. Collapsed, there's only room
                    for one glyph: instead of the ambient text alignment (which
                    doesn't line up with the fixed `size-4` box every real icon
                    in this sidebar gets from `[&_svg]:size-4`), give the
                    initial the same fixed, self-centred box so it lines up
                    with the icons above and below it. */}
                {collapsed ? (
                  <span
                    aria-hidden
                    className="flex size-4 shrink-0 items-center justify-center text-sm leading-none font-semibold lowercase"
                  >
                    {BRAND_NAME[0]}
                  </span>
                ) : (
                  <span className="truncate text-base font-semibold lowercase">{BRAND_NAME}.</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        {/* The sidebar chrome never scrolls: `overflow-hidden` here pins the
            header, the "Nuevo documento" action and the bottom nav in place —
            only the document list (the inner `overflow-y-auto` div below)
            scrolls when it's long, and `overscroll-contain` stops that from
            chaining into the content pane. */}
        {/* Collapsed rail: drop this padding entirely — each row's own
            `SidebarGroup` already contributes `p-2`, and stacking this on top
            of it (unlike the header, which has only one padding layer) was
            pushing every row 8px right of the header logo. */}
        <SidebarContent className="overflow-hidden px-3 group-data-[collapsible=icon]:px-0 md:px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NewDocumentButton />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {/* Documentos. The group is the non-scrolling anchor (so the bottom
              fade stays put); the inner div scrolls. In the collapsed rail this
              stays a scrollable column of per-doc icons — the visual stack of
              documents is the point, it doesn't fold to one icon. */}
          <SidebarGroup className="relative min-h-0 flex-1 overflow-hidden">
            <SidebarGroupLabel>Documentos</SidebarGroupLabel>
            {/* Multi-select mode covers bulk download / delete (select all,
                then act) — no separate "descargar todo". Only worth offering
                with 2+ docs. */}
            {storageOk !== false &&
              docs &&
              docs.length > 1 &&
              (!selecting ? (
                <SidebarGroupAction
                  aria-label="Seleccionar varios"
                  title="Seleccionar varios"
                  onClick={() => setSelecting(true)}
                >
                  <SquareMousePointerIcon />
                </SidebarGroupAction>
              ) : (
                <SidebarGroupAction
                  aria-label="Cancelar selección múltiple"
                  title="Cancelar selección múltiple"
                  onClick={exitSelection}
                >
                  <SquareOffIcon />
                </SidebarGroupAction>
              ))}
            <div
              ref={listRef}
              className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
            >
              <SidebarGroupContent>
                {/* A small gap between rows: a bit more breathing room, and a
                    dead zone so a flick-scroll that lifts between rows can't
                    land a stray tap on one. */}
                <SidebarMenu className="gap-1">
                  {storageOk === false ? (
                    collapsed ? null : (
                      <p className="text-sidebar-foreground/60 px-2 py-1.5 text-xs leading-relaxed">
                        Este navegador no puede guardar documentos. Podés crear y exportar, pero no
                        queda una lista.
                      </p>
                    )
                  ) : docs === null ? (
                    mounted && !collapsed ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <SidebarMenuSkeleton key={i} showIcon />
                      ))
                    ) : null
                  ) : docs.length === 0 ? (
                    collapsed ? null : (
                      <p className="text-sidebar-foreground/60 px-2 py-1.5 text-xs">
                        Todavía no creaste ningún documento.
                      </p>
                    )
                  ) : (
                    docs.map(doc => (
                      <DocRow
                        key={doc.id}
                        doc={doc}
                        active={doc.id === activeId}
                        collapsed={collapsed}
                        selecting={effectiveSelecting}
                        checked={selected.has(doc.id)}
                        onToggleSelect={toggleSelect}
                        onRenamed={onRenamed}
                        onDuplicate={onDuplicate}
                        onDeleteRequest={setDeleteTarget}
                      />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
            {/* "There's more below" affordance — a soft fade that only shows
                while the list actually overflows past the fold. Long and
                mostly-transparent (opaque only right at the edge) so the last
                row dissolves instead of ending on a hard line. Much shorter in
                the collapsed rail: at `h-16` it's taller than a single 32px
                icon row, so it was fading out the bottom half of whichever
                icon it overlapped instead of just hinting at the edge. */}
            <div
              aria-hidden
              className={cn(
                'from-sidebar via-sidebar/40 pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent transition-opacity duration-200 group-data-[collapsible=icon]:h-3',
                moreBelow ? 'opacity-100' : 'opacity-0'
              )}
            />
          </SidebarGroup>
          {effectiveSelecting && (
            // Bigger controls + spacing on mobile; compact from `md` up.
            <div className="border-sidebar-border flex items-center gap-2 border-t px-3 py-2 md:gap-1.5">
              <Checkbox
                checked={allSelected}
                indeterminate={selectedIds.length > 0 && !allSelected}
                onCheckedChange={toggleAll}
                aria-label="Seleccionar todos"
                className="size-5 md:size-4"
              />
              <span className="text-sidebar-foreground/70 min-w-0 flex-1 truncate text-xs tabular-nums">
                {selectedIds.length} seleccionado{selectedIds.length === 1 ? '' : 's'}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={downloading || selectedIds.length === 0}
                onClick={() => downloadAll(selectedIds)}
                aria-label="Descargar seleccionados (ZIP)"
                className="size-9 md:size-7"
              >
                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={selectedIds.length === 0}
                onClick={() => setBulkConfirm(true)}
                aria-label="Eliminar seleccionados"
                className="text-destructive hover:text-destructive size-9 md:size-7"
              >
                <Trash2 />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={exitSelection}
                aria-label="Salir de selección"
                className="size-9 md:size-7"
              >
                <X />
              </Button>
            </div>
          )}
          {/* NavSecondary — sits right after the (flex-1) document list, so
              it's always pinned to the bottom without scrolling. Links that
              aren't the library itself; keeps the open-source repo one click
              away from anywhere in the app (PRODUCT.md). */}
          <SidebarGroup>
            <SidebarGroupContent>
              {/* A little gap + a bigger mobile label so the four links are
                  easier to hit. */}
              <SidebarMenu className="gap-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="sm"
                    className={NAV_LINK_CLASS}
                    tooltip={collapsed ? 'Inicio' : undefined}
                    render={<Link href="/" />}
                  >
                    <Home />
                    <span>Inicio</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="sm"
                    className={NAV_LINK_CLASS}
                    tooltip={collapsed ? 'Privacidad' : undefined}
                    render={<Link href="/privacy" />}
                  >
                    <Shield />
                    <span>Privacidad</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="sm"
                    className={NAV_LINK_CLASS}
                    tooltip={collapsed ? 'GitHub' : undefined}
                    render={
                      <a
                        href={`https://github.com/${GITHUB_REPO}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      />
                    }
                  >
                    <GitHubMark className="size-4" />
                    <span>GitHub</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {FEEDBACK_FORM_ID && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size="sm"
                      className={NAV_LINK_CLASS}
                      tooltip={collapsed ? 'Feedback' : undefined}
                      onClick={() => openFeedbackPopup(FEEDBACK_FORM_ID)}
                    >
                      <Send />
                      <span>Feedback</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkConfirm} onOpenChange={open => !open && setBulkConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedIds.length} documento{selectedIds.length === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onBulkDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
