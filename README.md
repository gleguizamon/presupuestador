# Presupuestapp

Creá presupuestos profesionales, exportalos a PDF y compartilos con un link — sin
cuenta, sin backend, sin suscripción. Pensado para freelancers e independientes
que facturan y se comunican con sus clientes por su cuenta.

## Capturas

| Home | Editor |
| --- | --- |
| ![Home](docs/screenshots/home.png) | ![Editor](docs/screenshots/editor.png) |

## Por qué existe

- **Sin cuenta, sin backend.** Cada documento vive únicamente en el
  almacenamiento local del navegador (IndexedDB). No hay servidor que guarde
  ni pueda filtrar los datos de tus clientes.
- **Compartir sin subir nada.** Los links de presupuesto llevan el contenido
  codificado en el propio hash de la URL — nunca pasan por un servidor.
- **Gratis y de código abierto.** Sin límites artificiales ni planes pagos.

## Funcionalidad

- Editor con vista previa en vivo (lo que editás es exactamente lo que se
  imprime/exporta).
- Export a PDF en el navegador, con layouts y tipografías elegibles.
- Compartir por link (con o sin permiso de edición) o por código QR.
- Biblioteca de documentos con selección múltiple, descarga en ZIP y borrado
  en lote.
- Funciona sin conexión una vez cargada la app (todo corre en el cliente).

## Stack

[Next.js 16](https://nextjs.org) (App Router) · [React 19](https://react.dev) ·
TypeScript · [Tailwind CSS v4](https://tailwindcss.com) ·
[shadcn/ui](https://ui.shadcn.com) sobre [Base UI](https://base-ui.com) ·
[@react-pdf/renderer](https://react-pdf.org) · [idb](https://github.com/jakearchibald/idb)
para IndexedDB.

## Empezar a desarrollar

Requiere Node 22 (ver `.nvmrc`) y [pnpm](https://pnpm.io) 11.

```bash
pnpm install
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000).

Otros comandos:

```bash
pnpm build     # build de producción
pnpm lint      # ESLint
pnpm prettier  # formatear el repo
```

No hay suite de tests ni CI — `lint` y `build` son los únicos gates.

## Cómo funciona (a grandes rasgos)

Presupuestapp es **100% client-side**: no existe backend. El contenido de un
documento vive en el navegador del visitante (IndexedDB) o codificado en el
hash de una URL de share. El PDF se genera en el propio navegador con
`@react-pdf/renderer`. Si querés meterte más a fondo en la arquitectura,
`CLAUDE.md` documenta el modelo de datos, las rutas y las convenciones del
proyecto.

## Licencia

Por definir.
