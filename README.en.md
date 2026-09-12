# Presupuestapp

**Quotes, no fuss.** Put together a professional client quote, export it to
PDF, and share it via link — no account, no backend, no subscription.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![No backend](https://img.shields.io/badge/backend-none-8A2BE2)

**Language:** [Español](README.md) · English · [Português (Brasil)](README.pt-BR.md)

> The app's own UI is Argentine Spanish only — it's built for the LatAm
> freelance market. This README is translated for an international audience
> of contributors and readers.

## Table of contents

- [Screenshots](#screenshots)
- [Why it exists](#why-it-exists)
- [Features](#features)
- [Stack](#stack)
- [Getting started](#getting-started)
- [How it works](#how-it-works-in-short)
- [Contributing](#contributing)
- [License](#license)

## Screenshots

| Home | Editor |
| --- | --- |
| ![Home](docs/screenshots/home.png) | ![Editor](docs/screenshots/editor.png) |

## Why it exists

- **No account, no backend.** Every document lives only in the visitor's own
  browser storage (IndexedDB). There's no server to store — or leak — your
  clients' data.
- **Share without uploading anything.** Quote links carry the document's
  content encoded in the URL's own hash — it never touches a server.
- **Free and open source.** No artificial limits, no paid tiers.

## Features

- Live-preview editor — what you edit is exactly what gets printed/exported.
- In-browser PDF export, with selectable layouts and typefaces.
- Share via link (editable or read-only) or QR code.
- Document library with multi-select, bulk ZIP download, and bulk delete.
- Works offline once loaded — everything runs client-side.

## Stack

| Category | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) · [React 19](https://react.dev) · TypeScript |
| UI | [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com) · [Geist](https://vercel.com/font) · [lucide-react](https://lucide.dev) |
| Documents & data | [@react-pdf/renderer](https://react-pdf.org) (in-browser PDF) · [idb](https://github.com/jakearchibald/idb) (IndexedDB) · [qrcode.react](https://github.com/zpao/qrcode.react) · [JSZip](https://stuk.github.io/jszip/) |
| Quality | ESLint · Prettier |

## Getting started

Requires Node 22 (see `.nvmrc`) and [pnpm](https://pnpm.io) 11.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other commands:

```bash
pnpm build     # production build
pnpm lint      # ESLint
pnpm prettier  # format the repo
```

There's no test suite or CI — `lint` and `build` are the only gates.

## How it works (in short)

Presupuestapp is **100% client-side**: no backend exists. A document's
content lives in the visitor's browser (IndexedDB) or encoded in a share
URL's hash. The PDF is generated in the browser itself with
`@react-pdf/renderer`. If you want to go deeper into the architecture,
`CLAUDE.md` documents the data model, routes, and project conventions.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

To be decided.
