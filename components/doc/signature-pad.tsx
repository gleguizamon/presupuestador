'use client';

import * as React from 'react';
import { Check, Eraser, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Inline draw-your-signature field (shadcn-form.com's `signature-input`
 *  pattern), sitting right in the form's "Firma" section. The canvas only
 *  captures input while **armed** (a "Firmar" button toggles it) — otherwise a
 *  touch that lands on it just scrolls the page, so nobody signs by accident.
 *  Every stroke autosaves the canvas as a transparent PNG data URL through
 *  `onChange`; empty string = no signature.
 *
 *  Strokes are drawn in `color` (the "Firma" control under the Estilo tab) and
 *  the colour is baked into the PNG at draw time — there's no re-tint, so
 *  changing `color` afterwards does nothing until the signature is cleared and
 *  redrawn. The UI says as much (hint here + the disabled control in Estilo). */

// Backing-store resolution — the exported PNG's real pixels. CSS scales it to
// the form column; pointer coords are mapped back through the bounding rect.
const W = 640;
const H = 200;

export function SignaturePad({
  value,
  onChange,
  color,
  onEditStyle,
  className
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  /** Stroke colour — the "Firma" control under the Estilo tab. Hex. Only
   *  applies to strokes drawn from now on; an existing signature keeps the
   *  colour it was drawn in. */
  color: string;
  /** Jump to the "Estilo" tab — turns "Estilo" in the hint into a link. */
  onEditStyle?: () => void;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const drew = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = React.useState(Boolean(value));
  const [syncedValue, setSyncedValue] = React.useState(value);
  // Armed = the canvas takes pointer input. Off by default so scrolling over
  // the pad never draws.
  const [armed, setArmed] = React.useState(false);

  if (value !== syncedValue) {
    setSyncedValue(value);
    setHasInk(Boolean(value));
  }

  const ctx = () => {
    const context = canvasRef.current?.getContext('2d');
    if (context) {
      context.lineWidth = 2.5;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = color;
    }
    return context ?? null;
  };

  /** Draw a saved data URL onto the visible canvas. `hasInk` is kept in sync
   *  during render, not here. */
  const paint = React.useCallback((src: string) => {
    const c = canvasRef.current;
    const context = c?.getContext('2d');
    if (!c || !context) return;
    context.clearRect(0, 0, W, H);
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, W, H);
      context.drawImage(img, 0, 0, W, H);
      setHasInk(true);
    };
    img.src = src;
  }, []);

  // Paint whatever's saved, once, on mount. The editor remounts per document
  // (keyed), so a later external `value` change doesn't happen here — only our
  // own writes do, and those are already on the canvas.
  React.useEffect(() => {
    paint(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!armed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    drew.current = false;
    last.current = pos(e);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = ctx();
    if (!context || !last.current) return;
    const p = pos(e);
    const midX = (last.current.x + p.x) / 2;
    const midY = (last.current.y + p.y) / 2;
    context.beginPath();
    context.moveTo(last.current.x, last.current.y);
    context.quadraticCurveTo(midX, midY, p.x, p.y);
    context.stroke();
    last.current = p;
    if (!drew.current) {
      drew.current = true;
      setHasInk(true);
    }
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const c = canvasRef.current;
    // A bare click that drew nothing must not persist a blank signature.
    if (c && drew.current) {
      onChange(c.toDataURL('image/png'));
    }
  };

  const clear = () => {
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, W, H);
    setHasInk(false);
    setArmed(false);
    onChange('');
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className={cn(
          'bg-background relative overflow-hidden rounded-xl border transition-colors',
          armed
            ? 'border-ring ring-ring/50 ring-[3px]'
            : hasInk
              ? 'border-input'
              : 'border-input/70 border-dashed'
        )}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="Pad de firma"
          className={cn('h-24 w-full', armed ? 'cursor-crosshair touch-none' : 'pointer-events-none')}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
        {!armed && !hasInk && (
          <button
            type="button"
            onClick={() => setArmed(true)}
            aria-label="Firmar"
            className="text-muted-foreground hover:text-foreground absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-xs"
          >
            <PenLine className="size-4" />
            Firmar
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {armed ? (
            'Cuando termines, tocá Listo.'
          ) : hasInk ? (
            'El color quedó fijo. Borrá y firmá de nuevo para cambiarlo.'
          ) : (
            <>
              El color se elige en{' '}
              {onEditStyle ? (
                <button
                  type="button"
                  onClick={onEditStyle}
                  className="font-medium underline underline-offset-1"
                >
                  estilo
                </button>
              ) : (
                'estilo'
              )}{' '}
              y se fija al firmar.
            </>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {armed && (
            <Button type="button" variant="outline" size="xs" onClick={() => setArmed(false)}>
              <Check /> Listo
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={clear}
            disabled={!hasInk}
            className="text-muted-foreground hover:text-foreground disabled:invisible"
          >
            <Eraser /> Borrar
          </Button>
        </div>
      </div>
    </div>
  );
}
