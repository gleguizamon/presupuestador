'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FilePlus2, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/editor/site-header';
import { QUOTE_NAME, QuoteIcon } from '@/components/docs/quote/meta';
import { createDoc } from '@/lib/storage';

/** Shown inside the dashboard shell when the library is empty (first run, or
 *  everything was deleted). Creating is a deliberate action — the bare
 *  `/editor` route no longer auto-spawns a blank doc. */
export function EmptyLibrary() {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const doc = await createDoc();
      router.push(`/editor/${doc.id}`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col print:hidden">
      <SiteHeader>
        <span className="text-muted-foreground text-sm font-medium">{QUOTE_NAME}</span>
      </SiteHeader>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="bg-card w-full max-w-sm rounded-3xl border p-8 text-center shadow-sm">
          <div className="bg-muted text-muted-foreground mx-auto flex size-12 items-center justify-center rounded-2xl">
            <QuoteIcon className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-medium">No tenés presupuestos todavía</h2>
          <p className="text-muted-foreground mt-1 text-sm text-pretty">
            Creá el primero para empezar. Se guarda solo en este navegador.
          </p>
          <Button onClick={create} disabled={creating} className="mt-5 gap-2">
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FilePlus2 className="size-4" />
            )}
            Crear presupuesto
          </Button>
        </div>
      </div>
    </div>
  );
}
