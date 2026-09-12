'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { loadQuotePdf } from '@/components/docs/quote/meta';
import { exportFileName } from '@/lib/doc/types';
import { getAllDocs } from '@/lib/storage';

/** Renders documents to PDF and hands back one ZIP — every saved doc, or just
 *  the ids passed in (the sidebar's multi-select). Everything runs in the
 *  browser (jszip + the lazy `@react-pdf` renderer), so nothing leaves the
 *  machine; progress goes through a single toast. */
export function useDownloadAll() {
  const [busy, setBusy] = React.useState(false);

  const run = React.useCallback(
    async (ids?: string[]) => {
      if (busy) return;
      setBusy(true);
      const id = toast.loading('Preparando ZIP…');
      try {
        const all = await getAllDocs();
        const wanted = ids ? new Set(ids) : null;
        const docs = wanted ? all.filter(d => wanted.has(d.id)) : all;
        if (docs.length === 0) {
          toast.dismiss(id);
          return;
        }

        const [{ default: JSZip }, { pdf }] = await Promise.all([
          import('jszip'),
          import('@react-pdf/renderer')
        ]);
        const zip = new JSZip();
        const used = new Map<string, number>();
        const Pdf = await loadQuotePdf();

        for (let i = 0; i < docs.length; i++) {
          const doc = docs[i];
          toast.loading(`Generando PDF ${i + 1} de ${docs.length}…`, { id });
          const blob = await pdf(<Pdf doc={doc} />).toBlob();
          // De-dupe filenames (two docs numbered the same → "001.pdf", "001 (1).pdf").
          let name = exportFileName(doc);
          const n = used.get(name) ?? 0;
          used.set(name, n + 1);
          if (n > 0) name = name.replace(/\.pdf$/i, ` (${n}).pdf`);
          zip.file(name, blob);
        }

        const out = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(out);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'presupuestos.zip';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('ZIP descargado', {
          id,
          description: `${docs.length} documento${docs.length === 1 ? '' : 's'}`
        });
      } catch {
        toast.error('No se pudo generar el ZIP', { id });
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  return { run, busy };
}
