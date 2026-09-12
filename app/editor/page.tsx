import type { Metadata } from 'next';
import { DocEditor } from '@/components/editor/doc-editor';
import { QUOTE_DESCRIPTION, QUOTE_NAME } from '@/components/docs/quote/meta';
import { BRAND_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${QUOTE_NAME} — ${BRAND_NAME}`,
  description: QUOTE_DESCRIPTION
};

/** The editor at its bare route: redirects to the most recently created
 *  presupuesto's own `/editor/[id]`, the empty-library state if there isn't
 *  one, or — when the URL carries a `#c=`/`#d=` share hash — the shared
 *  document. `DocEditor` reads the hash itself (client-side, never sent to a
 *  server). */
export default function EditorPage() {
  return <DocEditor />;
}
