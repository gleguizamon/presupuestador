/** Hand-maintained release notes rendered by `app/(site)/changelog`.
 *  Newest first — add a new object at the top of `CHANGELOG` for each
 *  release. A `null` version/date is the "not shipped yet" bucket. */

export type ChangeTag = 'nuevo' | 'mejora' | 'arreglo';

export type ChangelogEntry = {
  /** Semver string, or `null` for work that isn't released yet. */
  version: string | null;
  /** ISO `yyyy-mm-dd`, or `null` while unreleased. */
  date: string | null;
  /** One-line headline for the release. */
  title: string;
  changes: { tag: ChangeTag; text: string }[];
};

export const TAG_LABELS: Record<ChangeTag, string> = {
  nuevo: 'Nuevo',
  mejora: 'Mejora',
  arreglo: 'Arreglo'
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    // El relanzamiento: todo el rediseño acumulado desde la 1.0.0.
    // Ajustá `date` a la fecha real de salida.
    version: '1.1.0',
    date: '2026-09-09',
    title: 'Rediseño completo',
    changes: [
      {
        tag: 'nuevo',
        text: 'Editor nuevo: el formulario a un lado y la vista previa en vivo al otro. Lo que ves es exactamente lo que se imprime y lo que se comparte.'
      },
      {
        tag: 'nuevo',
        text: 'Barra lateral con todos tus presupuestos siempre a mano: abrir, renombrar, duplicar, borrar (uno o varios de una).'
      },
      {
        tag: 'nuevo',
        text: 'El formulario ahora tiene pestañas: Contenido, Estilo y Configuración, sin tapar el documento.'
      },
      {
        tag: 'nuevo',
        text: 'Firmá el presupuesto a mano alzada, directo en el formulario, con el color que elijas en la pestaña Estilo.'
      },
      {
        tag: 'nuevo',
        text: 'Ajustes de exportación: elegí el nombre del PDF, sus palabras clave y la fecha del documento.'
      },
      {
        tag: 'nuevo',
        text: 'Páginas nuevas: preguntas frecuentes y este changelog.'
      },
      {
        tag: 'mejora',
        text: 'Look nuevo en todo el sitio y el editor: más limpio y más claro, con tipografía, espaciados y botones repensados. Header más simple, sin la barra flotante.'
      },
      {
        tag: 'mejora',
        text: 'Si el navegador tiene el almacenamiento bloqueado (incógnito, configuración estricta), ahora te avisa claro y te previene de perder el trabajo al recargar o salir, en vez de fallar en silencio.'
      },
      {
        tag: 'mejora',
        text: 'Subí tu logo arrastrándolo. Te avisa si el formato o el peso no van, sin romper nada.'
      },
      {
        tag: 'mejora',
        text: 'Guardado automático mientras escribís. Nada que apretar, nada que se pierda.'
      },
      {
        tag: 'mejora',
        text: 'Selector de moneda más simple —dólar, euro, peso, real— y opción de poner un símbolo a mano.'
      },
      {
        tag: 'mejora',
        text: 'Se ve bien de la compu al teléfono: sin scroll horizontal ni cosas cortadas.'
      },
      {
        tag: 'arreglo',
        text: 'El selector de moneda mostraba códigos crudos en vez del símbolo cuando estaba cerrado.'
      },
      {
        tag: 'arreglo',
        text: 'El código QR para compartir ya no falla en presupuestos grandes: si no entra, ofrece copiar el link.'
      },
      { tag: 'arreglo', text: 'Corregido un parpadeo al cargar la lista de documentos.' }
    ]
  },
  {
    version: '1.0.0',
    date: '2026-07-15',
    title: 'Primera versión',
    changes: [
      {
        tag: 'nuevo',
        text: 'Armá presupuestos con ítems, cantidades, descuentos e impuestos.'
      },
      {
        tag: 'nuevo',
        text: 'Exportá a PDF al instante, generado 100% en tu navegador.'
      },
      {
        tag: 'nuevo',
        text: 'Compartí por link: los datos viajan dentro de la URL, sin pasar por ningún servidor.'
      },
      { tag: 'nuevo', text: 'Varias plantillas de estilo y tipografías para elegir.' },
      { tag: 'nuevo', text: 'Sin cuenta, sin suscripción, sin instalar nada.' }
    ]
  }
];

/** `2026-07-15` → `15 de julio de 2026`. */
export function formatChangelogDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
