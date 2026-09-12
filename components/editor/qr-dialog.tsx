'use client';

import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

/** A QR at size 200 with ECC level L tops out around 2.9 KB of data, but the
 *  code gets unscannably dense well before that. Past this many characters we
 *  don't try — a filled-in presupuesto's link is offered as copy-paste
 *  instead. (The signature is already dropped from share links; what's left
 *  is usually a few hundred chars.) */
const MAX_QR_CHARS = 1500;

/** Centered modal that shows the read-only share link as a big QR — for
 *  handing a client the document across the table without typing a URL. The
 *  backdrop is the same light blur as the mobile sidebar Sheet; clicking it
 *  (or pressing Escape / "Listo") closes. `url` is `null` while `DocEditor`
 *  is still building the link. */
export function QrDialog({
  open,
  onOpenChange,
  url
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
}) {
  const [copied, setCopied] = React.useState(false);
  const tooBig = url != null && url.length > MAX_QR_CHARS;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — nothing graceful to do here
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/10 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
        {/* Full-viewport so a click anywhere outside the Card lands on the
            Popup itself and dismisses (base-ui closes a modal dialog on
            outside press only when the target is the popup or its backdrop). */}
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-[opacity,transform] duration-200 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <Card className="w-full max-w-xs shadow-xl">
            <CardContent className="flex justify-center pt-2">
              <div className="flex size-[232px] items-center justify-center rounded-xl border bg-white p-4">
                {!url ? (
                  <div className="size-[200px] animate-pulse rounded bg-neutral-100" />
                ) : tooBig ? (
                  <div className="flex flex-col items-center gap-3 px-2 text-center">
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Este presupuesto es muy grande para un código QR. Copiá el link y compartilo
                      directo.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={copy}>
                      {copied ? <Check /> : <Copy />}
                      {copied ? 'Copiado' : 'Copiar link'}
                    </Button>
                  </div>
                ) : (
                  <QRCodeSVG value={url} size={200} level="L" marginSize={0} />
                )}
              </div>
            </CardContent>
            <CardHeader className="text-center">
              <Dialog.Title render={<CardTitle />}>
                {tooBig ? 'Compartí el link' : 'Escaneá para ver el presupuesto'}
              </Dialog.Title>
              <Dialog.Description render={<CardDescription />}>
                Link de solo lectura: se ve el documento y se descarga el PDF, no se edita. Nada
                pasa por un servidor.
              </Dialog.Description>
            </CardHeader>
            <CardFooter>
              <Dialog.Close render={<Button variant="secondary" className="w-full" />}>
                Listo
              </Dialog.Close>
            </CardFooter>
          </Card>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
