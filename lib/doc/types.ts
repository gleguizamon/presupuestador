/** Structural format: rules, spacing, color treatment. Independent of
 *  typeface. `personalizado` is the "bring your own colours" layout —
 *  structure of `clasico`, palette driven by `Doc.custom`. */
export type LayoutId = 'clasico' | 'calido' | 'moderno' | 'oliva' | 'personalizado';

/** Per-layout base colours (hex), for seeding the "Personalizado" pickers and
 *  as the fallback when a `custom` slot is left empty. Kept dependency-free
 *  here so the editor can read it without pulling in the PDF renderer. */
export type LayoutColors = { bg: string; ink: string };
export const LAYOUT_COLORS: Record<LayoutId, LayoutColors> = {
  clasico: { bg: '#ffffff', ink: '#171717' },
  calido: { bg: '#F7F2ED', ink: '#4A403B' },
  moderno: { bg: '#ffffff', ink: '#171717' },
  oliva: { bg: '#F5F1E6', ink: '#4A4132' },
  personalizado: { bg: '#ffffff', ink: '#171717' }
};

/** Typeface, applicable to any layout. */
export type FontId = 'sans' | 'serif' | 'mono';

export type Party = { name: string; detail: string };

export type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

/** The document itself — everything the "Contenido" side of the form edits. */
export type QuoteBody = {
  /** The doc's name/label. Auto-seeded as `001`, `002`, … but free text. */
  name: string;
  date: string; // ISO yyyy-mm-dd
  validUntil: string; // ISO yyyy-mm-dd — the quote's expiry
  from: Party;
  to: Party;
  notes: string;
  /** PNG data URL. Kept in the local doc and the PDF, dropped from share links. */
  logo?: string;
  items: QuoteItem[];
  discountPct: number;
  taxPct: number;
  /** Hand-drawn signature as a transparent PNG data URL, produced by the
   *  form's signature pad. Empty string = no signature. Dropped from share
   *  links (heavy); stripped when empty like any default otherwise. */
  signature: string;
};

/** Appearance — everything the editor's "Estilo" tab controls. */
export type DocStyle = {
  layout: LayoutId;
  font: FontId;
  /** Colour overrides for the `personalizado` layout. Any slot left unset
   *  falls back to `LAYOUT_COLORS.personalizado`. Hex. Rules/lines follow
   *  `ink`, they aren't customised separately. */
  custom?: { bg?: string; ink?: string };
  /** Ink colour of the signature strokes. Optional override — when unset the
   *  signature follows the document's ink colour (see `resolveSignatureColor`),
   *  so it contrasts a custom background the same way the body text does. Hex. */
  signatureColor?: string;
  /** The currency symbol as printed — `$`, `US$`, `€`, or a hand-typed one.
   *  Not an ISO code; `formatMoney` just prepends it. */
  currencySign: string;
};

/** Export / PDF-metadata overrides — the editor's "Configuración" tab. Every
 *  field empty means "use the default": file name ← `body.name`, creation
 *  date ← today, no keywords. */
export type DocConfig = {
  exportName?: string;
  keywords?: string;
  creationDate?: string; // ISO yyyy-mm-dd
  /** The discreet site-URL line at the foot of the exported PDF. Defaults on;
   *  only ever off when the user unticks it in Configuración. Not a paywall —
   *  a courtesy toggle for formal printed quotes. */
  showBrandFooter?: boolean;
};

/** A presupuesto — the only document kind. `Doc` and `QuoteDoc` are the same
 *  type; both names are kept because call sites use either.
 *
 *  Everything the user actually types lives in `body`; the top level is
 *  metadata (identity, appearance, export settings). */
export type Doc = {
  /** Primary key in IndexedDB and identity across renames/duplicates. */
  id: string;
  style: DocStyle;
  config: DocConfig;
  createdAt: number;
  updatedAt: number;
  body: QuoteBody;
};

export type QuoteDoc = Doc;

/** Props shared by the read-only `Sheet` and the editing `Form`. The Sheet
 *  never accepts input — it's a pure preview, reused verbatim for the Cmd+P
 *  sheet and the read-only share view, so what's edited never drifts from
 *  what's printed. Only the Form side ever sets `onChange` / `onLogoFile` /
 *  `onEditStyle`. */
export type SheetProps = {
  doc: Doc;
  className?: string;
  onChange?: (patch: Partial<Doc>) => void;
  onLogoFile?: (file: File) => void;
  /** Form-only: jump to the "Estilo" sub-tab (used by the signature hint). */
  onEditStyle?: () => void;
};

export const LAYOUTS: { id: LayoutId; name: string; swatch: string }[] = [
  { id: 'clasico', name: 'Clásico', swatch: '#171717' },
  { id: 'calido', name: 'Cálida', swatch: '#cbb3a4' },
  { id: 'moderno', name: 'Moderno', swatch: '#2563eb' },
  { id: 'oliva', name: 'Oliva', swatch: '#8DA47E' }
];

export const FONTS: { id: FontId; name: string }[] = [
  { id: 'sans', name: 'Sans' },
  { id: 'serif', name: 'Serif' },
  { id: 'mono', name: 'Mono' }
];

/** The four most-used currencies for the picker. `doc.style.currencySign` stores the
 *  `symbol` directly (the picker just writes it through); anything else goes
 *  through "Personalizada" as a hand-typed symbol. The `symbol`s are distinct,
 *  so the picker reverse-maps sign → this list to show which preset is active. */
export const CURRENCIES = [
  { label: 'Dólar', symbol: 'US$' },
  { label: 'Euro', symbol: '€' },
  { label: 'Peso', symbol: '$' },
  { label: 'Real', symbol: 'R$' }
] as const;

/** Short random id (8 hex chars, like a short commit). Ample for a local
 *  library of at most a few hundred docs, and it reads nicely in `/editor/[id]`. */
export function newDocId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)), b =>
    b.toString(16).padStart(2, '0')
  ).join('');
}

export function newItem(): QuoteItem {
  return {
    id: Math.random().toString(36).slice(2, 10),
    description: '',
    quantity: 1,
    unitPrice: 0
  };
}

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A freshly created presupuesto — one empty line item, no adjustments. */
export function emptyDoc(): Doc {
  const now = Date.now();
  return {
    id: newDocId(),
    style: { layout: 'clasico', font: 'sans', currencySign: '$' },
    config: { showBrandFooter: true },
    createdAt: now,
    updatedAt: now,
    body: {
      // A plain sequence start — the user renames it as they like.
      name: '001',
      date: new Date().toISOString().slice(0, 10),
      validUntil: isoDaysFromNow(30),
      from: { name: '', detail: '' },
      to: { name: '', detail: '' },
      notes: '',
      items: [newItem()],
      discountPct: 0,
      taxPct: 0,
      signature: ''
    }
  };
}

/** Recursively drop identity/timestamp keys and sort the rest, so two docs
 *  can be compared by value regardless of key order or random row ids. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      out[key] = canonical((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/** True when `doc` is byte-for-byte a freshly created document — nothing the
 *  user could have typed has changed (ignoring its id/timestamps and the
 *  random ids of empty rows). Used to garbage-collect an untouched document
 *  from IndexedDB when the editor is left. `date`/`validUntil` are part of the
 *  comparison, so a document opened on a later day is kept. */
export function isPristineDoc(doc: Doc): boolean {
  return JSON.stringify(canonical(doc)) === JSON.stringify(canonical(emptyDoc()));
}

/** File name for the exported PDF (with extension). Uses `config.exportName`
 *  when set, else `name`; strips only the characters that break a download,
 *  otherwise left as the user typed it. */
export function exportFileName(doc: Doc): string {
  const base = (doc.config.exportName?.trim() || doc.body.name?.trim() || 'documento')
    .replace(/[/\\:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return `${base || 'documento'}.pdf`;
}

/** Human title for the PDF metadata (shown as the tab/window name in a viewer).
 *  `config.exportName` verbatim when set; otherwise the doc name, prefixed with
 *  "Presupuesto " only when it doesn't already start with it — so a doc the user
 *  named "Presupuesto" doesn't come out as "Presupuesto Presupuesto", while the
 *  default "001" still reads as "Presupuesto 001". */
export function exportTitle(doc: Doc): string {
  const custom = doc.config.exportName?.trim();
  if (custom) return custom;
  const name = doc.body.name?.trim();
  if (!name) return 'Presupuesto';
  return /^presupuesto\b/i.test(name) ? name : `Presupuesto ${name}`;
}

/** Creation date for the PDF metadata, as a `Date`. `config.creationDate` when
 *  the user set one in Configuración, otherwise today. */
export function docCreationDate(doc: Doc): Date {
  if (doc.config.creationDate) {
    const [y, m, d] = doc.config.creationDate.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  return new Date();
}

/** The document's ink (text / rules) colour: `custom.ink` for the
 *  `personalizado` layout, the layout's base ink otherwise. */
export function docInkColor(doc: Doc): string {
  if (doc.style.layout === 'personalizado') {
    return doc.style.custom?.ink || LAYOUT_COLORS.personalizado.ink;
  }
  return (LAYOUT_COLORS[doc.style.layout] ?? LAYOUT_COLORS.clasico).ink;
}

/** Signature stroke colour: the explicit `style.signatureColor` override when
 *  set, otherwise the document's ink colour so it stays legible on a custom
 *  background. */
export function resolveSignatureColor(doc: Doc): string {
  return doc.style.signatureColor || docInkColor(doc);
}

export function computeTotals(body: QuoteBody) {
  const subtotal = body.items.reduce(
    (acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0),
    0
  );
  const discount = subtotal * ((body.discountPct || 0) / 100);
  const taxBase = subtotal - discount;
  const tax = taxBase * ((body.taxPct || 0) / 100);
  return { subtotal, discount, tax, total: taxBase + tax };
}

export function formatMoney(value: number, currencySign: string) {
  // `currencySign` is already the printable symbol — no ISO lookup. Grouping
  // and decimals are formatted plain (Intl's `style: 'currency'` would reject
  // a hand-typed sign) and the sign is prepended.
  const sign = currencySign.trim();
  const number = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  return sign ? `${sign} ${number}` : number;
}
