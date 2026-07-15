export type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type TemplateId = 'minimal' | 'clasica' | 'calida';

export type Quote = {
  number: string;
  date: string; // ISO yyyy-mm-dd
  validUntil: string; // ISO yyyy-mm-dd
  currency: string;
  from: { name: string; detail: string };
  to: { name: string; detail: string };
  items: QuoteItem[];
  discountPct: number;
  taxPct: number;
  notes: string;
  template: TemplateId;
  /** PNG data URL, kept in the local draft and the PDF but never in share links. */
  logo?: string;
};

export const TEMPLATES: { id: TemplateId; name: string; swatch: string }[] = [
  { id: 'minimal', name: 'Minimal', swatch: '#171717' },
  { id: 'clasica', name: 'Clásica', swatch: '#e5e5e5' },
  { id: 'calida', name: 'Cálida', swatch: '#cbb3a4' }
];

export const CURRENCIES = [
  { code: 'ARS', label: 'ARS — Peso argentino' },
  { code: 'USD', label: 'USD — Dólar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'MXN', label: 'MXN — Peso mexicano' },
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'COP', label: 'COP — Peso colombiano' },
  { code: 'UYU', label: 'UYU — Peso uruguayo' },
  { code: 'PEN', label: 'PEN — Sol peruano' },
  { code: 'BRL', label: 'BRL — Real brasileño' }
] as const;

export function newItem(): QuoteItem {
  return {
    id: Math.random().toString(36).slice(2, 10),
    description: '',
    quantity: 1,
    unitPrice: 0
  };
}

export function emptyQuote(): Quote {
  const today = new Date();
  const valid = new Date(today);
  valid.setDate(valid.getDate() + 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    number: `P-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-01`,
    date: iso(today),
    validUntil: iso(valid),
    currency: 'ARS',
    from: { name: '', detail: '' },
    to: { name: '', detail: '' },
    items: [newItem()],
    discountPct: 0,
    taxPct: 0,
    notes: '',
    template: 'minimal'
  };
}

export function computeTotals(q: Quote) {
  const subtotal = q.items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const discount = subtotal * ((q.discountPct || 0) / 100);
  const taxBase = subtotal - discount;
  const tax = taxBase * ((q.taxPct || 0) / 100);
  return { subtotal, discount, tax, total: taxBase + tax };
}

export function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol'
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

// --- Share links: quote serialized as base64url JSON in the URL hash ---
//
// Edit protection without a backend: every shared payload carries the SHA-256
// hash of a random edit key ("eh"). Only the editable link also carries the
// key itself ("&k="). On load, hash(k) must match eh to unlock editing, so a
// read-only link can't be flipped to editable by tweaking a flag — the key
// isn't derivable from the hash. (The data itself is still readable by design.)

function toB64url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function parsePayload(json: string): { quote: Quote; editHash?: string } | null {
  const parsed = JSON.parse(json);
  if (!parsed || !Array.isArray(parsed.items)) return null;
  const { eh, ...rest } = parsed;
  return {
    quote: { ...emptyQuote(), ...rest } as Quote,
    editHash: typeof eh === 'string' ? eh : undefined
  };
}

async function pipeBytes(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream
): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Returns the share hash fragment: "c=…" (deflate, ~half the size) or the
 *  uncompressed "d=…" when CompressionStream isn't available. */
export async function encodeSharePayload(q: Quote, editHash?: string): Promise<string> {
  // A base64 logo would blow the link up to tens of thousands of chars.
  const { logo: _logo, ...shareable } = q;
  const payload = editHash ? { ...shareable, eh: editHash } : shareable;
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const deflated = await pipeBytes(bytes, new CompressionStream('deflate-raw'));
      return `c=${toB64url(deflated)}`;
    } catch {
      // fall through to uncompressed
    }
  }
  return `d=${toB64url(bytes)}`;
}

export async function decodeShareParams(
  params: URLSearchParams
): Promise<{ quote: Quote; editHash?: string } | null> {
  try {
    const compressed = params.get('c');
    if (compressed) {
      const bytes = await pipeBytes(fromB64url(compressed), new DecompressionStream('deflate-raw'));
      return parsePayload(new TextDecoder().decode(bytes));
    }
    const plain = params.get('d');
    if (plain) {
      return parsePayload(new TextDecoder().decode(fromB64url(plain)));
    }
    return null;
  } catch {
    return null;
  }
}

export function randomEditKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toB64url(bytes);
}

export async function hashEditKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return toB64url(new Uint8Array(digest));
}
