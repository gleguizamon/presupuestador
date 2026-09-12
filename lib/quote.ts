import { Doc, emptyDoc } from '@/lib/doc/types';

export { computeTotals, formatMoney, LAYOUTS, FONTS, CURRENCIES, newItem } from '@/lib/doc/types';
export type { Doc, LayoutId, FontId, QuoteItem, Party } from '@/lib/doc/types';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Keys never dropped from a share payload even when they equal the default:
 *  `emptyDoc()` derives them from *today*, so re-filling them on the
 *  recipient's machine (possibly a different day) would silently change the
 *  document. */
const KEEP_IN_SHARE = new Set(['date', 'validUntil']);

/** Recursively drops every value equal to the same path in `ref` (a fresh
 *  `emptyDoc`), so a share link only carries what the user actually changed.
 *  `withDocDefaults` puts the defaults back on the other side. Arrays are
 *  kept whole (positional, and item ids must survive the round-trip). */
function stripDefaults(value: unknown, ref: unknown): unknown {
  if (isPlainObject(value) && isPlainObject(ref)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (KEEP_IN_SHARE.has(k)) {
        out[k] = v;
        continue;
      }
      const kept = stripDefaults(v, ref[k]);
      if (kept !== undefined) out[k] = kept;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return JSON.stringify(value) === JSON.stringify(ref) ? undefined : value;
}

/** Deep-merges plain objects (later sources win); arrays and primitives
 *  replace wholesale. The read side of `stripDefaults` — a partial `body` or
 *  `from` in the payload merges onto the `emptyDoc` shape instead of
 *  clobbering the sibling defaults a shallow spread would drop. */
function deepMerge(
  ...sources: Array<Record<string, unknown> | undefined>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const src of sources) {
    if (!src) continue;
    for (const [k, v] of Object.entries(src)) {
      out[k] =
        isPlainObject(v) && isPlainObject(out[k])
          ? deepMerge(out[k] as Record<string, unknown>, v)
          : v;
    }
  }
  return out;
}

/** Merges a parsed share payload (already `stripDefaults`-trimmed) onto a
 *  fresh document, so the URL only has to carry what the user changed. */
export function withDocDefaults(parsed: Record<string, unknown>): Doc {
  return deepMerge(emptyDoc() as unknown as Record<string, unknown>, parsed) as unknown as Doc;
}

// --- Share links: doc serialized as base64url JSON in the URL hash ---
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

function parsePayload(json: string): { doc: Doc; editHash?: string } | null {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object') return null;
  const { eh, ...rest } = parsed;
  return {
    doc: withDocDefaults(rest),
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
 *  uncompressed "d=…" when CompressionStream isn't available. Drops the id and
 *  timestamps (a shared link is a stateless snapshot, not a synced record),
 *  the logo and the drawn signature from `body` (both are multi-KB PNG data
 *  URLs — they'd push the URL past QR capacity, and a real signature isn't
 *  something to carry in a pasteable link), and then every field still at its
 *  `emptyDoc` default, so the URL only carries what the user actually filled
 *  in (`withDocDefaults` restores the rest). */
export async function encodeSharePayload(doc: Doc, editHash?: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit these three, keep the rest
  const { id, createdAt, updatedAt, ...shareable } = doc;
  const body = { ...shareable.body };
  delete body.logo;
  if (body.signature) body.signature = '';
  const stripped = { ...shareable, body };
  const trimmed = (stripDefaults(stripped, emptyDoc()) as Record<string, unknown>) ?? {};
  const payload = editHash ? { ...trimmed, eh: editHash } : trimmed;
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
): Promise<{ doc: Doc; editHash?: string } | null> {
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
