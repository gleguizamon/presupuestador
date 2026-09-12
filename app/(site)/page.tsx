import { QuoteSheet } from '@/components/docs/quote/sheet';
import { GetStartedButton } from '@/components/get-started-button';
import { QuoteDoc } from '@/lib/doc/types';

// A real presupuesto, sample data — rendered once, half-hidden behind the
// footer divider as a decorative "here's what you'll make" peek.
const DEMO_QUOTE: QuoteDoc = {
  id: 'demo',
  style: { layout: 'clasico', font: 'sans', signatureColor: '#171717', currencySign: '$' },
  config: {},
  createdAt: 0,
  updatedAt: 0,
  body: {
    name: 'P-0042',
    date: '2026-07-14',
    validUntil: '2026-08-13',
    from: {
      name: 'Estudio Río',
      detail: 'CUIT 20-12345678-9\nhola@estudiorio.com'
    },
    to: {
      name: 'Panadería La Espiga',
      detail: 'Av. Corrientes 1234, CABA'
    },
    notes: '50% de anticipo, saldo contra entrega.',
    items: [
      { id: 'a', description: 'Diseño de identidad visual', quantity: 1, unitPrice: 450000 },
      { id: 'b', description: 'Desarrollo web (landing)', quantity: 1, unitPrice: 360000 },
      { id: 'c', description: 'Sesión de fotos de producto', quantity: 2, unitPrice: 85000 }
    ],
    discountPct: 10,
    taxPct: 21,
    signature: ''
  }
};

export default function Home() {
  return (
    <div className="relative flex w-full flex-1 flex-col overflow-hidden">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-5 pt-10 pb-[32vh] text-center sm:gap-7 sm:pt-16 sm:pb-[36vh]">
        <span className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
          100% en tu navegador
        </span>

        <h1 className="max-w-[15ch] text-[1.9rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:max-w-[18ch] sm:text-[3.25rem] sm:leading-[1.04] md:text-[3.75rem]">
          Presupuestos, <em className="font-serif font-normal italic">sin vueltas.</em>
        </h1>

        <p className="text-muted-foreground max-w-xs text-[15px] text-pretty sm:max-w-md sm:text-lg">
          Armá el documento en minutos y compartilo por PDF o link.
        </p>

        <div className="flex flex-col items-center gap-2.5">
          <GetStartedButton />
          <p className="text-muted-foreground font-mono text-xs">
            Gratis, sin cuenta, sin tarjeta.
          </p>
        </div>
      </main>

      {/* The demo presupuesto rising from behind the footer's divider: a
          full-width strip pinned to the page's bottom edge (which lands exactly
          on the footer's border-t), clipping the tall sheet to just its top,
          with a fade so it dissolves into the page instead of hard-cutting. The
          Footer is a later sibling in app/(site)/layout.tsx, so its divider and
          copyright paint on top — the sheet reads as tucked behind it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[28vh] justify-center overflow-hidden select-none sm:h-[34vh]"
      >
        <div className="w-full max-w-md px-5 sm:max-w-lg">
          <QuoteSheet
            doc={DEMO_QUOTE}
            className="shadow-[0_-12px_50px_-16px_rgba(17,17,16,0.22)]"
          />
        </div>
        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent" />
      </div>
    </div>
  );
}
