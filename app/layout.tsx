import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BRAND_NAME } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: `${BRAND_NAME} — creá y compartí presupuestos`,
  description: 'Armá un presupuesto en segundos, exportalo en PDF o compartilo con un link.'
};

/** When a browser blocks site storage (Firefox strict, some private modes),
 *  reading `window.sessionStorage` *throws* — and Next's own router does that
 *  unguarded (scroll restoration). We use no sessionStorage ourselves; this
 *  just keeps the framework from crashing. Runs before any framework code: if
 *  the accessor throws, swap in an in-memory fallback. No-op in a normal
 *  browser. */
const STORAGE_SHIM = `(function(){try{if(window.sessionStorage)return}catch(e){}var d={},a={getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null}};Object.defineProperty(a,"length",{get:function(){return Object.keys(d).length}});try{Object.defineProperty(window,"sessionStorage",{configurable:true,value:a})}catch(e){}})();`;

/** Bare shell only — the marketing chrome (Header/Footer) lives in
 *  app/(site)/layout.tsx and the dashboard chrome (sidebar) in
 *  app/editor/layout.tsx, since neither applies to both route families. */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="bg-background flex min-h-dvh flex-col print:min-h-0 print:bg-white">
        <script dangerouslySetInnerHTML={{ __html: STORAGE_SHIM }} />
        <TooltipProvider>
          <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
        </TooltipProvider>
        <Toaster position="bottom-center" theme="light" />
      </body>
    </html>
  );
}
