'use client';

import * as React from 'react';
import { Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Hex-only colour picker — a saturation/value plane, a hue slider, a hex
 *  field and preset swatches. Adapted from shadcn-form.com's ColorPicker,
 *  trimmed to what a document palette needs: no alpha, no RGB/HSL modes.
 *  Meant to live inside a Popover (the style panel's ColorRow, the quote
 *  form's signature-colour field). */

type Rgb = { r: number; g: number; b: number };
type Hsv = { h: number; s: number; v: number };

type EyeDropperAPI = { open: () => Promise<{ sRGBHex: string }> };
declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperAPI;
  }
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

function parseHex(hex: string): Rgb | null {
  const raw = hex.trim().replace('#', '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === rn) h = ((gn - bn) / diff) % 6;
    else if (max === gn) h = (bn - rn) / diff + 2;
    else h = (rn - gn) / diff + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return { h, s: round((max === 0 ? 0 : diff / max) * 100, 1), v: round(max * 100, 1) };
}

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const val = clamp(v, 0, 100) / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;

  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g] = [c, x];
  else if (hue < 120) [r, g] = [x, c];
  else if (hue < 180) [g, b] = [c, x];
  else if (hue < 240) [g, b] = [x, c];
  else if (hue < 300) [r, b] = [x, c];
  else [r, b] = [c, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

const RANGE_THUMB =
  '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.35)] [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent';

export function ColorPicker({
  value,
  onChange,
  swatches
}: {
  value: string;
  onChange: (hex: string) => void;
  swatches?: string[];
}) {
  const [hsv, setHsv] = React.useState<Hsv>(() =>
    rgbToHsv(parseHex(value) ?? { r: 23, g: 23, b: 23 })
  );
  const [hexDraft, setHexDraft] = React.useState(() => value.toUpperCase());
  const [syncedValue, setSyncedValue] = React.useState(value);

  // Re-sync when `value` changes from outside (reset, an external swatch) —
  // React's "adjust state during render" pattern, not an effect. Skipped when
  // the incoming value already matches what the plane shows (our own emit).
  if (value !== syncedValue) {
    setSyncedValue(value);
    const next = parseHex(value);
    if (next && rgbToHex(hsvToRgb(hsv)).toLowerCase() !== value.toLowerCase()) {
      setHsv(rgbToHsv(next));
    }
    setHexDraft(value.toUpperCase());
  }

  const rgb = hsvToRgb(hsv);
  const hex = rgbToHex(rgb);

  const commit = (nextHsv: Hsv) => {
    setHsv(nextHsv);
    const h = rgbToHex(hsvToRgb(nextHsv));
    setHexDraft(h.toUpperCase());
    onChange(h);
  };

  const updatePlane = (clientX: number, clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const s = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const v = clamp(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100);
    commit({ ...hsv, s: round(s, 1), v: round(v, 1) });
  };

  const eyedropper = async () => {
    if (typeof window === 'undefined' || !window.EyeDropper) return;
    try {
      const { sRGBHex } = await new window.EyeDropper().open();
      const next = parseHex(sRGBHex);
      if (next) commit(rgbToHsv(next));
    } catch {
      // cancelled
    }
  };

  const presets = swatches ?? DEFAULT_SWATCHES;

  return (
    <div className="flex w-full flex-col gap-3">
      {/* saturation / value plane */}
      <div
        className="relative h-40 w-full cursor-crosshair touch-none overflow-hidden rounded-md border"
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId);
          updatePlane(e.clientX, e.clientY, e.currentTarget);
        }}
        onPointerMove={e => {
          if ((e.buttons & 1) === 1) updatePlane(e.clientX, e.clientY, e.currentTarget);
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: hex }}
        />
      </div>

      {/* hue */}
      <input
        type="range"
        min={0}
        max={360}
        value={hsv.h}
        aria-label="Matiz"
        onChange={e => commit({ ...hsv, h: Number(e.target.value) })}
        className={cn(
          'h-4 w-full cursor-pointer appearance-none rounded-full border p-0',
          RANGE_THUMB
        )}
        style={{
          background:
            'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
        }}
      />

      {/* hex + eyedropper */}
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-8 shrink-0 rounded-md border"
          style={{ backgroundColor: hex }}
        />
        <Input
          value={hexDraft}
          aria-label="Código hex"
          spellCheck={false}
          onChange={e => {
            const raw = e.target.value;
            setHexDraft(raw);
            const next = parseHex(raw);
            if (next) commit(rgbToHsv(next));
          }}
          onBlur={() => setHexDraft(hex.toUpperCase())}
          className="h-8 font-mono text-xs uppercase"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={eyedropper}
          disabled={typeof window === 'undefined' || !window.EyeDropper}
          title="Cuentagotas"
          aria-label="Cuentagotas"
        >
          <Pipette />
        </Button>
      </div>

      {/* presets */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map(s => (
          <button
            key={s}
            type="button"
            aria-label={s}
            onClick={() => {
              const next = parseHex(s);
              if (next) commit(rgbToHsv(next));
            }}
            className="size-6 rounded-md border ring-offset-1 transition-transform hover:scale-110"
            style={{ backgroundColor: s }}
          />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_SWATCHES = [
  '#ffffff',
  '#f5f1e6',
  '#171717',
  '#4a4132',
  '#e5e5e5',
  '#8da47e',
  '#2563eb',
  '#cbb3a4'
];
