'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { es } from 'react-day-picker/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { QuoteSheet } from '@/components/quote-sheet';
import { Stepper } from '@/components/stepper';
import { defineStepper } from '@stepperize/react';
import { ArrowLeft, ArrowRight, Eye, File, ListChecks, ScrollText, Users } from 'lucide-react';
import {
  CURRENCIES,
  Quote,
  QuoteItem,
  computeTotals,
  decodeShareParams,
  emptyQuote,
  encodeSharePayload,
  formatMoney,
  hashEditKey,
  newItem,
  randomEditKey,
  TEMPLATES
} from '@/lib/quote';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'presupuestador-draft';
const START_NUMBER_KEY = 'presupuestador-start-number';

// Step order, ids and nav copy live here; stepperize handles the actual
// current/next/prev/goTo state so we don't hand-roll index clamping.
const quoteStepper = defineStepper([
  { id: 'general', title: 'Información general', icon: File },
  { id: 'datos', title: 'Datos', icon: Users },
  { id: 'items', title: 'Ítems', icon: ListChecks },
  { id: 'condiciones', title: 'Condiciones', icon: ScrollText },
  { id: 'preview', title: 'Vista previa', icon: Eye }
]);

// Same width for every step so the content never spills past the nav above it.
const STEP_WIDTH = 'max-w-3xl';

/** Input that stays minimal but keeps a dashed underline so it still reads as editable. */
function Seamless({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn(
        'h-8 rounded-sm border-x-0 border-t-0 border-b border-dashed border-muted-foreground/30 bg-transparent px-1.5 shadow-none',
        'hover:border-muted-foreground/60 hover:bg-muted/60 focus-visible:border-b-input focus-visible:bg-background focus-visible:ring-1',
        'placeholder:text-muted-foreground/50',
        className
      )}
    />
  );
}

function SeamlessArea({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={cn(
        'min-h-0 resize-none rounded-sm border-x-0 border-t-0 border-b border-dashed border-muted-foreground/30 bg-transparent px-1.5 py-1 shadow-none',
        'hover:border-muted-foreground/60 hover:bg-muted/60 focus-visible:border-b-input focus-visible:bg-background focus-visible:ring-1',
        'placeholder:text-muted-foreground/50',
        className
      )}
    />
  );
}

/** shadcn date picker (Popover + Calendar) that stores ISO yyyy-mm-dd. */
function DateField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [y, m, d] = value.split('-').map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        className="hover:border-muted-foreground/60 hover:bg-muted/60 focus-visible:border-b-input focus-visible:ring-ring h-8 w-36 rounded-sm border-x-0 border-t-0 border-b border-dashed border-muted-foreground/30 px-1.5 text-left text-sm tabular-nums focus-visible:ring-1 focus-visible:outline-none"
      >
        {date
          ? date.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          : 'Elegir fecha'}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={es}
          selected={date}
          defaultMonth={date}
          onSelect={day => {
            if (day) {
              const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              onChange(iso);
            }
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
      {children}
    </p>
  );
}

export function QuoteWizard() {
  const [quote, setQuote] = React.useState<Quote | null>(null);
  const stepper = quoteStepper.useStepper();
  const [exporting, setExporting] = React.useState(false);
  const [readOnly, setReadOnly] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);

  // Load: shared link hash wins (and opens the preview), then draft, then fresh.
  React.useEffect(() => {
    const loadLocal = () => {
      let base: Quote | null = null;
      try {
        const draft = window.localStorage.getItem(STORAGE_KEY);
        if (draft) base = { ...emptyQuote(), ...JSON.parse(draft) };
      } catch {
        // corrupt draft: start clean
      }
      if (!base) base = emptyQuote();
      try {
        const startNumber = window.sessionStorage.getItem(START_NUMBER_KEY);
        if (startNumber) {
          base.number = startNumber;
          window.sessionStorage.removeItem(START_NUMBER_KEY);
        }
      } catch {
        // sessionStorage unavailable
      }
      setQuote(base);
    };

    const params = new URLSearchParams(window.location.hash.slice(1));
    if (!params.has('d') && !params.has('c')) {
      loadLocal();
      return;
    }
    (async () => {
      const shared = await decodeShareParams(params);
      if (!shared) {
        loadLocal();
        return;
      }
      const finish = (editable: boolean) => {
        setReadOnly(!editable);
        setQuote(shared.quote);
        void stepper.goTo('preview');
        if (editable) {
          toast('Presupuesto cargado desde el link', {
            description: 'Podés editarlo: los cambios se guardan solo en este navegador.'
          });
        }
      };
      if (!shared.editHash) {
        finish(true);
        return;
      }
      const key = params.get('k');
      if (!key) {
        finish(false);
        return;
      }
      try {
        finish((await hashEditKey(key)) === shared.editHash);
      } catch {
        finish(false);
      }
    })();
  }, []);

  // Autosave draft. A read-only view must never clobber the visitor's own draft.
  React.useEffect(() => {
    if (!quote || readOnly) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quote));
    } catch {
      // storage full or unavailable: editing still works
    }
  }, [quote, readOnly]);

  const update = (patch: Partial<Quote>) => setQuote(q => (q ? { ...q, ...patch } : q));

  const updateItem = (id: string, patch: Partial<QuoteItem>) =>
    setQuote(q =>
      q
        ? {
            ...q,
            items: q.items.map(it => (it.id === id ? { ...it, ...patch } : it))
          }
        : q
    );

  const removeItem = (id: string) =>
    setQuote(q => (q ? { ...q, items: q.items.filter(it => it.id !== id) } : q));

  const onLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Downscale so the draft stays light in localStorage.
      const scale = Math.min(240 / img.width, 120 / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      update({ logo: canvas.toDataURL('image/png') });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast('No se pudo leer la imagen', {
        description: 'Probá con un PNG o JPG.'
      });
    };
    img.src = url;
  };

  const copyShareLink = async (editable: boolean) => {
    if (!quote) return;
    setShareOpen(false);
    try {
      // Both links embed hash(key); only the editable one carries the key.
      const key = randomEditKey();
      const editHash = await hashEditKey(key);
      const fragment = await encodeSharePayload(quote, editHash);
      const url = `${window.location.origin}/crear#${fragment}${editable ? `&k=${key}` : ''}`;
      await navigator.clipboard.writeText(url);
      toast(editable ? 'Link editable copiado' : 'Link de solo lectura copiado', {
        description: editable
          ? 'Quien lo reciba puede modificar el presupuesto.'
          : 'Quien lo reciba puede verlo y descargar el PDF, pero no editarlo.'
      });
    } catch {
      toast('No se pudo copiar el link', {
        description: 'Probá de nuevo en unos segundos.'
      });
    }
  };

  const exportPdf = async () => {
    if (!quote || exporting) return;
    setExporting(true);
    try {
      const [{ pdf }, { QuotePdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/quote-pdf')
      ]);
      const blob = await pdf(<QuotePdf quote={quote} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presupuesto-${quote.number || 'sin-numero'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast('PDF descargado', {
        description: `presupuesto-${quote.number || 'sin-numero'}.pdf`
      });
    } catch {
      toast('No se pudo generar el PDF', {
        description: 'Probá de nuevo en unos segundos.'
      });
    } finally {
      setExporting(false);
    }
  };

  const reset = () => {
    window.history.replaceState(null, '', '/crear');
    setReadOnly(false);
    setQuote(emptyQuote());
    void stepper.goTo('general');
  };

  if (!quote) {
    return (
      <div className="mx-auto mt-16 w-full max-w-6xl px-6">
        <div className="bg-muted/60 h-[480px] animate-pulse rounded-lg" />
      </div>
    );
  }

  // Read-only view: someone opened a share link without the edit key.
  if (readOnly) {
    return (
      <>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 print:hidden">
          <div className="mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between pt-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Solo lectura
            </p>
            <Button variant="ghost" size="sm" onClick={reset}>
              Crear el mío
            </Button>
          </div>
          <div className="mx-auto mt-3 w-full max-w-3xl">
            <QuoteSheet quote={quote} />
          </div>
          <div className="mx-auto mt-3 flex w-full max-w-3xl shrink-0 items-center justify-end pb-3">
            <Button size="sm" onClick={exportPdf} disabled={exporting}>
              {exporting ? 'Generando…' : 'Exportar PDF'}
            </Button>
          </div>
        </div>
        <div className="hidden px-2 print:block">
          <QuoteSheet quote={quote} className="rounded-none border-0 shadow-none" />
        </div>
      </>
    );
  }

  const totals = computeTotals(quote);
  const money = (v: number) => formatMoney(v, quote.currency);
  const isPreview = stepper.isLast;

  // Back/continue (or, on the last step, share/export) — attached right
  // under each step's own content instead of pinned to the page bottom.
  // "Atrás" stays on the left so it reads clearly as the backwards action;
  // the forward-moving actions are grouped together on the right.
  const renderFooter = () => {
    return (
      <div className="mt-6 flex items-center justify-between border-t pt-4">
        {!stepper.isFirst ? (
          <Button variant="ghost" onClick={() => void stepper.prev()}>
            <ArrowLeft /> Atrás
          </Button>
        ) : (
          <span />
        )}
        {stepper.isLast ? (
          <div className="flex items-center gap-2">
            <Popover open={shareOpen} onOpenChange={setShareOpen}>
              <PopoverTrigger className={cn(buttonVariants())}>Compartir link</PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-2">
                <p className="text-muted-foreground px-2 pt-1.5 pb-1 text-xs font-medium tracking-wider uppercase">
                  ¿Qué puede hacer quien lo reciba?
                </p>
                <button
                  type="button"
                  onClick={() => copyShareLink(false)}
                  className="hover:bg-muted w-full rounded-md px-2 py-2 text-left"
                >
                  <span className="block text-sm font-medium">Solo lectura</span>
                  <span className="text-muted-foreground block text-xs">
                    Ver el presupuesto y descargar el PDF.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => copyShareLink(true)}
                  className="hover:bg-muted w-full rounded-md px-2 py-2 text-left"
                >
                  <span className="block text-sm font-medium">Editable</span>
                  <span className="text-muted-foreground block text-xs">
                    El link incluye la clave de edición.
                  </span>
                </button>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              onClick={exportPdf}
              disabled={exporting}
              className="text-muted-foreground"
            >
              {exporting ? 'Generando…' : 'Exportar PDF'}
            </Button>
          </div>
        ) : (
          <Button onClick={() => void stepper.next()}>
            {stepper.index === quoteStepper.steps.length - 2 ? 'Ver vista previa' : 'Continuar'}{' '}
            <ArrowRight />
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto print:hidden">
        <div className="mx-auto w-full max-w-6xl px-6 pt-8 pb-10 md:pt-12">
          <nav aria-label="Pasos" className="mx-auto w-full max-w-3xl">
            <Stepper
              steps={quoteStepper.steps}
              active={stepper.index}
              onSelect={idx => void stepper.goTo(quoteStepper.steps[idx].id)}
            />
          </nav>

          <div className="mt-8 w-full">
            {stepper.is('general') && (
              <div className={cn('mx-auto', STEP_WIDTH)}>
                <div className="max-w-md">
                  <StepLabel>Presupuesto</StepLabel>
                  <Seamless
                    aria-label="Número de presupuesto"
                    value={quote.number}
                    onChange={e => update({ number: e.target.value })}
                    className="mt-1 -ml-1.5 w-56 text-lg font-semibold"
                  />
                  <div className="mt-8 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Fecha</span>
                    <DateField
                      label="Fecha"
                      value={quote.date}
                      onChange={iso => update({ date: iso })}
                    />
                    <span className="text-muted-foreground">Válido hasta</span>
                    <DateField
                      label="Válido hasta"
                      value={quote.validUntil}
                      onChange={iso => update({ validUntil: iso })}
                    />
                    <span className="text-muted-foreground">Moneda</span>
                    <Select
                      value={quote.currency}
                      onValueChange={v => v && update({ currency: v })}
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label="Moneda"
                        className="hover:border-muted-foreground/60 hover:bg-muted/60 w-56 rounded-sm border-x-0 border-t-0 border-b border-dashed border-muted-foreground/30 shadow-none"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {renderFooter()}
              </div>
            )}

            {stepper.is('datos') && (
              <div className={cn('mx-auto', STEP_WIDTH)}>
                <div className="grid gap-10 sm:grid-cols-2">
                  {(
                    [
                      ['De', 'from', 'Tu nombre o empresa', 'CUIT, email, teléfono, dirección…'],
                      ['Para', 'to', 'Nombre del cliente', 'Empresa, email, dirección…']
                    ] as const
                  ).map(([label, key, namePh, detailPh]) => (
                    <div key={key}>
                      <StepLabel>{label}</StepLabel>
                      <Seamless
                        aria-label={`${label}: nombre`}
                        placeholder={namePh}
                        value={quote[key].name}
                        onChange={e =>
                          update({
                            [key]: { ...quote[key], name: e.target.value }
                          })
                        }
                        className="mt-1 -ml-1.5 w-full font-medium"
                      />
                      <SeamlessArea
                        aria-label={`${label}: datos`}
                        placeholder={detailPh}
                        rows={3}
                        value={quote[key].detail}
                        onChange={e =>
                          update({
                            [key]: { ...quote[key], detail: e.target.value }
                          })
                        }
                        className="text-muted-foreground mt-0.5 -ml-1.5 w-full text-sm"
                      />
                      {key === 'from' && (
                        <div className="mt-6">
                          <StepLabel>Logo (opcional)</StepLabel>
                          {quote.logo ? (
                            <div className="mt-2 flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={quote.logo}
                                alt="Logo cargado"
                                className="h-12 w-auto max-w-40 rounded border bg-white object-contain p-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => update({ logo: undefined })}
                              >
                                Quitar
                              </Button>
                            </div>
                          ) : (
                            <label
                              className={cn(
                                buttonVariants({
                                  variant: 'outline',
                                  size: 'sm'
                                }),
                                'mt-2 cursor-pointer'
                              )}
                            >
                              Subir logo
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={onLogoFile}
                              />
                            </label>
                          )}
                          <p className="text-muted-foreground mt-2 text-xs">
                            Aparece en la hoja y en el PDF. No viaja en los links compartidos.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {renderFooter()}
              </div>
            )}

            {stepper.is('items') && (
              <div className={cn('mx-auto', STEP_WIDTH)}>
                <div>
                  <StepLabel>Ítems</StepLabel>
                  <div className="text-muted-foreground mt-4 hidden grid-cols-[1fr_64px_110px_110px_28px] items-center gap-2 border-b pb-2 text-xs font-medium tracking-wider uppercase sm:grid">
                    <span>Descripción</span>
                    <span className="text-right">Cant.</span>
                    <span className="text-right">Precio unit.</span>
                    <span className="text-right">Importe</span>
                    <span />
                  </div>
                  {quote.items.map(it => (
                    <div
                      key={it.id}
                      className="group flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-dashed py-2 sm:grid sm:grid-cols-[1fr_64px_110px_110px_28px] sm:py-1"
                    >
                      <Seamless
                        aria-label="Descripción del ítem"
                        placeholder="Servicio o producto"
                        value={it.description}
                        onChange={e => updateItem(it.id, { description: e.target.value })}
                        className="-ml-1.5 w-full border-none sm:w-auto"
                      />
                      <Seamless
                        type="number"
                        min={0}
                        step="any"
                        aria-label="Cantidad"
                        value={it.quantity === 0 ? '' : it.quantity}
                        placeholder="0"
                        onChange={e =>
                          updateItem(it.id, {
                            quantity: Number.isNaN(e.target.valueAsNumber)
                              ? 0
                              : e.target.valueAsNumber
                          })
                        }
                        className="w-14 border-none text-right tabular-nums sm:w-auto"
                      />
                      <Seamless
                        type="number"
                        min={0}
                        step="any"
                        aria-label="Precio unitario"
                        value={it.unitPrice === 0 ? '' : it.unitPrice}
                        placeholder="0,00"
                        onChange={e =>
                          updateItem(it.id, {
                            unitPrice: Number.isNaN(e.target.valueAsNumber)
                              ? 0
                              : e.target.valueAsNumber
                          })
                        }
                        className="w-24 border-none text-right tabular-nums sm:w-auto"
                      />
                      <span className="flex-1 px-1.5 text-right text-sm tabular-nums sm:flex-none">
                        {money((it.quantity || 0) * (it.unitPrice || 0))}
                      </span>
                      <button
                        type="button"
                        aria-label="Eliminar ítem"
                        onClick={() => removeItem(it.id)}
                        disabled={quote.items.length === 1}
                        className="text-muted-foreground/40 hover:text-foreground justify-self-end rounded-sm p-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-1 disabled:invisible"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setQuote(q => (q ? { ...q, items: [...q.items, newItem()] } : q))
                    }
                    className="text-muted-foreground mt-2 -ml-2"
                  >
                    + Agregar ítem
                  </Button>

                  <div className="mt-8 flex justify-end">
                    <div className="w-full max-w-72 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums">{money(totals.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          Descuento
                          <Seamless
                            type="number"
                            min={0}
                            max={100}
                            step="any"
                            aria-label="Descuento %"
                            value={quote.discountPct === 0 ? '' : quote.discountPct}
                            placeholder="0"
                            onChange={e =>
                              update({
                                discountPct: Number.isNaN(e.target.valueAsNumber)
                                  ? 0
                                  : e.target.valueAsNumber
                              })
                            }
                            className="h-6 w-14 border-none text-right tabular-nums"
                          />
                          %
                        </span>
                        <span className="tabular-nums">
                          {totals.discount > 0 ? `− ${money(totals.discount)}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          IVA / impuestos
                          <Seamless
                            type="number"
                            min={0}
                            step="any"
                            aria-label="IVA %"
                            value={quote.taxPct === 0 ? '' : quote.taxPct}
                            placeholder="0"
                            onChange={e =>
                              update({
                                taxPct: Number.isNaN(e.target.valueAsNumber)
                                  ? 0
                                  : e.target.valueAsNumber
                              })
                            }
                            className="h-6 w-14 border-none text-right tabular-nums"
                          />
                          %
                        </span>
                        <span className="tabular-nums">
                          {totals.tax > 0 ? money(totals.tax) : '—'}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-baseline justify-between">
                        <span className="font-medium">Total</span>
                        <span className="text-lg font-semibold tabular-nums">
                          {money(totals.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {renderFooter()}
              </div>
            )}

            {stepper.is('condiciones') && (
              <div className={cn('mx-auto', STEP_WIDTH)}>
                <div>
                  <StepLabel>Notas y condiciones</StepLabel>
                  <SeamlessArea
                    aria-label="Notas y condiciones"
                    placeholder="Forma de pago, plazos de entrega, alcance del trabajo…"
                    rows={6}
                    value={quote.notes}
                    onChange={e => update({ notes: e.target.value })}
                    className="text-muted-foreground mt-2 -ml-1.5 w-full border-none text-sm"
                  />
                </div>
                {renderFooter()}
              </div>
            )}

            {isPreview && (
              <div className={cn('mx-auto', STEP_WIDTH)}>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground mr-1 text-xs">Plantilla</span>
                  {TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => update({ template: tpl.id })}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                        quote.template === tpl.id
                          ? 'border-foreground font-medium'
                          : 'text-muted-foreground hover:border-muted-foreground/50'
                      )}
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: tpl.swatch }}
                      />
                      {tpl.name}
                    </button>
                  ))}
                </div>
                <QuoteSheet quote={quote} />
                {renderFooter()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cmd+P fallback prints the same document. */}
      <div className="hidden px-2 print:block">
        <QuoteSheet quote={quote} className="rounded-none border-0 shadow-none" />
      </div>
    </>
  );
}
