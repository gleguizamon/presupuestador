'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColorPicker } from '@/components/ui/color-picker';
import { SiteHeader } from '@/components/editor/site-header';
import { DateField } from '@/components/date-field';
import { FORM_INPUT_TRIGGER_CLASS, FormField, FormSection } from '@/components/doc/form-fields';
import { Info, Maximize2, Minus, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import {
  CURRENCIES,
  Doc,
  exportFileName,
  FONTS,
  FontId,
  LAYOUT_COLORS,
  LAYOUTS,
  resolveSignatureColor,
  SheetProps
} from '@/lib/doc/types';
import { SITE_HOST } from '@/lib/constants';
import { cn } from '@/lib/utils';

const ZOOM_MIN = 50;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;

// A4 at 96 CSS px/in. Keep in sync with the `w-[794px]` classes below —
// Tailwind needs those as literals, it can't read these constants.
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

/** Preview-only pagination: `Sheet`/`Paper` stay a single continuous flow
 *  (shared, unchanged, with the on-screen print view and the share view —
 *  see CLAUDE.md), so this just *windows* that one render into stacked,
 *  A4-height cards for the editor preview. Approximate — the cut falls
 *  wherever the pixel height lands, not wherever `@react-pdf/renderer`
 *  itself would break the page (e.g. it can slice through a table row that
 *  the real PDF would keep intact and push to the next page). Good enough
 *  for "this is roughly N pages," not a stand-in for the real export. */
function PaginatedSheet({ doc, Sheet }: { doc: Doc; Sheet: React.ComponentType<SheetProps> }) {
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => setPageCount(Math.max(1, Math.ceil(el.scrollHeight / PAGE_HEIGHT)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [doc]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hidden measuring copy: laid out normally (not `display:none`) so
          `scrollHeight` reflects real content height, `fixed` + `invisible`
          so it never affects any scroll container's size or paints visibly. */}
      <div ref={measureRef} aria-hidden className="invisible fixed top-0 left-0 -z-50 w-[794px]">
        <Sheet doc={doc} />
      </div>
      {Array.from({ length: pageCount }).map((_, i) => (
        <div
          key={i}
          className="w-[794px] shrink-0 overflow-hidden rounded-lg shadow-sm"
          style={{ height: PAGE_HEIGHT }}
        >
          <div style={{ marginTop: -(i * PAGE_HEIGHT) }}>
            {/* `min-h` so a short document's own background (whatever the
                layout's colour, not always white) fills the rest of the
                page instead of the muted pane showing through beneath it. */}
            <Sheet doc={doc} className="min-h-[1123px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

const FONT_PILL_CLASSES: Record<FontId, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono'
};

// Sentinel for the Select — never stored on the doc. `doc.style.currencySign` holds
// the printable symbol either way; "custom mode" is derived from it not
// matching any preset symbol.
const CUSTOM_CURRENCY = '__custom__';

/** Matches Tailwind's `lg` breakpoint. The split-pane and the mobile tabs
 *  are two different trees, not one CSS-hidden the other — rendering both
 *  at once would duplicate every field's `id`, plus give the "Compartir"
 *  popover two DOM instances sharing one open/close state. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(true);
  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

/** One row of the "Personalizado" section: a swatch that opens the colour
 *  picker popover, the hex, and a reset that clears just that slot. */
function ColorRow({
  label,
  value,
  overridden,
  disabled,
  onPick,
  onReset
}: {
  label: string;
  value: string;
  overridden: boolean;
  disabled?: boolean;
  onPick: (hex: string) => void;
  onReset: () => void;
}) {
  return (
    <div className={cn('flex items-center gap-3', disabled && 'opacity-50')}>
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          aria-label={`Elegir color: ${label}`}
          className="group focus-visible:ring-ring relative size-8 shrink-0 cursor-pointer rounded-full ring-1 ring-black/15 outline-none ring-inset focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-default"
          style={{ backgroundColor: value }}
        >
          {/* pencil overlay: signals the swatch is editable */}
          <Pencil
            aria-hidden
            className="absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.55)] transition-transform group-hover:scale-110 group-disabled:hidden"
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60">
          <ColorPicker value={value} onChange={onPick} />
        </PopoverContent>
      </Popover>
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-muted-foreground font-mono text-[11px] uppercase tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onReset}
        disabled={!overridden || disabled}
        aria-label={`Restablecer ${label}`}
        className="text-muted-foreground hover:text-foreground disabled:invisible"
      >
        <RotateCcw />
      </Button>
    </div>
  );
}

/** The "Estilo" side of the form: layout / font / currency / signature colour
 *  — all under `doc.style`. */
function StylePicker({ doc, onChange }: { doc: Doc; onChange: (patch: Partial<Doc>) => void }) {
  const style = doc.style;
  const patchStyle = (p: Partial<Doc['style']>) => onChange({ style: { ...style, ...p } });
  const isCustomCurrency = !CURRENCIES.some(c => c.symbol === doc.style.currencySign);

  type ColorKey = 'bg' | 'ink';
  const custom = style.custom ?? {};
  const isCustomLayout = style.layout === 'personalizado';
  // Starting palette: the doc's current preset, so entering "Personalizado"
  // carries those colours over instead of snapping to plain black/white.
  const seed =
    LAYOUT_COLORS[isCustomLayout ? 'personalizado' : style.layout] ?? LAYOUT_COLORS.clasico;
  const colorOf = (k: ColorKey) => custom[k] ?? seed[k];
  const setColor = (k: ColorKey, hex: string) =>
    patchStyle({
      layout: 'personalizado',
      custom: isCustomLayout ? { ...custom, [k]: hex } : { ...seed, [k]: hex }
    });
  const resetColor = (k: ColorKey) => patchStyle({ custom: { ...custom, [k]: undefined } });

  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Color">
        <div className="flex flex-wrap items-center gap-2">
          {LAYOUTS.map(layout => (
            <Button
              key={layout.id}
              type="button"
              variant="ghost"
              size="icon-sm"
              title={layout.name}
              aria-label={layout.name}
              aria-pressed={style.layout === layout.id}
              onClick={() => patchStyle({ layout: layout.id })}
              className={cn(
                'shrink-0 rounded-full ring-1 ring-black/10 transition-shadow ring-inset hover:bg-transparent',
                style.layout === layout.id
                  ? 'ring-foreground ring-2 ring-offset-2'
                  : 'hover:ring-2 hover:ring-black/20'
              )}
              style={{ backgroundColor: layout.swatch }}
            />
          ))}
        </div>
      </FormSection>

      <FormSection title="Fuente">
        <div className="flex flex-wrap items-center gap-1.5">
          {FONTS.map(font => (
            <Button
              key={font.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => patchStyle({ font: font.id })}
              className={cn(
                'rounded-full text-xs',
                FONT_PILL_CLASSES[font.id],
                style.font === font.id
                  ? 'border-foreground font-medium'
                  : 'text-muted-foreground hover:border-muted-foreground/50'
              )}
            >
              {font.name}
            </Button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Moneda">
        <Select
          value={isCustomCurrency ? CUSTOM_CURRENCY : doc.style.currencySign}
          onValueChange={v => {
            if (!v) return;
            patchStyle({ currencySign: v === CUSTOM_CURRENCY ? '' : v });
          }}
        >
          <SelectTrigger aria-label="Moneda" className="h-9 w-full">
            {/* base-ui only resolves a selected item's label while its
             *  SelectContent has mounted at least once — closed on first
             *  paint it falls back to the raw `value`, which for a preset is
             *  already the symbol; only the `CUSTOM_CURRENCY` sentinel needs
             *  remapping. */}
            <SelectValue>
              {(value: string) => (value === CUSTOM_CURRENCY ? 'Personalizada' : value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(c => (
              <SelectItem key={c.symbol} value={c.symbol} title={c.label}>
                {c.symbol}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_CURRENCY}>Personalizada</SelectItem>
          </SelectContent>
        </Select>
        {isCustomCurrency && (
          <Input
            aria-label="Símbolo de moneda"
            value={doc.style.currencySign}
            onChange={e => patchStyle({ currencySign: e.target.value })}
            placeholder="Símbolo, ej: Bs, S/, ¥"
            className="h-9"
            maxLength={6}
            autoFocus
          />
        )}
      </FormSection>

      <FormSection title="Personalizado">
        <div className="flex flex-col gap-3">
          <ColorRow
            label="Fondo"
            value={colorOf('bg')}
            overridden={custom.bg != null}
            onPick={h => setColor('bg', h)}
            onReset={() => resetColor('bg')}
          />
          <ColorRow
            label="Texto y líneas"
            value={colorOf('ink')}
            overridden={custom.ink != null}
            onPick={h => setColor('ink', h)}
            onReset={() => resetColor('ink')}
          />
          <p className="text-muted-foreground text-xs">
            Para volver a un estilo predefinido, elegí un color de la paleta de arriba.
          </p>
        </div>
      </FormSection>

      <FormSection title="Firma">
        <div>
          <ColorRow
            label="Color de la firma"
            value={resolveSignatureColor(doc)}
            overridden={style.signatureColor != null}
            disabled={Boolean(doc.body.signature)}
            onPick={h => patchStyle({ signatureColor: h })}
            onReset={() => patchStyle({ signatureColor: undefined })}
          />
          {doc.body.signature && (
            <p className="text-muted-foreground mt-1.5 text-xs">
              El color se fija al firmar. Borrá la firma en Contenido para cambiarlo.
            </p>
          )}
        </div>
      </FormSection>
    </div>
  );
}

type FormTab = 'contenido' | 'estilo' | 'config';

/** ISO yyyy-mm-dd for today, in local time. */
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The "Configuración" side of the form: how the document leaves the app —
 *  export file name, PDF keywords, creation date. Kind-agnostic, like
 *  StylePicker. Empty fields mean "use the default" (name ← number, date ←
 *  today, no keywords). */
function SettingsForm({ doc, onChange }: { doc: Doc; onChange: (patch: Partial<Doc>) => void }) {
  const patchConfig = (p: Partial<Doc['config']>) => onChange({ config: { ...doc.config, ...p } });
  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Exportación">
        <FormField
          label="Nombre del archivo"
          htmlFor="cfg-filename"
          hint={`Se descargará como ${exportFileName(doc)}`}
        >
          <Input
            id="cfg-filename"
            value={doc.config.exportName ?? ''}
            onChange={e => patchConfig({ exportName: e.target.value || undefined })}
            placeholder={doc.body.name || 'presupuesto'}
          />
        </FormField>

        <FormField
          label="Palabras clave"
          htmlFor="cfg-keywords"
          hint="Separadas por comas. Se guardan en los metadatos del PDF."
        >
          <Input
            id="cfg-keywords"
            value={doc.config.keywords ?? ''}
            onChange={e => patchConfig({ keywords: e.target.value || undefined })}
            placeholder="diseño, identidad, marca"
          />
        </FormField>

        <FormField label="Fecha de creación" hint="Por defecto, la fecha de hoy.">
          <DateField
            label="Fecha de creación"
            value={doc.config.creationDate || todayIso()}
            onChange={iso => patchConfig({ creationDate: iso })}
            triggerClassName={FORM_INPUT_TRIGGER_CLASS}
          />
        </FormField>
      </FormSection>

      <FormSection title="Marca">
        <div className="flex items-center gap-2">
          <Checkbox
            id="cfg-brand-footer"
            checked={doc.config.showBrandFooter !== false}
            onCheckedChange={c => patchConfig({ showBrandFooter: c === true })}
          />
          <label htmlFor="cfg-brand-footer" className="text-sm">
            Mostrar <span className="font-medium">{SITE_HOST}</span> al pie del PDF
          </label>
        </div>
        <p className="text-muted-foreground text-xs">
          Una línea discreta al final del documento. Si reenvían el presupuesto, ayuda a que lleguen
          a la app.
        </p>
      </FormSection>
    </div>
  );
}

/** One-time, non-blocking callout at the top of the form pane: reassures that
 *  nothing leaves the browser, and points at the share link as the way to
 *  back up / move a document. `DocEditor` owns the "seen" flag and the share
 *  trigger; this is just the presentation. Positive framing on purpose — it's
 *  a privacy feature, not a warning, and must never read like a paywall. */
export function LocalStorageNotice({
  onShare,
  onDismiss
}: {
  onShare: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="border-border bg-muted/40 text-foreground relative mb-6 rounded-2xl border p-4 pr-10 text-sm">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Entendido, cerrar aviso"
        className="text-muted-foreground hover:text-foreground hover:bg-background absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full transition-colors"
      >
        <X className="size-4" />
      </button>
      <p className="flex items-center gap-2 font-medium">
        <Info className="text-muted-foreground size-4 shrink-0" aria-hidden />
        Todo se guarda en este navegador
      </p>
      <p className="text-muted-foreground mt-1.5">
        Los datos viven solo en este navegador. Para respaldarlos o abrirlos en otro dispositivo,
        usá{' '}
        <button
          type="button"
          onClick={onShare}
          className="font-medium underline underline-offset-1"
        >
          compartir
        </button>{' '}
        → link editable.
      </p>
    </div>
  );
}

/** Persistent (non-dismissible) callout: this browser can't persist anything
 *  — Firefox with storage blocked, a locked-down browser, or a private window
 *  that rejects writes. Editing / PDF / share links still work in memory; the
 *  library and autosave don't. `DocEditor` shows this instead of the one-time
 *  `LocalStorageNotice` when `isStorageAvailable()` resolves false. */
export function StorageUnavailableNotice({ onShare }: { onShare: () => void }) {
  return (
    <div className="relative mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="flex items-center gap-2 font-medium">
        <Info className="size-4 shrink-0 text-amber-600" aria-hidden />
        Este navegador no puede guardar
      </p>
      <p className="mt-1.5 text-amber-900">
        Podés armar el presupuesto y exportarlo o compartirlo por{' '}
        <button
          type="button"
          onClick={onShare}
          className="font-medium underline underline-offset-2"
        >
          link
        </button>
        , pero al cerrar la pestaña no queda guardado. Suele pasar en ventanas de incógnito o con el
        almacenamiento del navegador bloqueado.
      </p>
    </div>
  );
}

export type EditorWorkspaceProps = {
  /** The editing form (left column / "Editar" tab) and the read-only preview
   *  (right column / "Vista previa" tab). */
  Form: React.ComponentType<SheetProps>;
  Sheet: React.ComponentType<SheetProps>;
  doc: Doc;
  onChange: (patch: Partial<Doc>) => void;
  onLogoFile: (file: File) => void;
  /** Whole-doc actions (export / share / reset). Owned by DocEditor because
   *  they need its handlers and state; rendered below the form here. */
  actions: React.ReactNode;
  /** Rendered in the SiteHeader — DocEditor builds it from `doc`. */
  breadcrumb: React.ReactNode;
  /** Optional callout at the top of the form pane (the one-time local-storage
   *  notice). `null` once dismissed. */
  notice?: React.ReactNode;
};

/** RenderCV-style workspace for any document kind: a labeled-field `Form`
 *  edits the doc, a read-only `Sheet` previews it. Desktop keeps both on
 *  screen at once (form column + sticky preview). Below the `lg` breakpoint
 *  there isn't room, so a primary "Editar / Vista previa" switch trades a
 *  little speed for clarity.
 *
 *  That primary switch is a full-width segmented control, deliberately a
 *  heavier weight than the compact "Contenido / Estilo" sub-tabs inside the
 *  form — on mobile the two sit close together and must not read as the same
 *  control. */
export function EditorWorkspace({
  Form,
  Sheet,
  doc,
  onChange,
  onLogoFile,
  actions,
  breadcrumb,
  notice
}: EditorWorkspaceProps) {
  const isDesktop = useIsDesktop();
  const [view, setView] = React.useState<'editar' | 'preview'>('editar');
  // Sub-navigation inside the form panel — content fields vs. style controls,
  // RenderCV's CV/Design split. Independent of the primary view switch above
  // (base-ui's Tabs manages its own ids, so nesting is safe).
  const [formTab, setFormTab] = React.useState<FormTab>('contenido');
  // Preview zoom (desktop only), as an integer percent to avoid float drift.
  const [zoomPct, setZoomPct] = React.useState(100);
  // "Ajustar al ancho" isn't a one-off action, it's the default *mode*: on
  // by default, it keeps re-fitting as the pane resizes (dragging the split,
  // resizing the window) until the user manually zooms, which turns it off —
  // same push/pull as most PDF/image viewers' fit-to-width toggle.
  const [autoFit, setAutoFit] = React.useState(true);
  // The pane wrapper this measures — kept unzoomed (see the render below) so
  // `clientWidth` is a stable, real measurement to fit against, not one that
  // moves as the zoom we're about to set changes it.
  const previewPaneRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const pane = previewPaneRef.current;
    if (!pane || !autoFit) return;
    const applyFit = () => {
      const { paddingLeft, paddingRight } = getComputedStyle(pane);
      const available = pane.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight);
      setZoomPct(
        Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((available / PAGE_WIDTH) * 100)))
      );
    };
    applyFit();
    const ro = new ResizeObserver(applyFit);
    ro.observe(pane);
    return () => ro.disconnect();
  }, [autoFit]);

  const nudgeZoom = (delta: number) => {
    setAutoFit(false);
    setZoomPct(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
  };

  // Preview zoom control — lives in the SiteHeader's actions slot on desktop.
  const zoomControl = (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant={autoFit ? 'secondary' : 'ghost'}
              size="icon-sm"
              aria-label="Ajustar al ancho"
              aria-pressed={autoFit}
              onClick={() => setAutoFit(true)}
            />
          }
        >
          <Maximize2 />
        </TooltipTrigger>
        <TooltipContent>Ajustar al ancho</TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Alejar la vista previa"
        disabled={zoomPct <= ZOOM_MIN}
        onClick={() => nudgeZoom(-ZOOM_STEP)}
      >
        <Minus />
      </Button>
      <button
        type="button"
        onClick={() => {
          setAutoFit(false);
          setZoomPct(100);
        }}
        aria-label="Restablecer el zoom al 100%"
        className="text-muted-foreground hover:text-foreground w-11 text-center text-xs tabular-nums"
      >
        {zoomPct}%
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Acercar la vista previa"
        disabled={zoomPct >= ZOOM_MAX}
        onClick={() => nudgeZoom(ZOOM_STEP)}
      >
        <Plus />
      </Button>
    </div>
  );

  const formTabs = (
    <Tabs value={formTab} onValueChange={v => v && setFormTab(v as FormTab)}>
      <TabsList variant="line" className="px-0">
        <TabsTrigger value="contenido">Contenido</TabsTrigger>
        <TabsTrigger value="estilo">Estilo</TabsTrigger>
        <TabsTrigger value="config">Configuración</TabsTrigger>
      </TabsList>
    </Tabs>
  );
  const formBody =
    formTab === 'contenido' ? (
      <Form
        doc={doc}
        onChange={onChange}
        onLogoFile={onLogoFile}
        onEditStyle={() => setFormTab('estilo')}
      />
    ) : formTab === 'estilo' ? (
      <StylePicker doc={doc} onChange={onChange} />
    ) : (
      <SettingsForm doc={doc} onChange={onChange} />
    );
  // Mobile: tabs + body scroll together with the page.
  const formPanel = (
    <div>
      {notice}
      {formTabs}
      <div className="mt-6">{formBody}</div>
    </div>
  );

  if (isDesktop) {
    // Form and preview side by side, RenderCV-style. The shell fills the
    // (viewport-capped) SidebarInset via flex — SiteHeader on top, the
    // resizable panes below — so each pane scrolls entirely on its own:
    // scrolling the form never moves the preview, and the page never scrolls.
    // No primary view switch: there's room for both. The split width is
    // draggable and remembered per browser.
    return (
      <div className="flex h-full min-h-0 flex-col print:hidden">
        <SiteHeader
          actions={
            <div className="flex items-center gap-1">
              {actions}
              <span className="bg-border mx-1 h-5 w-px" aria-hidden />
              {zoomControl}
            </div>
          }
        >
          {breadcrumb}
        </SiteHeader>

        <ResizablePanelGroup orientation="horizontal" className="h-auto min-h-0 flex-1">
          <ResizablePanel
            id="form"
            defaultSize="40%"
            minSize="28%"
            maxSize="52%"
            className="flex h-full min-h-0 flex-col"
          >
            {/* Tabs pinned; only the form body below them scrolls. */}
            <div className="shrink-0 px-4 pt-6 pr-6 lg:px-6">{formTabs}</div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pr-6 pb-16 lg:px-6">
              {notice}
              {formBody}
            </div>
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className="hover:bg-border [&>div]:bg-muted-foreground/30 [&>div]:h-10"
          />
          <ResizablePanel
            id="preview"
            defaultSize="60%"
            // A muted canvas behind the (white) page, RenderCV-style — without
            // it the page just blends into the pane and loses its "floating
            // sheet" read, especially now that it's a fixed size rather than
            // stretching edge-to-edge.
            className="bg-muted overflow-y-auto overscroll-contain"
          >
            {/* Padding + centering live on this (unzoomed) wrapper, not the
                zoomed one below — `fitToWidth` needs a stable, zoom-independent
                box to measure against. */}
            <div ref={previewPaneRef} className="flex justify-center px-4 py-8 pl-6 lg:px-6">
              {/* `zoom` (not `transform: scale`) so the scroll container still
                  sizes to the scaled sheet — a long/multi-page document
                  scrolls inside this pane. The sheet itself is a fixed 794px
                  (A4 width at 96 CSS px/in), not responsive: it should always
                  look like the page you're about to download, not a web
                  layout that reflows to fit the pane — zoom only changes how
                  big that fixed page appears, and it's fine for the page to
                  run past the pane's edges (this wrapper scrolls) rather than
                  shrink to fit. */}
              <div style={{ zoom: zoomPct / 100 }}>
                <PaginatedSheet doc={doc} Sheet={Sheet} />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  return (
    <div className="print:hidden">
      {/* Whole-doc actions live in the sticky header on every breakpoint —
          top-right, always in view, one mental model with desktop. The mobile
          breadcrumb is trimmed to just the number to leave them room. */}
      <SiteHeader actions={actions}>
        <span className="text-muted-foreground truncate text-sm font-medium">
          {doc.body.name || 'Sin nombre'}
        </span>
      </SiteHeader>
      {/* Generous bottom padding so the last field / the preview clears the
          phone's browser chrome instead of hugging it. */}
      <div className="px-4 pt-4 pb-20">
        <Tabs value={view} onValueChange={v => v && setView(v as 'editar' | 'preview')}>
          {/* Primary level: full-width segmented control, its own weight. */}
          <TabsList className="h-10! w-full">
            <TabsTrigger value="editar">Editar</TabsTrigger>
            <TabsTrigger value="preview">Vista previa</TabsTrigger>
          </TabsList>
          <TabsContent value="editar" className="mt-6">
            {formPanel}
          </TabsContent>
          <TabsContent value="preview" className="mt-6">
            <Sheet doc={doc} className="mx-auto w-full max-w-xl" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
