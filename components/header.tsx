import GithubStarButton from '@/components/github-star-button';
import { BRAND_NAME } from '@/lib/constants';
import Link from 'next/link';

const NAV = [
  { href: '/changelog', label: 'Changelog' },
  { href: '/faqs', label: 'Preguntas frecuentes' },
  { href: '/privacy', label: 'Privacidad' }
];

export default function Header() {
  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-sm print:static print:border-0 print:bg-transparent">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="text-lg font-semibold tracking-tight lowercase">
          {BRAND_NAME}.
        </Link>
        <nav className="flex items-center gap-1">
          <div className="hidden items-center sm:flex">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <GithubStarButton />
        </nav>
      </div>
    </header>
  );
}
