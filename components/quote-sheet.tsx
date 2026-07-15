/* eslint-disable @next/next/no-img-element */
import { Quote, TemplateId, computeTotals, formatMoney } from "@/lib/quote";
import { cn } from "@/lib/utils";

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

type SheetTheme = {
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

const THEMES: Record<TemplateId, SheetTheme> = {
  minimal: {
    sheet: "border bg-white text-neutral-900",
    display: "font-semibold",
    eyebrow: "text-neutral-500",
    muted: "text-neutral-500",
    strong: "text-neutral-900",
    headRule: "border-neutral-900",
    rowRule: "border-neutral-200",
    totalWrap: "border-t border-neutral-900",
    logoWrap: "",
  },
  clasica: {
    sheet: "border border-neutral-300 bg-white font-serif text-neutral-900",
    display: "font-serif text-2xl tracking-wide",
    eyebrow: "text-neutral-500",
    muted: "text-neutral-500",
    strong: "text-neutral-900",
    headRule: "border-b-2 border-double border-neutral-900",
    rowRule: "border-neutral-300",
    totalWrap: "border-t-2 border-double border-neutral-900",
    logoWrap: "",
  },
  calida: {
    sheet: "border border-[#E8DED4] bg-[#F7F2ED] font-serif text-[#4A403B]",
    display: "font-serif text-2xl tracking-wide text-[#7C5C55]",
    eyebrow: "text-[#9C8578]",
    muted: "text-[#9C8578]",
    strong: "text-[#4A403B]",
    headRule: "border-[#B49286]",
    rowRule: "border-[#E4D8CC]",
    totalWrap: "rounded-md bg-[#EDE3D9] px-3 py-1.5",
    logoWrap: "rounded-lg bg-[#EDE3D9] px-4 py-3",
  },
};

/** Read-only document render: the on-screen preview, the Cmd+P sheet and the
 *  landing demo all use this. Brings its own paper (bg, border, padding). */
export function QuoteSheet({
  quote,
  className,
}: {
  quote: Quote;
  className?: string;
}) {
  const t = THEMES[quote.template] ?? THEMES.minimal;
  const totals = computeTotals(quote);
  const money = (v: number) => formatMoney(v, quote.currency);

  return (
    <div
      className={cn(
        "rounded-lg px-6 py-8 text-[13px] leading-relaxed shadow-sm sm:px-12 sm:py-10",
        t.sheet,
        className
      )}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.2em]",
              t.eyebrow
            )}
          >
            Presupuesto
          </p>
          <p className={cn("mt-1 text-xl", t.display)}>{quote.number}</p>
          <p className={cn("mt-1 text-[12px]", t.muted)}>
            Fecha: {fmtDate(quote.date)} · Válido hasta:{" "}
            {fmtDate(quote.validUntil)}
          </p>
        </div>
        {quote.logo && (
          <div className={cn("shrink-0", t.logoWrap)}>
            <img
              src={quote.logo}
              alt={`Logo de ${quote.from.name || "la empresa"}`}
              className="h-12 w-auto max-w-[160px] object-contain"
            />
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8">
        {(
          [
            ["De", quote.from],
            ["Para", quote.to],
          ] as const
        ).map(([label, party]) => (
          <div key={label}>
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.2em]",
                t.eyebrow
              )}
            >
              {label}
            </p>
            <p className="mt-1 font-medium">{party.name || "—"}</p>
            <p className={cn("whitespace-pre-line text-[12px]", t.muted)}>
              {party.detail}
            </p>
          </div>
        ))}
      </div>

      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr
            className={cn(
              "border-b text-[10px] uppercase tracking-wider",
              t.headRule,
              t.muted
            )}
          >
            <th className="pb-1.5 text-left font-medium">Descripción</th>
            <th className="pb-1.5 text-right font-medium">Cant.</th>
            <th className="pb-1.5 text-right font-medium">Precio unit.</th>
            <th className="pb-1.5 text-right font-medium">Importe</th>
          </tr>
        </thead>
        <tbody>
          {quote.items
            .filter((it) => it.description || it.unitPrice)
            .map((it) => (
              <tr key={it.id} className={cn("border-b", t.rowRule)}>
                <td className="py-1.5 pr-4">{it.description}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {it.quantity}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {money(it.unitPrice)}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {money((it.quantity || 0) * (it.unitPrice || 0))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-[12px]">
          <div className="flex justify-between">
            <span className={t.muted}>Subtotal</span>
            <span className="tabular-nums">{money(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between">
              <span className={t.muted}>
                Descuento ({quote.discountPct}%)
              </span>
              <span className="tabular-nums">− {money(totals.discount)}</span>
            </div>
          )}
          {totals.tax > 0 && (
            <div className="flex justify-between">
              <span className={t.muted}>
                IVA / impuestos ({quote.taxPct}%)
              </span>
              <span className="tabular-nums">{money(totals.tax)}</span>
            </div>
          )}
          <div
            className={cn(
              "mt-1 flex items-baseline justify-between pt-1.5",
              t.totalWrap
            )}
          >
            <span className="font-medium">Total</span>
            <span className="text-base font-semibold tabular-nums">
              {money(totals.total)}
            </span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-10">
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.2em]",
              t.eyebrow
            )}
          >
            Notas y condiciones
          </p>
          <p className={cn("mt-1 whitespace-pre-line text-[12px]", t.muted)}>
            {quote.notes}
          </p>
        </div>
      )}
    </div>
  );
}
