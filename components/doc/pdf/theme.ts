import { Font } from '@react-pdf/renderer';
import { FontId, LayoutId } from '@/lib/doc/types';

// Built-in PDF fonts (Helvetica, Times) need no registration. Geist Mono does,
// self-hosted from /public since this renders client-side via pdf().toBlob().
// Registration is a module-level side effect, so importing this file once
// (from any per-kind PDF component) is enough for the whole app.
Font.register({
  family: 'Geist Mono',
  src: '/fonts/GeistMono-Regular.ttf'
});
Font.register({
  family: 'Geist Mono Bold',
  src: '/fonts/GeistMono-Bold.ttf'
});

export type PdfTheme = {
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  line: string;
  headRule: string;
  band?: string;
};

// Structural format: colors and spacing. Typeface is applied separately via
// FONT_FAMILIES so any layout can be paired with any font, and any document
// kind can be paired with any layout.
export const LAYOUT_THEMES: Record<LayoutId, PdfTheme> = {
  clasico: {
    bg: '#ffffff',
    ink: '#171717',
    muted: '#737373',
    accent: '#171717',
    line: '#e5e5e5',
    headRule: '#171717'
  },
  calido: {
    bg: '#F7F2ED',
    ink: '#4A403B',
    muted: '#9C8578',
    accent: '#7C5C55',
    line: '#E4D8CC',
    headRule: '#B49286',
    band: '#EDE3D9'
  },
  moderno: {
    bg: '#ffffff',
    ink: '#171717',
    muted: '#737373',
    accent: '#2563EB',
    line: '#e5e5e5',
    headRule: '#2563EB',
    band: '#EFF6FF'
  },
  oliva: {
    bg: '#F5F1E6',
    ink: '#4A4132',
    muted: '#8C8267',
    accent: '#71805A',
    line: '#E4DCC8',
    headRule: '#71805A',
    band: '#EAE4D2'
  },
  // Placeholder — the real palette for `personalizado` comes from
  // `customPdfTheme(doc.style.custom)`, since it can't live in a static table.
  personalizado: {
    bg: '#ffffff',
    ink: '#171717',
    muted: '#737373',
    accent: '#171717',
    line: '#e5e5e5',
    headRule: '#171717'
  }
};

/** Blend two hex colours (`amt` = share of `b`). @react-pdf has no
 *  `color-mix`, so `muted` is computed here. */
function mixHex(a: string, b: string, amt: number): string {
  const rgb = (h: string) => {
    const s = h.replace('#', '');
    const n =
      s.length === 3
        ? s
            .split('')
            .map(c => c + c)
            .join('')
        : s;
    return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16));
  };
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const ch = (x: number, y: number) => Math.round(x + (y - x) * amt);
  return (
    '#' + [ch(r1, r2), ch(g1, g2), ch(b1, b2)].map(v => v.toString(16).padStart(2, '0')).join('')
  );
}

/** PDF palette for the `personalizado` layout, from `doc.style.custom` with the
 *  same fallbacks and derived `muted` as the on-screen `Paper`. */
export function customPdfTheme(custom?: { bg?: string; ink?: string }): PdfTheme {
  const bg = custom?.bg || '#ffffff';
  const ink = custom?.ink || '#171717';
  // Rules/lines follow the ink colour — not customised on their own.
  return { bg, ink, line: ink, accent: ink, headRule: ink, muted: mixHex(ink, bg, 0.45) };
}

export const FONT_FAMILIES: Record<FontId, { font: string; fontBold: string }> = {
  sans: { font: 'Helvetica', fontBold: 'Helvetica-Bold' },
  serif: { font: 'Times-Roman', fontBold: 'Times-Bold' },
  mono: { font: 'Geist Mono', fontBold: 'Geist Mono Bold' }
};

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}
