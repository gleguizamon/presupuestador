# Presupuestapp

Creá presupuestos profesionales, exportalos a PDF y compartilos con un link — sin
cuenta, sin backend, sin suscripción. Pensado para freelancers e independientes
que facturan y se comunican con sus clientes por su cuenta.

## Capturas

<!--
  Reemplazá estos placeholders por capturas reales — instrucciones más abajo
  en "Cómo sacar y agregar las capturas".
-->

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

## Cómo sacar y agregar las capturas

1. Corré la app localmente (`pnpm dev`) y navegá a las pantallas que querés
   mostrar (la home, el editor con un presupuesto de ejemplo cargado, etc.).
2. En macOS, sacá la captura con:
   - `Cmd + Shift + 4` y arrastrá para seleccionar un área, o
   - `Cmd + Shift + 4` y luego `Espacio` para capturar una ventana completa
     (con su sombra — tocá `Option` mientras clickeás para sacarla sin
     sombra), o
   - `Cmd + Shift + 5` para abrir la barra de herramientas de captura, elegir
     "Ventana" o "Selección" y fijar la carpeta de destino desde "Opciones".
   Por default, la captura se guarda en el Escritorio como
   `Screenshot <fecha> at <hora>.png`.
3. Movela (o renombrala directamente al guardar) a `docs/screenshots/` con un
   nombre descriptivo, por ejemplo `home.png` o `editor.png` — esos son los
   nombres que ya están referenciados en la tabla de arriba.
4. Si el archivo pesa mucho (las capturas Retina salen grandes), achicalo
   antes de commitear, por ejemplo:
   ```bash
   sips -Z 1600 docs/screenshots/*.png   # reescala el lado mayor a 1600px
   ```
5. `git add docs/screenshots/*.png` y commiteá — el README ya las va a
   mostrar apenas existan en esa carpeta.

## Licencia

Por definir.
