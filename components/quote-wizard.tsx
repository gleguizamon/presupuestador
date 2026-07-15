"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { es } from "react-day-picker/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteSheet } from "@/components/quote-sheet";
import { Stepper, StepDef } from "@/components/stepper";
import { Eye, FileDigit, ListChecks, ScrollText, Users } from "lucide-react";
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
  TEMPLATES,
} from "@/lib/quote";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "presupuestador-draft";
const START_NUMBER_KEY = "presupuestador-start-number";

const STEPS: StepDef[] = [
  { title: "Información general", icon: FileDigit },
  { title: "Datos", icon: Users },
  { title: "Ítems", icon: ListChecks },
  { title: "Condiciones", icon: ScrollText },
  { title: "Vista previa", icon: Eye },
];

/** Input that reads as plain text until you interact with it. */
function Seamless({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn(
        "h-8 rounded-sm border-transparent bg-transparent px-1.5 shadow-none",
        "hover:bg-muted/60 focus-visible:bg-background focus-visible:border-input focus-visible:ring-1",
        "placeholder:text-muted-foreground/50",
        className,
      )}
    />
  );
}

function SeamlessArea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={cn(
        "min-h-0 rounded-sm border-transparent bg-transparent px-1.5 py-1 shadow-none resize-none",
        "hover:bg-muted/60 focus-visible:bg-background focus-visible:border-input focus-visible:ring-1",
        "placeholder:text-muted-foreground/50",
        className,
      )}
    />
  );
}

/** shadcn date picker (Popover + Calendar) that stores ISO yyyy-mm-dd. */
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [y, m, d] = value.split("-").map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        className="h-8 w-36 rounded-sm border border-transparent px-1.5 text-left text-sm tabular-nums hover:bg-muted/60 focus-visible:border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {date
          ? date.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "Elegir fecha"}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={es}
          selected={date}
          defaultMonth={date}
          onSelect={(day) => {
            if (day) {
              const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
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
    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </p>
  );
}

export function QuoteWizard() {
  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [step, setStep] = React.useState(0);
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
    if (!params.has("d") && !params.has("c")) {
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
        setStep(STEPS.length - 1);
        if (editable) {
          toast("Presupuesto cargado desde el link", {
            description:
              "Podés editarlo: los cambios se guardan solo en este navegador.",
          });
        }
      };
      // No edit hash = legacy editable link. With hash, the key must match.
      if (!shared.editHash) {
        finish(true);
        return;
      }
      const key = params.get("k");
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

  const update = (patch: Partial<Quote>) =>
    setQuote((q) => (q ? { ...q, ...patch } : q));

  const updateItem = (id: string, patch: Partial<QuoteItem>) =>
    setQuote((q) =>
      q
        ? {
            ...q,
            items: q.items.map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          }
        : q,
    );

  const removeItem = (id: string) =>
    setQuote((q) =>
      q ? { ...q, items: q.items.filter((it) => it.id !== id) } : q,
    );

  const onLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Downscale so the draft stays light in localStorage.
      const scale = Math.min(240 / img.width, 120 / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      update({ logo: canvas.toDataURL("image/png") });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast("No se pudo leer la imagen", {
        description: "Probá con un PNG o JPG.",
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
      const url = `${window.location.origin}/crear#${fragment}${editable ? `&k=${key}` : ""}`;
      await navigator.clipboard.writeText(url);
      toast(
        editable ? "Link editable copiado" : "Link de solo lectura copiado",
        {
          description: editable
            ? "Quien lo reciba puede modificar el presupuesto."
            : "Quien lo reciba puede verlo y descargar el PDF, pero no editarlo.",
        },
      );
    } catch {
      toast("No se pudo copiar el link", {
        description: "Probá de nuevo en unos segundos.",
      });
    }
  };

  const exportPdf = async () => {
    if (!quote || exporting) return;
    setExporting(true);
    try {
      const [{ pdf }, { QuotePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/quote-pdf"),
      ]);
      const blob = await pdf(<QuotePdf quote={quote} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presupuesto-${quote.number || "sin-numero"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("PDF descargado", {
        description: `presupuesto-${quote.number || "sin-numero"}.pdf`,
      });
    } catch {
      toast("No se pudo generar el PDF", {
        description: "Probá de nuevo en unos segundos.",
      });
    } finally {
      setExporting(false);
    }
  };

  const reset = () => {
    window.history.replaceState(null, "", "/crear");
    setReadOnly(false);
    setQuote(emptyQuote());
    setStep(0);
  };

  if (!quote) {
    return (
      <div className="mx-auto mt-16 w-full max-w-6xl px-6">
        <div className="h-[480px] animate-pulse rounded-lg bg-muted/60" />
      </div>
    );
  }

  // Read-only view: someone opened a share link without the edit key.
  if (readOnly) {
    return (
      <>
        <div className="print:hidden flex min-h-dvh flex-col">
          <header className="sticky top-0 z-10 shrink-0 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
              <Link href="/" className="text-sm font-semibold tracking-tight">
                presupuestador<span className="text-muted-foreground">.</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={reset}>
                Crear el mío
              </Button>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
            <p className="mx-auto w-full max-w-3xl shrink-0 pt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Solo lectura
            </p>
            <div className="mx-auto mt-3 w-full max-w-3xl">
              <QuoteSheet quote={quote} />
            </div>
            <div className="mx-auto mt-3 flex w-full max-w-3xl shrink-0 items-center justify-end pb-3">
              <Button size="sm" onClick={exportPdf} disabled={exporting}>
                {exporting ? "Generando…" : "Exportar PDF"}
              </Button>
            </div>
          </main>
        </div>
        <div className="hidden print:block px-2">
          <QuoteSheet quote={quote} className="rounded-none border-0 shadow-none" />
        </div>
      </>
    );
  }

  const totals = computeTotals(quote);
  const money = (v: number) => formatMoney(v, quote.currency);
  const isPreview = step === STEPS.length - 1;

  return (
    <>
      <div
        className={cn(
          "print:hidden flex flex-col",
          // Form steps fit the viewport; the preview shows the whole document
          // and lets the page itself scroll if it runs long.
          isPreview ? "min-h-dvh" : "h-dvh overflow-hidden",
        )}
      >
        {/* ——— Top bar ——— */}
        <header className="sticky top-0 z-10 shrink-0 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              presupuestador<span className="text-muted-foreground">.</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={reset}>
              Nuevo
            </Button>
          </div>
        </header>

        <main
          className={cn(
            "mx-auto flex w-full max-w-6xl flex-1 flex-col px-6",
            !isPreview && "min-h-0",
          )}
        >
          {/* Steps */}
          <nav
            aria-label="Pasos"
            className="mx-auto w-full max-w-2xl shrink-0 pt-5"
          >
            <Stepper steps={STEPS} active={step} onSelect={setStep} />
          </nav>

          <div
            className={cn(
              isPreview
                ? "mx-auto mt-4 w-full max-w-3xl"
                : "mt-4 min-h-0 flex-1 overflow-y-auto py-6",
            )}
          >
            <div
              className={cn(
                !isPreview && "mx-auto w-full",
                !isPreview && (step === 2 ? "max-w-3xl" : "max-w-xl"),
              )}
            >
              {step === 0 && (
                <div className="max-w-md">
                  <StepLabel>Presupuesto</StepLabel>
                  <Seamless
                    aria-label="Número de presupuesto"
                    value={quote.number}
                    onChange={(e) => update({ number: e.target.value })}
                    className="mt-1 -ml-1.5 w-56 text-lg font-semibold"
                  />
                  <div className="mt-8 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Fecha</span>
                    <DateField
                      label="Fecha"
                      value={quote.date}
                      onChange={(iso) => update({ date: iso })}
                    />
                    <span className="text-muted-foreground">Válido hasta</span>
                    <DateField
                      label="Válido hasta"
                      value={quote.validUntil}
                      onChange={(iso) => update({ validUntil: iso })}
                    />
                    <span className="text-muted-foreground">Moneda</span>
                    <Select
                      value={quote.currency}
                      onValueChange={(v) => v && update({ currency: v })}
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label="Moneda"
                        className="w-56 border-transparent shadow-none hover:bg-muted/60"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-10 sm:grid-cols-2">
                  {(
                    [
                      [
                        "De",
                        "from",
                        "Tu nombre o empresa",
                        "CUIT, email, teléfono, dirección…",
                      ],
                      [
                        "Para",
                        "to",
                        "Nombre del cliente",
                        "Empresa, email, dirección…",
                      ],
                    ] as const
                  ).map(([label, key, namePh, detailPh]) => (
                    <div key={key}>
                      <StepLabel>{label}</StepLabel>
                      <Seamless
                        aria-label={`${label}: nombre`}
                        placeholder={namePh}
                        value={quote[key].name}
                        onChange={(e) =>
                          update({
                            [key]: { ...quote[key], name: e.target.value },
                          })
                        }
                        className="mt-1 -ml-1.5 w-full font-medium"
                      />
                      <SeamlessArea
                        aria-label={`${label}: datos`}
                        placeholder={detailPh}
                        rows={3}
                        value={quote[key].detail}
                        onChange={(e) =>
                          update({
                            [key]: { ...quote[key], detail: e.target.value },
                          })
                        }
                        className="-ml-1.5 mt-0.5 w-full text-sm text-muted-foreground"
                      />
                      {key === "from" && (
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
                                  variant: "outline",
                                  size: "sm",
                                }),
                                "mt-2 cursor-pointer"
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
                          <p className="mt-2 text-xs text-muted-foreground">
                            Aparece en la hoja y en el PDF. No viaja en los
                            links compartidos.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div>
                  <StepLabel>Ítems</StepLabel>
                  <div className="mt-4 hidden sm:grid grid-cols-[1fr_64px_110px_110px_28px] items-center gap-2 border-b pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <span>Descripción</span>
                    <span className="text-right">Cant.</span>
                    <span className="text-right">Precio unit.</span>
                    <span className="text-right">Importe</span>
                    <span />
                  </div>
                  {quote.items.map((it) => (
                    <div
                      key={it.id}
                      className="group flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-dashed py-2 sm:grid sm:grid-cols-[1fr_64px_110px_110px_28px] sm:py-1"
                    >
                      <Seamless
                        aria-label="Descripción del ítem"
                        placeholder="Servicio o producto"
                        value={it.description}
                        onChange={(e) =>
                          updateItem(it.id, { description: e.target.value })
                        }
                        className="-ml-1.5 w-full sm:w-auto"
                      />
                      <Seamless
                        type="number"
                        min={0}
                        step="any"
                        aria-label="Cantidad"
                        value={it.quantity === 0 ? "" : it.quantity}
                        placeholder="0"
                        onChange={(e) =>
                          updateItem(it.id, {
                            quantity: Number.isNaN(e.target.valueAsNumber)
                              ? 0
                              : e.target.valueAsNumber,
                          })
                        }
                        className="w-14 text-right tabular-nums sm:w-auto"
                      />
                      <Seamless
                        type="number"
                        min={0}
                        step="any"
                        aria-label="Precio unitario"
                        value={it.unitPrice === 0 ? "" : it.unitPrice}
                        placeholder="0,00"
                        onChange={(e) =>
                          updateItem(it.id, {
                            unitPrice: Number.isNaN(e.target.valueAsNumber)
                              ? 0
                              : e.target.valueAsNumber,
                          })
                        }
                        className="w-24 text-right tabular-nums sm:w-auto"
                      />
                      <span className="flex-1 px-1.5 text-right text-sm tabular-nums sm:flex-none">
                        {money((it.quantity || 0) * (it.unitPrice || 0))}
                      </span>
                      <button
                        type="button"
                        aria-label="Eliminar ítem"
                        onClick={() => removeItem(it.id)}
                        disabled={quote.items.length === 1}
                        className="justify-self-end rounded-sm p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-1 disabled:invisible group-hover:opacity-100 group-focus-within:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setQuote((q) =>
                        q ? { ...q, items: [...q.items, newItem()] } : q,
                      )
                    }
                    className="mt-2 -ml-2 text-muted-foreground"
                  >
                    + Agregar ítem
                  </Button>

                  <div className="mt-8 flex justify-end">
                    <div className="w-full max-w-72 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums">
                          {money(totals.subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          Descuento
                          <Seamless
                            type="number"
                            min={0}
                            max={100}
                            step="any"
                            aria-label="Descuento %"
                            value={
                              quote.discountPct === 0 ? "" : quote.discountPct
                            }
                            placeholder="0"
                            onChange={(e) =>
                              update({
                                discountPct: Number.isNaN(
                                  e.target.valueAsNumber,
                                )
                                  ? 0
                                  : e.target.valueAsNumber,
                              })
                            }
                            className="h-6 w-14 text-right tabular-nums"
                          />
                          %
                        </span>
                        <span className="tabular-nums">
                          {totals.discount > 0
                            ? `− ${money(totals.discount)}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          IVA / impuestos
                          <Seamless
                            type="number"
                            min={0}
                            step="any"
                            aria-label="IVA %"
                            value={quote.taxPct === 0 ? "" : quote.taxPct}
                            placeholder="0"
                            onChange={(e) =>
                              update({
                                taxPct: Number.isNaN(e.target.valueAsNumber)
                                  ? 0
                                  : e.target.valueAsNumber,
                              })
                            }
                            className="h-6 w-14 text-right tabular-nums"
                          />
                          %
                        </span>
                        <span className="tabular-nums">
                          {totals.tax > 0 ? money(totals.tax) : "—"}
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
              )}

              {step === 3 && (
                <div>
                  <StepLabel>Notas y condiciones</StepLabel>
                  <SeamlessArea
                    aria-label="Notas y condiciones"
                    placeholder="Forma de pago, plazos de entrega, alcance del trabajo…"
                    rows={6}
                    value={quote.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    className="-ml-1.5 mt-2 w-full text-sm text-muted-foreground"
                  />
                </div>
              )}

              {isPreview && (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-muted-foreground">
                      Plantilla
                    </span>
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => update({ template: tpl.id })}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                          quote.template === tpl.id
                            ? "border-foreground font-medium"
                            : "text-muted-foreground hover:border-muted-foreground/50"
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
                </>
              )}
            </div>
          </div>

          {/* Step navigation */}
          <div className="mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between pt-3 pb-1 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={cn(step === 0 && "invisible")}
            >
              ← Atrás
            </Button>
            {isPreview ? (
              <div className="flex items-center gap-2">
                <Popover open={shareOpen} onOpenChange={setShareOpen}>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    Compartir link
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-2">
                    <p className="px-2 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      ¿Qué puede hacer quien lo reciba?
                    </p>
                    <button
                      type="button"
                      onClick={() => copyShareLink(false)}
                      className="w-full rounded-md px-2 py-2 text-left hover:bg-muted"
                    >
                      <span className="block text-sm font-medium">
                        Solo lectura
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Ver el presupuesto y descargar el PDF.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyShareLink(true)}
                      className="w-full rounded-md px-2 py-2 text-left hover:bg-muted"
                    >
                      <span className="block text-sm font-medium">
                        Editable
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        El link incluye la clave de edición.
                      </span>
                    </button>
                  </PopoverContent>
                </Popover>
                <Button size="sm" onClick={exportPdf} disabled={exporting}>
                  {exporting ? "Generando…" : "Exportar PDF"}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() =>
                  setStep((s) => Math.min(STEPS.length - 1, s + 1))
                }
              >
                {step === STEPS.length - 2 ? "Ver vista previa" : "Continuar"} →
              </Button>
            )}
          </div>
        </main>
      </div>

      {/* Cmd+P fallback prints the same document. */}
      <div className="hidden print:block px-2">
        <QuoteSheet quote={quote} className="rounded-none border-0 shadow-none" />
      </div>
    </>
  );
}
