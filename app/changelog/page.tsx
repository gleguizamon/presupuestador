import fs from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import { BRAND_NAME } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';

export const metadata: Metadata = {
  title: `Changelog — ${BRAND_NAME}`,
  description: `Novedades y mejoras de ${BRAND_NAME}.`
};

// changesets siempre titula estas secciones en inglés (según el bump elegido);
// las traducimos acá porque esta página la lee gente, no devs.
const SECTION_LABELS: Record<string, string> = {
  'Major Changes': 'Cambios importantes',
  'Minor Changes': 'Novedades',
  'Patch Changes': 'Correcciones'
};

function translateHeading(children: React.ReactNode) {
  const text = typeof children === 'string' ? children : String(children);
  return SECTION_LABELS[text] ?? text;
}

async function getChangelog() {
  const file = await fs.readFile(path.join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
  // Drop the leading "# Changelog" heading: the page already has its own title.
  return file.replace(/^#\s+changelog\s*\n/i, '').trim();
}

export default async function ChangelogPage() {
  const changelog = await getChangelog();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Changelog</h1>
      <p className="text-muted-foreground mt-2 text-sm">Novedades y mejoras de {BRAND_NAME}.</p>

      <div className="mt-10">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="mt-12 border-b pb-2 font-mono text-xl font-semibold tracking-tight first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-muted-foreground mt-6 text-sm font-semibold tracking-[0.15em] uppercase">
                {translateHeading(children)}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="before:bg-muted-foreground/60 flex gap-2 before:mt-[0.55em] before:h-1 before:w-1 before:shrink-0 before:rounded-full">
                <span>{children}</span>
              </li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground font-mono text-xs underline decoration-dotted underline-offset-2"
              >
                {children}
              </a>
            ),
            p: ({ children }) => <p className="text-muted-foreground text-sm">{children}</p>
          }}
        >
          {changelog}
        </ReactMarkdown>
      </div>
    </div>
  );
}
