import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export const metadata: Metadata = {
  title: "Changelog — presupuestador",
  description: "Novedades y mejoras de presupuestador.",
};

// changesets siempre titula estas secciones en inglés (según el bump elegido);
// las traducimos acá porque esta página la lee gente, no devs.
const SECTION_LABELS: Record<string, string> = {
  "Major Changes": "Cambios importantes",
  "Minor Changes": "Novedades",
  "Patch Changes": "Correcciones",
};

function translateHeading(children: React.ReactNode) {
  const text = typeof children === "string" ? children : String(children);
  return SECTION_LABELS[text] ?? text;
}

async function getChangelog() {
  const file = await fs.readFile(
    path.join(process.cwd(), "CHANGELOG.md"),
    "utf-8",
  );
  // Drop the leading "# Changelog" heading: the page already has its own title.
  return file.replace(/^#\s+changelog\s*\n/i, "").trim();
}

export default async function ChangelogPage() {
  const changelog = await getChangelog();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-10 flex items-center justify-between border-b pb-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight hover:opacity-70"
        >
          presupuestador<span className="text-muted-foreground">.</span>
        </Link>
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Volver
        </Link>
      </header>

      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Changelog
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Novedades y mejoras de presupuestador.
      </p>

      <div className="mt-10">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="mt-12 border-b pb-2 font-mono text-xl font-semibold tracking-tight first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {translateHeading(children)}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li className="flex gap-2 before:mt-[0.55em] before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-muted-foreground/60">
                <span>{children}</span>
              </li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                {children}
              </a>
            ),
            p: ({ children }) => (
              <p className="text-sm text-muted-foreground">{children}</p>
            ),
          }}
        >
          {changelog}
        </ReactMarkdown>
      </div>
    </div>
  );
}
