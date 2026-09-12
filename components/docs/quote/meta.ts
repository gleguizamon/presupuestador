import { FileText } from 'lucide-react';
import type { ComponentType } from 'react';
import type { Doc } from '@/lib/doc/types';

/** Presupuesto is the only document kind. These are the bits the editor and
 *  the dashboard chrome need about it — name, icon, and a lazy PDF loader —
 *  without pulling the form/sheet/PDF code into every entry point. */
export const QUOTE_NAME = 'Presupuesto';
export const QUOTE_DESCRIPTION = 'Ítems con cantidad y precio, subtotal, descuento e impuesto.';
export const QuoteIcon = FileText;

/** Lazy — `@react-pdf/renderer` is heavy, only load it on an actual export. */
export const loadQuotePdf = (): Promise<ComponentType<{ doc: Doc }>> =>
  import('@/components/docs/quote/pdf').then(m => m.QuotePdf);
