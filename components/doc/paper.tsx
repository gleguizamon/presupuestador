import * as React from 'react';
import { FontId, LAYOUT_COLORS, LayoutId } from '@/lib/doc/types';
import { cn } from '@/lib/utils';

export type SheetTheme = {
  sheet: string;
  display: string;
  eyebrow: string;
  muted: string;
  strong: string;
  headRule: string;
  rowRule: string;
  totalWrap: string;
  logoWrap: string;
};

// Structural format: rules, spacing, color treatment. Typeface is applied
// separately via FONT_CLASSES so any layout can be paired with any font, and
// any document kind can be paired with any layout.
export const LAYOUT_THEMES: Record<LayoutId, SheetTheme> = {
  clasico: {
    sheet: 'bg-white text-neutral-900',
    display: 'text-2xl tracking-wide font-semibold',
    eyebrow: 'text-neutral-500',
    muted: 'text-neutral-500',
    strong: 'text-neutral-900',
    headRule: 'border-neutral-900',
    rowRule: 'border-neutral-200',
    totalWrap: 'border-t border-neutral-900',
    logoWrap: ''
  },
  calido: {
    sheet: 'bg-[#F7F2ED] text-[#4A403B]',
    display: 'text-2xl tracking-wide font-semibold text-[#7C5C55]',
    eyebrow: 'text-[#9C8578]',
    muted: 'text-[#9C8578]',
    strong: 'text-[#4A403B]',
    headRule: 'border-[#B49286]',
    rowRule: 'border-[#E4D8CC]',
    totalWrap: 'rounded-md bg-[#EDE3D9] px-3 py-1.5',
    logoWrap: 'rounded-lg bg-[#EDE3D9] px-4 py-3'
  },
  moderno: {
    sheet: 'bg-white text-neutral-900',
    display: 'text-2xl font-bold text-blue-700',
    eyebrow: 'text-blue-600',
    muted: 'text-neutral-500',
    strong: 'text-neutral-900',
    headRule: 'border-b-2 border-blue-600',
    rowRule: 'border-neutral-200',
    totalWrap: 'rounded-md bg-blue-50 px-3 py-1.5 text-blue-900',
    logoWrap: 'rounded-lg bg-blue-50 px-4 py-3'
  },
  // The Canva-style content-creator proposal: warm cream paper, olive-green
  // display type. Introduced for `propuesta`, but any doc kind can use it.
  oliva: {
    sheet: 'bg-[#F5F1E6] text-[#4A4132]',
    display: 'text-2xl tracking-wide font-semibold text-[#71805A]',
    eyebrow: 'text-[#8C8267]',
    muted: 'text-[#8C8267]',
    strong: 'text-[#4A4132]',
    headRule: 'border-[#71805A]',
    rowRule: 'border-[#E4DCC8]',
    totalWrap: 'rounded-md bg-[#EAE4D2] px-3 py-1.5',
    logoWrap: 'rounded-lg bg-[#EAE4D2] px-4 py-3'
  },
  // Structure of `clasico`, but every colour comes from CSS variables that
  // `Paper` sets from `doc.style.custom` (the "Personalizado" accordion in Estilo).
  // The class strings are static — only the var *values* are dynamic — so
  // Tailwind still generates them.
  personalizado: {
    // Arbitrary values that are CSS vars need a data-type hint (`color:`) or
    // Tailwind can't tell a colour from a length — without it the line
    // utilities (headRule / rowRule / totalWrap) silently do nothing. The
    // sheet itself has no border: the exported PDF has none, so neither does
    // the preview, and "Texto y líneas" only drives the inner rules.
    sheet: 'bg-[var(--doc-bg)] text-[color:var(--doc-ink)]',
    display: 'text-2xl font-semibold tracking-wide text-[color:var(--doc-ink)]',
    eyebrow: 'text-[color:var(--doc-muted)]',
    muted: 'text-[color:var(--doc-muted)]',
    strong: 'text-[color:var(--doc-ink)]',
    headRule: 'border-[color:var(--doc-ink)]',
    rowRule: 'border-[color:var(--doc-line)]',
    totalWrap: 'border-t border-[color:var(--doc-ink)]',
    logoWrap: ''
  }
};

/** Inline CSS vars for the `personalizado` layout — palette from `custom`,
 *  gaps filled from `LAYOUT_COLORS.personalizado`, `--doc-muted` derived as
 *  the ink blended halfway into the background. Rules (`--doc-line`) follow
 *  the ink colour rather than being set on their own. */
function customVars(custom?: { bg?: string; ink?: string }): React.CSSProperties {
  const bg = custom?.bg || LAYOUT_COLORS.personalizado.bg;
  const ink = custom?.ink || LAYOUT_COLORS.personalizado.ink;
  return {
    '--doc-bg': bg,
    '--doc-ink': ink,
    '--doc-line': ink,
    '--doc-muted': `color-mix(in srgb, ${ink} 55%, ${bg})`
  } as React.CSSProperties;
}

export const FONT_CLASSES: Record<FontId, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono'
};

/** The document's outer sheet — the physical paper. Every per-kind Sheet
 *  component renders one of these and puts its content inside. */
export function Paper({
  layout,
  font,
  custom,
  className,
  children
}: {
  layout: LayoutId;
  font: FontId;
  custom?: { bg?: string; ink?: string; line?: string };
  className?: string;
  children: React.ReactNode;
}) {
  const t = LAYOUT_THEMES[layout] ?? LAYOUT_THEMES.clasico;
  return (
    <div
      style={layout === 'personalizado' ? customVars(custom) : undefined}
      className={cn(
        'rounded-lg px-6 py-8 text-[13px] leading-relaxed shadow-sm sm:px-12 sm:py-10',
        t.sheet,
        FONT_CLASSES[font] ?? FONT_CLASSES.sans,
        className
      )}
    >
      {children}
    </div>
  );
}
