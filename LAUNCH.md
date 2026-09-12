# Lista de lanzamiento

> Draft / documento de trabajo. La estrategia de SEO y posicionamiento está en
> `SEO.md`; esto es el checklist operativo de "qué falta para salir".

## Ya está listo

- [x] Rediseño de chrome (SaaS-clean, header plano)
- [x] Editor form + preview, guardado automático
- [x] Presupuesto: crear / editar / PDF / link / QR
- [x] Copy del hero sin "propuestas" (la app solo hace presupuestos)
- [x] `app/robots.ts` + `app/sitemap.ts`
- [x] Manejo de storage bloqueado (aviso, sin guardado silencioso, guards de
      navegación, shim de `sessionStorage` para Next)
- [x] Páginas `/changelog` y `/faqs`
- [x] Rutas e identificadores en inglés (`/editor`, `/privacy`)

## Antes de salir

### Importante

- [ ] **Open Graph / Twitter**: `metadataBase` + bloque `openGraph`/`twitter`
      en `app/layout.tsx`, y una imagen `app/opengraph-image.(png|tsx)`. Sin
      esto, el link en PH/Twitter/LinkedIn sale como tarjeta vacía.
- [ ] **Meta title + description con keywords** (ver `SEO.md` §1):
      p. ej. `Creador de Presupuestos Online Sin Registro - Open Source`.
- [ ] **Dominio real** en `SITE_ORIGIN` (`lib/constants.ts`) — o dejar que
      Vercel setee `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`.

### Rápido

- [ ] `app/icon.png` + `app/apple-icon.png` (hoy solo hay `favicon.ico`).
- [ ] Poner fecha real en la entrada `1.1.0` del changelog (`lib/changelog.ts`).
- [ ] Repo público en GitHub: README, `topics` (`indexeddb`, `no-backend`,
      `pdf`, `invoicing`, `freelance`), licencia.

### A decidir

- [ ] **Analítica**: cookieless (Plausible/Umami) para medir el lanzamiento, o
      explícitamente ninguna (va con el pitch de privacidad).
- [ ] Un disclaimer "as-is / sin garantías" en algún lado (la FAQ ya cubre
      "no recopilamos datos").

## Lanzamiento comunitario

Detalle en `SEO.md` §2. Resumen: Product Hunt, Show HN, Reddit (r/freelance,
r/selfhosted). Ángulo: sin cuenta / sin backend / todo en IndexedDB / open
source.

## Notas

- El PDF exportado muestra el host del sitio en el pie (sin nombre de marca);
  sale de `SITE_HOST`, derivado de `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`
  (automático en Vercel, `undefined` en otro hosting).
- Nombre: **Presupuestapp** (renombrado desde Presupuestafy el 2026-09-11).
  Idea parqueada para un lanzamiento internacional con i18n: ver `SEO.md` §5 /
  memoria `brand-naming`.
