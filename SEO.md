# Estrategia de SEO para el lanzamiento

> Documento de trabajo para la salida — no es un spec. La idea de fondo: como
> la app no tiene base de datos central, **la landing tiene que ser la
> herramienta misma**, y para indexar rápido frente a la competencia hay que
> combinar SEO de nicho + backlinks de comunidad.

## 1. SEO de nicho (long-tail)

Apuntar a términos específicos con poca competencia, no a "crear presupuesto"
a secas.

- **Meta title** (en `app/layout.tsx` → `metadata.title`, y revisar el de
  `app/(site)/page.tsx`):
  `Creador de Presupuestos Online Sin Registro - Open Source`
- **Palabras clave a atacar** (en copy real de la home, H1/H2, meta
  description, FAQ):
  - "presupuestos en el navegador"
  - "crear presupuesto pdf gratis sin cuenta"
  - "presupuesto online sin registro"
  - "generador de presupuestos open source"
- Que el H1 y la primera pantalla contengan esas frases de forma natural
  (hoy el hero dice "Presupuestos, sin vueltas" — sirve para marca, pero
  falta la keyword literal en algún lado indexable).

## 2. Lanzamiento comunitario (backlinks)

Para una herramienta open source el SEO temprano viene de los backlinks, no
de Google. Lanzar en:

- **Product Hunt**
- **Hacker News** (Show HN)
- **Reddit**: r/freelance, r/selfhosted (aman las herramientas sin registro
  basadas en IndexedDB), y sumar r/webdev / r/argentina si aplica
- **GitHub**: repo público, buen README, topics (`indexeddb`, `no-backend`,
  `pdf`, `invoicing`, `freelance`)

El ángulo que engancha en esas comunidades: **sin cuenta, sin backend, todo
en el navegador (IndexedDB), open source**.

## 3. Base técnica (estado)

- [x] `app/robots.ts` + `app/sitemap.ts` — hechos
- [ ] `metadataBase` + bloque `openGraph`/`twitter` en `app/layout.tsx`
- [ ] `app/opengraph-image` (imagen para las tarjetas de PH/Twitter/LinkedIn)
- [ ] Ajustar `SITE_ORIGIN` en `lib/constants.ts` al dominio real
- [ ] Meta title + description con las keywords de arriba
- [ ] `app/icon.png` / `apple-icon.png`

## 4. Pendiente de decidir

- Analítica cookieless (Plausible/Umami) para medir si el lanzamiento pegó, o
  explícitamente ninguna (va con el pitch de privacidad).

## 5. Nombre / marca (a futuro)

Nombre actual: **Presupuestapp** (renombrado desde Presupuestafy el 2026-09-11; fijo por ahora, no renombrar sin consultar).

Idea parqueada para cuando se agregue localización (i18n):
**`Quotiq`**, con alguno de estos slogans para el lanzamiento internacional:

> **Quotiq — Open-source quote builder. No login. Local-first.**
> _Fast, private, open-source estimates._
> _Quotes that stay in your browser._

Los tres apuntan a lo mismo (rápido / privado / open source / sin cuenta) y
sirven para el meta title / copy en inglés incluso antes de cualquier rename.
