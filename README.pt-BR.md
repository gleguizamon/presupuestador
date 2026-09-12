# Presupuestapp

**Orçamentos, sem enrolação.** Monte um orçamento profissional para seu
cliente, exporte em PDF e compartilhe por link — sem conta, sem backend, sem
assinatura.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![No backend](https://img.shields.io/badge/backend-none-8A2BE2)

**Idioma:** [Español](README.md) · [English](README.en.md) · Português (Brasil)

> A interface do app é só em espanhol argentino — é feita para o mercado
> freelancer da América Latina de língua espanhola. Este README está
> traduzido para leitores e colaboradores internacionais.

## Índice

- [Capturas de tela](#capturas-de-tela)
- [Por que existe](#por-que-existe)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Como começar a desenvolver](#como-começar-a-desenvolver)
- [Como funciona](#como-funciona-em-resumo)
- [Como contribuir](#como-contribuir)
- [Licença](#licença)

## Capturas de tela

| Home | Editor |
| --- | --- |
| ![Home](docs/screenshots/home.png) | ![Editor](docs/screenshots/editor.png) |

## Por que existe

- **Sem conta, sem backend.** Cada documento vive apenas no armazenamento
  local do navegador (IndexedDB). Não existe servidor que guarde — ou
  vaze — os dados dos seus clientes.
- **Compartilhar sem subir nada.** Os links de orçamento levam o conteúdo
  codificado no próprio hash da URL — nunca passam por um servidor.
- **Grátis e de código aberto.** Sem limites artificiais nem planos pagos.

## Funcionalidades

- Editor com pré-visualização ao vivo (o que você edita é exatamente o que
  é impresso/exportado).
- Exportação para PDF no navegador, com layouts e tipografias à escolha.
- Compartilhamento por link (editável ou somente leitura) ou QR code.
- Biblioteca de documentos com seleção múltipla, download em ZIP e exclusão
  em lote.
- Funciona offline depois de carregado — tudo roda no cliente.

## Stack

| Categoria | Tecnologia |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) · [React 19](https://react.dev) · TypeScript |
| UI | [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) sobre [Base UI](https://base-ui.com) · [Geist](https://vercel.com/font) · [lucide-react](https://lucide.dev) |
| Documentos e dados | [@react-pdf/renderer](https://react-pdf.org) (PDF no navegador) · [idb](https://github.com/jakearchibald/idb) (IndexedDB) · [qrcode.react](https://github.com/zpao/qrcode.react) · [JSZip](https://stuk.github.io/jszip/) |
| Qualidade | ESLint · Prettier |

## Como começar a desenvolver

Requer Node 22 (veja `.nvmrc`) e [pnpm](https://pnpm.io) 11.

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

Outros comandos:

```bash
pnpm build     # build de produção
pnpm lint      # ESLint
pnpm prettier  # formatar o repositório
```

Não há suíte de testes nem CI — `lint` e `build` são os únicos gates.

## Como funciona (em resumo)

Presupuestapp é **100% client-side**: não existe backend. O conteúdo de um
documento vive no navegador do visitante (IndexedDB) ou codificado no hash
de uma URL de compartilhamento. O PDF é gerado no próprio navegador com
`@react-pdf/renderer`. Para entender a arquitetura a fundo, `CLAUDE.md`
documenta o modelo de dados, as rotas e as convenções do projeto.

## Como contribuir

Veja [`CONTRIBUTING.md`](CONTRIBUTING.md) (em inglês).

## Licença

A definir.
