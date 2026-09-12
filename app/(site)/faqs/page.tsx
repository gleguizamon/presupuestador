import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BRAND_NAME, GITHUB_REPO } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Preguntas frecuentes — ${BRAND_NAME}`,
  description: `Cómo funciona ${BRAND_NAME}: dónde viven tus documentos, cómo se comparten, y qué pasa sin cuenta ni servidor.`
};

const UPDATED = 'Septiembre 2026';
const ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues`;

const link = 'text-foreground underline decoration-dotted underline-offset-2 hover:opacity-70';

/** `a` renders on the page; `text` is the plain-text version for the
 *  FAQPage structured data. Keep the two saying the same thing. */
type Faq = { q: string; a: ReactNode; text: string };

const FAQS: Faq[] = [
  {
    q: '¿Necesito crear una cuenta?',
    a: 'No. No hay registro, ni login, ni suscripción. Entrás y empezás a escribir el presupuesto.',
    text: 'No. No hay registro, ni login, ni suscripción. Entrás y empezás a escribir el presupuesto.'
  },
  {
    q: '¿Dónde se guardan mis documentos?',
    a: (
      <>
        Únicamente en tu navegador (en su almacenamiento local, IndexedDB). No hay backend:{' '}
        {BRAND_NAME} no tiene servidor donde guardar tus datos.
      </>
    ),
    text: `Únicamente en tu navegador (IndexedDB). No hay backend: ${BRAND_NAME} no tiene servidor donde guardar tus datos.`
  },
  {
    q: '¿Qué pasa si borro los datos del navegador o cambio de dispositivo?',
    a: 'Se pierden los documentos guardados en ese navegador. No se sincronizan entre dispositivos. Si querés conservar uno, exportalo a PDF o guardá su link para compartir.',
    text: 'Se pierden los documentos guardados en ese navegador. No se sincronizan entre dispositivos. Si querés conservar uno, exportalo a PDF o guardá su link para compartir.'
  },
  {
    q: '¿Cómo funciona compartir por link?',
    a: 'El documento entero se codifica dentro de la propia dirección del link (después del #), que nunca llega a un servidor. Quien lo abre reconstruye el presupuesto desde ahí. Por eso los links son largos.',
    text: 'El documento se codifica dentro de la dirección del link (después del #), que nunca llega a un servidor. Quien lo abre reconstruye el presupuesto desde ahí. Por eso los links son largos.'
  },
  {
    q: '¿Quién puede editar un presupuesto que compartí?',
    a: 'Por defecto, el link es de solo lectura. El link de edición lleva una clave extra y es el único que permite modificarlo; compartí ese solo con quien corresponda.',
    text: 'Por defecto el link es de solo lectura. El link de edición lleva una clave extra y es el único que permite modificarlo.'
  },
  {
    q: '¿Es gratis?',
    a: 'Sí, entero y sin límites. No hay plan pago ni funciones bloqueadas.',
    text: 'Sí, entero y sin límites. No hay plan pago ni funciones bloqueadas.'
  },
  {
    q: '¿Puedo usarlo sin conexión?',
    a: 'Sí, una vez que la página cargó. Todo el trabajo —incluida la exportación a PDF— se hace en tu navegador, sin llamadas a internet.',
    text: 'Sí, una vez que la página cargó. Todo el trabajo, incluida la exportación a PDF, se hace en tu navegador.'
  },
  {
    q: '¿El PDF se genera en algún servidor?',
    a: 'No. El PDF se arma en tu navegador en el momento de exportar. El logo que subís viaja dentro del PDF pero nunca sale de tu equipo.',
    text: 'No. El PDF se arma en tu navegador al exportar. El logo viaja dentro del PDF pero nunca sale de tu equipo.'
  },
  {
    q: '¿Recopilan datos o información personal?',
    a: (
      <>
        No. Nada de lo que escribís sale de tu navegador. Está detallado en la{' '}
        <Link href="/privacy" className={link}>
          política de privacidad
        </Link>
        .
      </>
    ),
    text: 'No. Nada de lo que escribís sale de tu navegador. Está detallado en la política de privacidad.'
  }
];

function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.text }
    }))
  };
}

export default function FaqsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />

      <header>
        <p className="text-muted-foreground font-mono text-xs tracking-[0.15em] uppercase">
          Actualizado {UPDATED}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Preguntas frecuentes
        </h1>
      </header>

      <dl className="mt-10">
        {FAQS.map(faq => (
          <div key={faq.q} className="border-border border-t py-6">
            <dt className="font-medium">{faq.q}</dt>
            <dd className="text-muted-foreground mt-2 text-sm leading-relaxed">{faq.a}</dd>
          </div>
        ))}
      </dl>

      <div className="border-border mt-4 border-t pt-8">
        <h2 className="font-medium">¿Tenés otra pregunta?</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Abrí un issue en{' '}
          <a href={ISSUES_URL} target="_blank" rel="noreferrer" className={link}>
            GitHub
          </a>{' '}
          y te respondemos.
        </p>
      </div>
    </div>
  );
}
