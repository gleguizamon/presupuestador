import { QuoteSheet } from '@/components/quote-sheet';
import { CreateQuoteForm } from '@/components/create-quote-form';
import { Quote } from '@/lib/quote';

const DEMO_QUOTE_BASE: Omit<Quote, 'template'> = {
  number: 'P-0042',
  date: '2026-07-14',
  validUntil: '2026-08-13',
  currency: 'ARS',
  from: {
    name: 'Estudio Río',
    detail: 'CUIT 20-12345678-9\nhola@estudiorio.com'
  },
  to: {
    name: 'Panadería La Espiga',
    detail: 'Av. Corrientes 1234, CABA'
  },
  items: [
    {
      id: 'a',
      description: 'Diseño de identidad visual',
      quantity: 1,
      unitPrice: 450000
    },
    {
      id: 'b',
      description: 'Desarrollo web (landing)',
      quantity: 1,
      unitPrice: 360000
    },
    {
      id: 'c',
      description: 'Sesión de fotos de producto',
      quantity: 2,
      unitPrice: 85000
    }
  ],
  discountPct: 10,
  taxPct: 21,
  notes: '50% de anticipo, saldo contra entrega.'
};

const DEMO_QUOTES: Quote[] = [
  { ...DEMO_QUOTE_BASE, template: 'clasica' },
  { ...DEMO_QUOTE_BASE, template: 'calida' },
  { ...DEMO_QUOTE_BASE, template: 'minimal' }
];

const features = ['PDF exportable', 'Links ilimitados', '100% en tu navegador'];

function DemoFanCards() {
  return (
    <>
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
              zIndex: i
            }}
          >
            <QuoteSheet
              quote={quote}
              className={
                isLast ? 'shadow-xl shadow-neutral-300/60' : 'shadow-lg shadow-neutral-200/50'
              }
            />
          </div>
        );
      })}
    </>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-0 w-full flex-1">
      <main className="grid h-full w-full grid-cols-1 items-center gap-12 overflow-y-auto px-6 py-4 lg:grid-cols-[1fr_minmax(0,460px)]">
        <div className="flex min-h-0 flex-col justify-center gap-6 sm:gap-9">
          <div>
            <h1 className="max-w-2xl text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              Presupuestos
              <br />
              <em className="font-serif">sin vueltas.</em>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md text-sm sm:text-base">
              Sin cuenta. Sin suscripción.
              <br />
              Creá, exportá en PDF y compartí por link.
            </p>
          </div>

          <CreateQuoteForm />

          <dl className="flex flex-col gap-1.5 border-t pt-4 font-mono text-xs sm:pt-6">
            {features.map(feature => (
              <div key={feature} className="flex items-center gap-2">
                <span aria-hidden className="text-foreground">
                  &#x2713;
                </span>
                <dd className="text-muted-foreground">{feature}</dd>
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
            fanned-out cards can bleed past that edge instead of being cut off. Desktop only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-6 hidden w-[423px] origin-center -translate-y-1/2 scale-[0.92] lg:block"
      >
        <DemoFanCards />
        <div className="invisible">
          <QuoteSheet quote={DEMO_QUOTES[0]} />
        </div>
      </div>
    </div>
  );
}
