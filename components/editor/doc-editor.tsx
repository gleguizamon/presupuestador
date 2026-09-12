'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Loader2, QrCode, RotateCcw, Share2 } from 'lucide-react';
import {
  EditorWorkspace,
  LocalStorageNotice,
  StorageUnavailableNotice
} from '@/components/editor/editor-workspace';
import { useStorageAvailable } from '@/hooks/use-storage-available';
import { EmptyLibrary } from '@/components/editor/empty-library';
import { QrDialog } from '@/components/editor/qr-dialog';
import { QuoteForm } from '@/components/docs/quote/form';
import { QuoteSheet } from '@/components/docs/quote/sheet';
import { QUOTE_NAME, loadQuotePdf } from '@/components/docs/quote/meta';
import { FEEDBACK_FORM_ID } from '@/lib/constants';
import { Doc, emptyDoc, exportFileName, isPristineDoc } from '@/lib/doc/types';
import { DISCARD_MESSAGE, setUnsavedAtRisk } from '@/lib/unsaved-guard';
import { decodeShareParams, encodeSharePayload, hashEditKey, randomEditKey } from '@/lib/quote';
import { openFeedbackPopup } from '@/lib/tally';
import { DOCS_CHANGED_EVENT, getDoc, getMostRecentDoc, saveDoc } from '@/lib/storage';

/** Session memory for the "your data lives only in this browser" notice:
 *  dismissed once, it stays hidden while the tab is open (`DocEditor` remounts
 *  per document, so component state alone would re-show it on every switch) and
 *  comes back on a fresh load. No storage involved. */
let noticeDismissed = false;

/** Share links sign an edit key with Web Crypto's `subtle` (SHA-256), and the
 *  copy/QR paths need `navigator.clipboard` — both only exist in a secure
 *  context. A phone hitting `pnpm dev` over plain http on the LAN isn't one, so
 *  the whole share subsystem is unavailable there (production is HTTPS, fine). */
function shareContextReady() {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.crypto?.subtle?.digest === 'function'
  );
}

const INSECURE_SHARE_TOAST = {
  title: 'Compartir necesita una conexión segura',
  description: 'Abrí la app por HTTPS o desde localhost.'
} as const;

/** Feedback link on the "PDF descargado" toast — offered on every export, no
 *  storage and no counting, just a quiet action the user can ignore. Opens as
 *  a popup overlay (never navigates away). Absent entirely until
 *  `FEEDBACK_FORM_ID` is set. */
const feedbackToastAction = FEEDBACK_FORM_ID
  ? {
      label: 'Dar mi opinión',
      onClick: () => openFeedbackPopup(FEEDBACK_FORM_ID)
    }
  : undefined;

/** State/IO controller for the presupuesto editor: loads the doc (share link →
 *  named doc → most-recent, redirecting to its `/editor/[id]` → empty state),
 *  autosaves it, and owns logo processing, share links, PDF export and reset.
 *  The responsive form/preview layout itself lives in `EditorWorkspace`.
 *
 *  `docId`, when given, opens that exact saved document (the library's
 *  "Abrir" link, or the bare route's own redirect to the most-recent one). */
export function DocEditor({ docId }: { docId?: string }) {
  const router = useRouter();
  const storageOk = useStorageAvailable();
  const [doc, setDoc] = React.useState<Doc | null>(null);
  // `empty`: the library has no document of this kind — show the empty state
  // instead of auto-creating a blank one. `gone`: the document being edited
  // was just deleted elsewhere (sidebar) — freeze and bail out before autosave
  // writes it back into existence.
  const [empty, setEmpty] = React.useState(false);
  const [gone, setGone] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [readOnly, setReadOnly] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [qrUrl, setQrUrl] = React.useState<string | null>(null);
  // "Your data lives only in this browser" notice — shown once per tab session.
  const [noticeSeen, setNoticeSeen] = React.useState(() => noticeDismissed);
  const dismissNotice = () => {
    noticeDismissed = true;
    setNoticeSeen(true);
  };

  // Load: shared link hash wins, then — if the route names a specific saved
  // document (the library's "Abrir" link) — that document, then (bare route)
  // redirect to the most recently edited one's own `/editor/[id]`, or the
  // empty state if the library has nothing yet.
  React.useEffect(() => {
    let cancelled = false;

    const loadFromLibrary = async () => {
      try {
        if (docId) {
          const existing = await getDoc(docId);
          if (cancelled) return;
          if (existing) {
            watchedIdRef.current = docId;
            setDoc(existing);
            return;
          }
          // Stale or foreign id (deleted doc, hand-edited URL): fall back to
          // the bare route rather than error.
          router.replace('/editor');
          return;
        }
        const existing = await getMostRecentDoc();
        if (cancelled) return;
        // Empty library: show the empty state, don't auto-create one (creating
        // is an explicit action — the sidebar button / home CTA). Otherwise
        // resolve to the real `/editor/[id]` URL and let that route's own
        // `docId` branch load it — same path as the library's "Abrir" link,
        // rather than rendering it in place under the bare, id-less URL.
        if (existing) {
          router.replace(`/editor/${existing.id}`);
        } else {
          setEmpty(true);
        }
      } catch {
        // Storage unreadable (blocked / private window): open a fresh
        // in-memory doc so the editor still works — the StorageUnavailableNotice
        // explains why nothing persists.
        if (!cancelled) setDoc(emptyDoc());
      }
    };

    const params = new URLSearchParams(window.location.hash.slice(1));
    if (!params.has('d') && !params.has('c')) {
      loadFromLibrary();
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      const shared = await decodeShareParams(params);
      if (cancelled) return;
      if (!shared) {
        loadFromLibrary();
        return;
      }
      const finish = (editable: boolean) => {
        if (cancelled) return;
        setReadOnly(!editable);
        setDoc(shared.doc);
        if (editable) {
          toast.success(`${QUOTE_NAME} cargado desde el link`, {
            description: 'Podés editarlo: los cambios se guardan solo en este navegador.'
          });
        }
      };
      if (!shared.editHash) {
        finish(true);
        return;
      }
      const key = params.get('k');
      if (!key) {
        finish(false);
        return;
      }
      try {
        finish((await hashEditKey(key)) === shared.editHash);
      } catch {
        finish(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  // Autosave, debounced — a keystroke shouldn't hit IndexedDB on every
  // keystroke. A read-only view must never clobber the visitor's own library,
  // and a `gone` doc must not be autosaved back into existence.
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set synchronously the instant we learn the doc was deleted, so a
  // debounced save that's already queued can't slip through and resurrect it.
  const goneRef = React.useRef(false);
  // The id of the library doc this editor is bound to (from `/[id]` or from
  // `getMostRecentDoc`). Null for share-link docs, which mustn't self-heal —
  // a fresh one legitimately isn't in the DB until its first autosave.
  const watchedIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    // `storageOk === false`: probed and this browser can't persist — don't even
    // try (the StorageUnavailableNotice already tells the user). `null` is the
    // brief probe window; a save that races it just fails silently as before.
    if (!doc || readOnly || gone || storageOk === false) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (goneRef.current) return;
      saveDoc(doc).catch(() => {
        // storage full or unavailable: editing still works, just isn't persisted
      });
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [doc, readOnly, gone, storageOk]);

  // Degraded mode only: nothing is persisted, so leaving this page loses the
  // whole document. Guard it while there's actual work to lose (a pristine,
  // untouched doc isn't worth nagging over). In normal mode autosave covers
  // this — no guard there.
  React.useEffect(() => {
    const atRisk = storageOk === false && !readOnly && !!doc && !isPristineDoc(doc);
    setUnsavedAtRisk(atRisk);
    if (!atRisk) return;

    // 1. Refresh / tab close / address bar / external links: the browser's
    //    native prompt.
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);

    // 2. In-app link clicks (next/link "Inicio", the brand, "Privacidad") —
    //    beforeunload never fires for these. A capturing listener runs before
    //    React's, so cancelling it stops the SPA navigation.
    const intercept = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as Element | null)?.closest?.('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      let url: URL;
      try {
        url = new URL(anchor.href, location.href);
      } catch {
        return;
      }
      // Only guard same-origin navigations that leave the editor. External
      // links do a full unload, so (1) already covers them.
      if (url.origin !== location.origin || url.pathname.startsWith('/editor')) return;
      if (!window.confirm(DISCARD_MESSAGE)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    document.addEventListener('click', intercept, true);

    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', intercept, true);
      setUnsavedAtRisk(false);
    };
  }, [storageOk, readOnly, doc]);

  // If the document being edited is deleted from the sidebar (single or bulk),
  // freeze this editor before the debounced autosave re-creates it, and drop
  // to the empty state / another remaining doc.
  React.useEffect(() => {
    const onDocsChanged = () => {
      const wid = watchedIdRef.current;
      if (!wid || goneRef.current) return;
      getDoc(wid).then(still => {
        if (still || goneRef.current) return;
        goneRef.current = true;
        if (saveTimer.current) {
          clearTimeout(saveTimer.current);
          saveTimer.current = null;
        }
        if (docId) {
          // `/[id]` route: leave, the bare route decides what to show next.
          setGone(true);
          router.replace('/editor');
        } else {
          // Already on the bare route — just swap in the empty state.
          setDoc(null);
          setEmpty(true);
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      });
    };
    window.addEventListener(DOCS_CHANGED_EVENT, onDocsChanged);
    return () => window.removeEventListener(DOCS_CHANGED_EVENT, onDocsChanged);
  }, [docId, router]);

  const update = (patch: Partial<Doc>) => setDoc(d => (d ? ({ ...d, ...patch } as Doc) : d));

  const onLogoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Downscale so the draft stays light in storage.
      const scale = Math.min(240 / img.width, 120 / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const logo = canvas.toDataURL('image/png');
      setDoc(d => (d ? { ...d, body: { ...d.body, logo } } : d));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('No se pudo leer la imagen', {
        description: 'El archivo está dañado o no es una imagen válida.'
      });
    };
    img.src = url;
  };

  // Builds a share URL for `doc`. Both links embed hash(key) as `eh`; only the
  // editable one also carries the key itself (`&k=`), so a read-only link
  // can't be flipped to editable.
  const buildShareUrl = async (editable: boolean) => {
    const key = randomEditKey();
    const editHash = await hashEditKey(key);
    const fragment = await encodeSharePayload(doc!, editHash);
    return `${window.location.origin}/editor#${fragment}${editable ? `&k=${key}` : ''}`;
  };

  const copyShareLink = async (editable: boolean) => {
    if (!doc) return;
    setShareOpen(false);
    if (!shareContextReady()) {
      toast.error(INSECURE_SHARE_TOAST.title, { description: INSECURE_SHARE_TOAST.description });
      return;
    }
    try {
      await navigator.clipboard.writeText(await buildShareUrl(editable));
      toast.success(editable ? 'Link editable copiado' : 'Link de solo lectura copiado', {
        description: editable
          ? 'Quien lo reciba puede modificar el documento.'
          : 'Quien lo reciba puede verlo y descargar el PDF, pero no editarlo.'
      });
    } catch {
      toast.error('No se pudo copiar el link', {
        description: 'Probá de nuevo en unos segundos.'
      });
    }
  };

  // Opens the full-screen QR. Always a read-only link (an edit key on a
  // screen anyone can photograph would be a footgun).
  const openQr = async () => {
    if (!doc) return;
    setShareOpen(false);
    if (!shareContextReady()) {
      toast.error(INSECURE_SHARE_TOAST.title, { description: INSECURE_SHARE_TOAST.description });
      return;
    }
    setQrUrl(null);
    setQrOpen(true);
    try {
      setQrUrl(await buildShareUrl(false));
    } catch {
      setQrOpen(false);
      toast.error('No se pudo generar el QR', { description: 'Probá de nuevo en unos segundos.' });
    }
  };

  const exportPdf = async () => {
    if (!doc || exporting) return;
    setExporting(true);
    try {
      const [{ pdf }, PdfComponent] = await Promise.all([
        import('@react-pdf/renderer'),
        loadQuotePdf()
      ]);
      const blob = await pdf(<PdfComponent doc={doc} />).toBlob();
      const fileName = exportFileName(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF descargado', { description: fileName, action: feedbackToastAction });
    } catch {
      toast.error('No se pudo generar el PDF', {
        description: 'Probá de nuevo en unos segundos.'
      });
    } finally {
      setExporting(false);
    }
  };

  // "Empezar de nuevo" — blanks every field of the *current* document, it
  // does not create a new one: the id and createdAt are kept so it stays the
  // same entry in the library (autosave then persists the cleared doc). Any
  // share-link hash in the URL is dropped without navigating (a route change
  // would race the debounced autosave). Guarded by a confirm dialog.
  const reset = () => {
    setDoc(d => {
      if (!d) return d;
      return { ...emptyDoc(), id: d.id, createdAt: d.createdAt };
    });
    setReadOnly(false);
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Deleted-from-under-us: the redirect to the bare route is already in flight,
  // render nothing so the stale doc never flashes.
  if (gone) return null;

  // Empty library — offer to create one.
  if (empty) return <EmptyLibrary />;

  if (!doc) {
    return (
      <div className="mx-auto mt-16 w-full max-w-6xl px-6">
        <div className="bg-card h-120 animate-pulse rounded-3xl" />
      </div>
    );
  }

  // Read-only view: someone opened a share link without the edit key. There's
  // no form to show here — just the preview, same component as everywhere
  // else. Still lives inside the dashboard shell (app/editor/layout.tsx), so
  // the sidebar already covers "Inicio"/brand — no separate top nav needed.
  if (readOnly) {
    return (
      <>
        <div className="mx-auto w-full max-w-3xl px-6 pt-4 pb-3 print:hidden">
          <div className="mb-3 flex items-center">
            <SidebarTrigger />
          </div>
          <div className="flex shrink-0 items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Solo lectura
            </span>
            <Button variant="ghost" size="sm" onClick={reset}>
              Crear el mío
            </Button>
          </div>
          <div className="mt-3 w-full">
            <QuoteSheet doc={doc} />
          </div>
          <div className="mt-3 flex w-full shrink-0 items-center justify-end">
            <Button size="sm" onClick={exportPdf} disabled={exporting}>
              {exporting ? 'Generando…' : 'Descargar PDF'}
            </Button>
          </div>
        </div>
        <div className="hidden px-2 print:block">
          <QuoteSheet doc={doc} className="rounded-none border-0 shadow-none" />
        </div>
      </>
    );
  }

  const docActions = (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-lg"
              onClick={exportPdf}
              disabled={exporting}
              aria-label="Descargar PDF"
              className="rounded-sm"
            />
          }
        >
          {exporting ? <Loader2 className="animate-spin" /> : <Download />}
          {/* <span>{exporting ? 'Generando…' : 'Descargar PDF'}</span> */}
        </TooltipTrigger>
        <TooltipContent>Descargar PDF</TooltipContent>
      </Tooltip>

      <Popover open={shareOpen} onOpenChange={setShareOpen}>
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-lg"
                    aria-label="Compartir link"
                    className="rounded-sm"
                  />
                }
              />
            }
          >
            <Share2 />
          </TooltipTrigger>
          <TooltipContent>Compartir link</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-72 p-2">
          <p className="text-muted-foreground px-2 pt-1.5 pb-1 text-xs font-medium tracking-wider uppercase">
            ¿Qué puede hacer quien lo reciba?
          </p>
          <Button
            variant="ghost"
            onClick={() => copyShareLink(false)}
            className="h-auto w-full flex-col items-start gap-0 rounded-md px-2 py-2 text-left"
          >
            <span className="block text-sm font-medium">Solo lectura</span>
            <span className="text-muted-foreground block text-xs font-normal">
              Ver el documento y descargar el PDF.
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => copyShareLink(true)}
            className="h-auto w-full flex-col items-start gap-0 rounded-md px-2 py-2 text-left"
          >
            <span className="block text-sm font-medium">Editable</span>
            <span className="text-muted-foreground block text-xs font-normal">
              El link incluye la clave de edición.
            </span>
          </Button>
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-lg"
              onClick={openQr}
              aria-label="Mostrar QR"
              className="rounded-sm"
            />
          }
        >
          <QrCode />
        </TooltipTrigger>
        <TooltipContent>Mostrar QR</TooltipContent>
      </Tooltip>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <Tooltip>
          <TooltipTrigger
            render={
              <AlertDialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="icon-lg"
                    aria-label="Empezar de nuevo"
                    className="rounded-sm"
                  />
                }
              />
            }
          >
            <RotateCcw />
          </TooltipTrigger>
          <TooltipContent>Empezar de nuevo</TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Empezar de nuevo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran todos los datos de este documento. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {/* AlertDialogAction is a plain Button (base-ui), it doesn't close
                the dialog on its own — do it here. */}
            <AlertDialogAction
              onClick={() => {
                reset();
                setResetOpen(false);
              }}
            >
              Borrar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="text-muted-foreground">Documentos</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate">{doc.body.name || 'Sin nombre'}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <>
      <EditorWorkspace
        Form={QuoteForm}
        Sheet={QuoteSheet}
        doc={doc}
        onChange={update}
        onLogoFile={onLogoFile}
        actions={docActions}
        breadcrumb={breadcrumb}
        notice={
          storageOk === false ? (
            <StorageUnavailableNotice onShare={() => setShareOpen(true)} />
          ) : noticeSeen ? null : (
            <LocalStorageNotice onShare={() => setShareOpen(true)} onDismiss={dismissNotice} />
          )
        }
      />

      <QrDialog open={qrOpen} onOpenChange={setQrOpen} url={qrUrl} />

      {/* Cmd+P fallback prints the same document, read-only. */}
      <div className="hidden px-2 print:block">
        <QuoteSheet doc={doc} className="rounded-none border-0 shadow-none" />
      </div>
    </>
  );
}
