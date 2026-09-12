import * as React from 'react';
import { SheetTheme } from '@/components/doc/paper';
import { QuoteItem } from '@/lib/doc/types';
import { cn } from '@/lib/utils';

/** Read-only qty × unit price line-item table, with its own mobile card
 *  layout. Editing happens in the document's form, not here. */
export function ItemTable({
  items,
  theme: t,
  money
}: {
  items: QuoteItem[];
  theme: SheetTheme;
  money: (v: number) => string;
}) {
  return (
    <div className="mt-8">
      {/* sm+: a compact table — the header row does the labeling. */}
      <div className="hidden sm:block">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr
              className={cn('border-b text-[10px] tracking-wider uppercase', t.headRule, t.muted)}
            >
              <th className="pb-1.5 text-left font-medium">Descripción</th>
              <th className="w-16 pb-1.5 text-right font-medium">Cant.</th>
              <th className="w-24 pb-1.5 text-right font-medium">Precio unit.</th>
              <th className="w-24 pb-1.5 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className={cn('border-b', t.rowRule)}>
                <td className="py-1.5 pr-4 [overflow-wrap:anywhere]">{it.description}</td>
                <td className="py-1.5 text-right tabular-nums">{it.quantity}</td>
                <td className="py-1.5 text-right tabular-nums">{money(it.unitPrice)}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {money((it.quantity || 0) * (it.unitPrice || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Below sm: the same PDF-shaped multi-column row gets cramped on a
          phone, so each item is its own bounded card instead. */}
      <div className="space-y-3 sm:hidden">
        {items.map(it => (
          <div key={it.id} className={cn('rounded-lg border p-3', t.rowRule)}>
            <p className="font-medium [overflow-wrap:anywhere]">{it.description}</p>
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <span className={t.muted}>
                {it.quantity} &times; {money(it.unitPrice)}
              </span>
              <span className={cn('font-medium tabular-nums', t.strong)}>
                {money((it.quantity || 0) * (it.unitPrice || 0))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
