import * as React from 'react';
import { SheetTheme } from '@/components/doc/paper';
import { cn } from '@/lib/utils';

/** Read-only subtotal/discount/tax/total box under an ItemTable. */
export function QuoteTotals({
  theme: t,
  money,
  subtotal,
  discount,
  tax,
  total,
  discountPct,
  taxPct
}: {
  theme: SheetTheme;
  money: (v: number) => string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  discountPct: number;
  taxPct: number;
}) {
  return (
    <div className="mt-4 flex justify-end">
      <div className="w-64 space-y-1 text-[12px]">
        <div className="flex justify-between">
          <span className={t.muted}>Subtotal</span>
          <span className="tabular-nums">{money(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between">
            <span className={t.muted}>Descuento ({discountPct}%)</span>
            <span className="tabular-nums">- {money(discount)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between">
            <span className={t.muted}>IVA / impuestos ({taxPct}%)</span>
            <span className="tabular-nums">{money(tax)}</span>
          </div>
        )}

        <div className={cn('mt-1 flex items-baseline justify-between pt-1.5', t.totalWrap)}>
          <span className="font-medium">Total</span>
          <span className="text-base font-semibold tabular-nums">{money(total)}</span>
        </div>
      </div>
    </div>
  );
}
