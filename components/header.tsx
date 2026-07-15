import GithubStarButton from '@/components/github-star-button';
import { BRAND_NAME } from '@/lib/constants';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="flex w-full shrink-0 items-center justify-between gap-4 border-b px-6 py-4">
      <Link href="/" className="text-2xl font-semibold tracking-tighter lowercase">
        {BRAND_NAME}.
      </Link>
      <GithubStarButton />
    </header>
  );
}
