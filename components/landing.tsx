"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuoteSheet } from "@/components/quote-sheet";
import { Quote } from "@/lib/quote";

const START_NUMBER_KEY = "presupuestador-start-number";
const STORAGE_KEY = "presupuestador-draft";

const DEMO_QUOTE_BASE: Omit<Quote, "template"> = {
  number: "P-0042",
  date: "2026-07-14",
  validUntil: "2026-08-13",
  currency: "ARS",
  from: {
    name: "Estudio Río",
    detail: "CUIT 20-12345678-9\nhola@estudiorio.com",
  },
  to: {
    name: "Panadería La Espiga",
    detail: "Av. Corrientes 1234, CABA",
  },
  items: [
    { id: "a", description: "Diseño de identidad visual", quantity: 1, unitPrice: 450000 },
    { id: "b", description: "Desarrollo web (landing)", quantity: 1, unitPrice: 360000 },
    { id: "c", description: "Sesión de fotos de producto", quantity: 2, unitPrice: 85000 },
  ],
  discountPct: 10,
  taxPct: 21,
  notes: "50% de anticipo, saldo contra entrega.",
};

const DEMO_QUOTES: Quote[] = [
  { ...DEMO_QUOTE_BASE, template: "clasica" },
  { ...DEMO_QUOTE_BASE, template: "calida" },
  { ...DEMO_QUOTE_BASE, template: "minimal" },
];

function defaultNumber() {
  const t = new Date();
  return `P-${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, "0")}${String(t.getDate()).padStart(2, "0")}-01`;
}

export function Landing() {
  const router = useRouter();
  const [number, setNumber] = React.useState(defaultNumber);
  const [draftNumber, setDraftNumber] = React.useState<string | null>(null);

  // Old share links pointed at "/#d=…": forward them to the wizard preview.
  React.useEffect(() => {
    if (window.location.hash.startsWith("#d=")) {
      router.replace(`/crear${window.location.hash}`);
    }
    try {
      const draft = window.localStorage.getItem(STORAGE_KEY);
      if (draft) setDraftNumber(JSON.parse(draft).number ?? "");
    } catch {
      // corrupt draft: no resume button
    }
  }, [router]);

  // "Crear" starts clean with the chosen number; "Continuar" keeps the draft.
  const start = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.setItem(
        START_NUMBER_KEY,
        number.trim() || defaultNumber(),
      );
    } catch {
      // sessionStorage unavailable: the wizard falls back to its default number
    }
    router.push("/crear");
  };

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-y-hidden">
      <header className="mx-auto flex h-14 w-full max-w-6xl shrink-0 items-center border-b px-6">
        <span className="text-sm font-semibold tracking-tight">
          presupuestador<span className="text-muted-foreground">.</span>
        </span>
      </header>

      <div className="relative mx-auto min-h-0 w-full max-w-6xl flex-1">
        <main className="grid h-full w-full grid-cols-1 items-center gap-12 px-6 py-4 lg:grid-cols-[1fr_minmax(0,460px)]">
        <div className="flex min-h-0 flex-col justify-center gap-6 sm:gap-9">
        <div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Presupuestos
            <br />
            <em className="font-serif">sin vueltas.</em>
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            Sin cuenta. Sin suscripción. Sin fricciones.
            <br />
            Creá, exportá en PDF y compartí por link.
          </p>
        </div>

        <form onSubmit={start} className="max-w-xl">
          <label
            htmlFor="numero"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Número de presupuesto
          </label>
          <Input
            id="numero"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="mt-2 h-10 rounded-sm font-mono"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="submit" className="rounded-sm">
              Crear presupuesto →
            </Button>
            {draftNumber !== null && (
              <Button
                type="button"
                variant="outline"
                className="rounded-sm"
                onClick={() => router.push("/crear")}
              >
                Continuar donde lo dejaste
                {draftNumber ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {draftNumber}
                  </span>
                ) : null}
              </Button>
            )}
          </div>
        </form>

        <dl className="grid max-w-xl grid-cols-4 gap-3 border-t pt-4 sm:gap-8 sm:pt-6">
          {(
            [
              ["PDF", "exportable"],
              ["∞", "links únicos"],
              ["Sin", "cuentas"],
              ["100%", "en tu navegador"],
            ] as const
          ).map(([value, label]) => (
            <div key={label}>
              <dt className="font-mono text-base font-semibold sm:text-xl">
                {value}
              </dt>
              <dd className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                {label}
              </dd>
            </div>
          ))}
        </dl>
        </div>

        {/* Reserves grid space so the text column stays put; the actual fan
            renders as a floating overlay below so it isn't boxed in by max-w-6xl. */}
        <div aria-hidden className="invisible hidden max-h-full min-h-0 items-center lg:flex">
          <QuoteSheet quote={DEMO_QUOTES[0]} className="w-full origin-center scale-[0.92]" />
        </div>
        </main>

        {/* Demo: the actual document component fanned out across templates, sample data.
            Anchored to the content column's right edge, but no ancestor clips it, so the
            fanned-out cards can bleed past that edge instead of being cut off. Hidden on mobile. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-6 top-1/2 hidden w-[423px] -translate-y-1/2 origin-center scale-[0.92] lg:block"
        >
          {DEMO_QUOTES.map((quote, i) => {
            const isLast = i === DEMO_QUOTES.length - 1;
            const rotate = (i - (DEMO_QUOTES.length - 1) / 2) * 5;
            const offset = i * 18;
            return (
              <div
                key={quote.template}
                className="absolute inset-0 origin-bottom select-none"
                style={{
                  transform: `translateX(${offset}px) rotate(${rotate}deg)`,
                  zIndex: i,
                }}
              >
                <QuoteSheet
                  quote={quote}
                  className={
                    isLast
                      ? "shadow-xl shadow-neutral-300/60"
                      : "shadow-lg shadow-neutral-200/50"
                  }
                />
              </div>
            );
          })}
          <div className="invisible">
            <QuoteSheet quote={DEMO_QUOTES[0]} />
          </div>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-6xl shrink-0 border-t px-6 py-4">
        <p className="truncate font-mono text-xs text-muted-foreground">
          presupuestador — tus datos viven en tu navegador y en los links que
          compartís.
        </p>
      </footer>
    </div>
  );
}
