import type { Metadata } from 'next';
import { BRAND_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Política de privacidad — ${BRAND_NAME}`,
  description: `${BRAND_NAME} no recopila datos ni información personal.`
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Política de privacidad</h1>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">
        {BRAND_NAME} no recopila datos ni información personal. Los presupuestos que creás viven
        únicamente en el almacenamiento local de tu navegador, y los links que compartís llevan los
        datos codificados en la propia URL — nunca pasan por nuestros servidores.
      </p>

      <h2 className="text-muted-foreground mt-12 font-mono text-sm font-semibold tracking-[0.15em] uppercase">
        ¿Tenés preguntas?
      </h2>
      <p className="text-muted-foreground mt-2 max-w-xl text-sm">
        Si tenés preguntas o sugerencias sobre esta política de privacidad, no dudes en
        contactarnos.
      </p>
    </div>
  );
}
