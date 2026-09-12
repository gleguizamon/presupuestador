import type { Metadata } from 'next';
import { DocEditor } from '@/components/editor/doc-editor';
import { QUOTE_DESCRIPTION, QUOTE_NAME } from '@/components/docs/quote/meta';
import { BRAND_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${QUOTE_NAME} — ${BRAND_NAME}`,
  description: QUOTE_DESCRIPTION
};

/** Opens one specific saved document — the library's "Abrir" link. A stale or
 *  foreign id (deleted doc, hand-edited URL) falls back to the bare `/editor`
 *  route instead of erroring; see the `docId` branch in DocEditor's load
 *  effect. Keyed so navigating between documents mounts a fresh editor. */
export default async function EditorDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocEditor docId={id} key={id} />;
}
