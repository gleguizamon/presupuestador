'use client';

/* eslint-disable @next/next/no-img-element */
import * as React from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Matches `components/ui/input.tsx`'s chrome, for non-`<input>` triggers
 *  that need to look like one inside a form — e.g. DateField's Popover
 *  trigger, which ships with no border/background of its own. */
export const FORM_INPUT_TRIGGER_CLASS =
  'border-input hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm transition-colors focus-visible:ring-3 md:text-sm';

/** Label + control, the base unit of every document form. */
export function FormField({
  label,
  htmlFor,
  hint,
  className,
  children
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

/** A titled group of fields — "De", "Ítems", "Honorarios", etc. Rendered as a
 *  card so a long form reads as distinct chunks rather than one dense column. */
export function FormSection({
  title,
  action,
  className,
  children,
  ...rest
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-4 ring-1',
        className
      )}
      {...rest}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/** One repeatable entry inside a FormSection (a line item, a service, a
 *  signatory) — the label row plus a remove button. */
export function FormRepeatableCard({
  label,
  onRemove,
  removeDisabled,
  removeLabel = 'Eliminar',
  children
}: {
  label?: string;
  onRemove?: () => void;
  removeDisabled?: boolean;
  removeLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-background/60 flex flex-col gap-3 rounded-2xl border p-4">
      {(label || onRemove) && (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {label}
            </p>
          ) : (
            <span />
          )}
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={removeLabel}
              onClick={onRemove}
              disabled={removeDisabled}
              className="text-muted-foreground hover:text-foreground rounded-full disabled:invisible"
            >
              <X />
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/** Byte size of a `data:` URL's base64 payload — the logo is stored (and
 *  embedded in the PDF) as a downscaled PNG data URL, so this is the weight
 *  that actually matters. */
function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return 0;
  const b64 = dataUrl.slice(comma + 1);
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - pad);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
}

/* --- Logo upload: accepted file config -----------------------------------
 *
 *  ACCEPT is the raw file gate. It is enforced three ways so a stray file
 *  never reaches `onLogoFile` (which decodes + downscales the image):
 *   - the native picker's `accept` attribute (a hint the OS dialog honours),
 *   - a MIME-type check on the picked/dropped `File`,
 *   - an extension fallback for files that arrive with an empty `type`
 *     (common when dragged from some apps).
 *
 *  Kept deliberately narrow — PNG/JPG/WebP raster only:
 *   - SVG is excluded: drawing it to a canvas taints the canvas when it has
 *     external refs (`toDataURL` then throws) and needs its own passthrough
 *     path, which this component doesn't have.
 *   - GIF/AVIF/BMP decode fine but aren't worth widening the surface for.
 *
 *  LOGO_MAX_BYTES caps the *input* file (it is read into memory to decode).
 *  What ends up stored is tiny regardless — `doc-editor`'s `onLogoFile`
 *  downscales to fit 240×120 and re-encodes as PNG, so the persisted data
 *  URL is typically 2–20 KB. The logo is never put in a share link. */
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp';
const LOGO_MIME = ['image/png', 'image/jpeg', 'image/webp'];
const LOGO_EXT = ['png', 'jpg', 'jpeg', 'webp'];
export const LOGO_MAX_BYTES = 10 * 1024 * 1024;
const LOGO_MAX_LABEL = '10 MB';

/** null = accepted; otherwise a human-readable reason to show in a toast. */
function logoRejection(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeOk = file.type ? LOGO_MIME.includes(file.type) : LOGO_EXT.includes(ext);
  if (!typeOk) return 'Formato no admitido. Usá PNG, JPG o WebP.';
  if (file.size > LOGO_MAX_BYTES) return `La imagen supera los ${LOGO_MAX_LABEL}.`;
  return null;
}

/** Logo/image upload — drag-and-drop or click. Once set, a thumbnail with a
 *  "name · weight · Quitar" line under it (also a drop target, to replace);
 *  a dashed drop zone otherwise. Files that aren't PNG/JPG/WebP or exceed
 *  `LOGO_MAX_BYTES` are rejected with a toast and never reach `onLogoFile`.
 *  Shared by every document kind's form. */
export function LogoField({
  logo,
  onLogoFile,
  onRemove,
  label = 'Agregar logo',
  alt = 'Logo'
}: {
  logo?: string;
  onLogoFile: (file: File) => void;
  onRemove: () => void;
  label?: string;
  alt?: string;
}) {
  const [dragging, setDragging] = React.useState(false);

  const accept = (file: File | undefined) => {
    if (!file) return;
    const reason = logoRejection(file);
    if (reason) {
      toast.error('No se pudo agregar la imagen', { description: reason });
      return;
    }
    onLogoFile(file);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    accept(file);
  };

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        setDragging(true);
      }
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      accept(e.dataTransfer.files?.[0]);
    }
  };

  if (logo) {
    return (
      <div className="flex flex-col gap-1.5">
        <div
          {...dropHandlers}
          className={cn(
            'border-border bg-background flex h-16 w-28 items-center justify-center overflow-hidden rounded-xl border p-2 transition-colors',
            dragging && 'border-foreground/50 bg-muted/50'
          )}
        >
          <img src={logo} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span className="tabular-nums">{formatBytes(dataUrlBytes(logo))}</span>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={onRemove}
            className="hover:text-foreground underline underline-offset-2"
          >
            Quitar
          </button>
        </p>
      </div>
    );
  }

  return (
    <label
      {...dropHandlers}
      className={cn(
        'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground flex w-full max-w-[15rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-4 text-center text-[11px] transition-colors',
        dragging && 'border-foreground/50 bg-muted/50 text-foreground'
      )}
    >
      <ImagePlus className="size-4" aria-hidden />
      <span>{dragging ? 'Soltá la imagen' : 'Arrastrá una imagen o hacé clic'}</span>
      <span className="text-muted-foreground/80">PNG, JPG o WebP · hasta {LOGO_MAX_LABEL}</span>
      <input
        type="file"
        accept={LOGO_ACCEPT}
        aria-label={label}
        className="sr-only"
        onChange={onInput}
      />
    </label>
  );
}
