/* eslint-disable @next/next/no-img-element */
import * as React from 'react';
import { ItemTable } from '@/components/doc/item-table';
import { Paper, LAYOUT_THEMES } from '@/components/doc/paper';
import { QuoteTotals } from '@/components/doc/quote-totals';
import { SheetProps } from '@/lib/doc/types';
import { QuoteDoc, computeTotals, formatMoney } from '@/lib/doc/types';
import { cn } from '@/lib/utils';

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/** The document, read-only: the on-screen preview, the Cmd+P sheet, the
 *  landing demo, and a read-only share link all render exactly this. All
 *  editing happens in QuoteForm — this component never receives onChange. */
export function QuoteSheet({ doc: docProp, className }: SheetProps) {
  // The Sheet is read-only — editing happens in QuoteForm.
  const doc = docProp as QuoteDoc;
  const t = LAYOUT_THEMES[doc.style.layout] ?? LAYOUT_THEMES.clasico;
  const totals = computeTotals(doc.body);
  const money = (v: number) => formatMoney(v, doc.style.currencySign);
  const items = doc.body.items.filter(it => it.description || it.unitPrice);

  return (
    <Paper
      layout={doc.style.layout}
      font={doc.style.font}
      custom={doc.style.custom}
      className={className}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className={cn('text-[10px] font-medium tracking-[0.2em] uppercase', t.eyebrow)}>
            Presupuesto
          </p>
          <p className={cn('mt-1 text-xl', t.display)}>{doc.body.name}</p>
          <p className={cn('mt-1 text-[12px]', t.muted)}>
            Fecha: {fmtDate(doc.body.date)} &middot; Válido hasta: {fmtDate(doc.body.validUntil)}
          </p>
        </div>
        {doc.body.logo && (
          <div className={cn('shrink-0', t.logoWrap)}>
            <img
              src={doc.body.logo}
              alt={`Logo de ${doc.body.from.name || 'la empresa'}`}
              className="h-12 w-auto max-w-[160px] object-contain"
            />
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        {(
          [
            ['De', doc.body.from],
            ['Para', doc.body.to]
          ] as const
        ).map(([label, party]) => (
          <div key={label} className="min-w-0">
            <p className={cn('text-[10px] font-medium tracking-[0.2em] uppercase', t.eyebrow)}>
              {label}
            </p>
            <p className="mt-1 font-medium">{party.name || '—'}</p>
            <p className={cn('text-[12px] whitespace-pre-line', t.muted)}>{party.detail}</p>
          </div>
        ))}
      </div>

      <ItemTable items={items} theme={t} money={money} />

      <QuoteTotals
        theme={t}
        money={money}
        subtotal={totals.subtotal}
        discount={totals.discount}
        tax={totals.tax}
        total={totals.total}
        discountPct={doc.body.discountPct}
        taxPct={doc.body.taxPct}
      />

      {doc.body.notes && (
        <div className="mt-10">
          <p className={cn('text-[10px] font-medium tracking-[0.2em] uppercase', t.eyebrow)}>
            Notas y condiciones
          </p>
          <p className={cn('mt-1 text-[12px] whitespace-pre-line', t.muted)}>{doc.body.notes}</p>
        </div>
      )}

      {doc.body.signature && (
        <div className="mt-10 inline-block">
          <img
            src={doc.body.signature}
            alt="Firma"
            className="h-16 w-auto max-w-[220px] min-w-[140px] object-contain object-left"
          />
          <p className={cn('mt-1 border-t pt-1 text-[11px]', t.rowRule, t.muted)}>
            {doc.body.from.name || 'Firma'}
          </p>
        </div>
      )}
    </Paper>
  );
}
