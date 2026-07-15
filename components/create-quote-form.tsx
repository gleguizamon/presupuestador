'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';

const START_NUMBER_KEY = 'presupuestador-start-number';
const STORAGE_KEY = 'presupuestador-draft';

function defaultNumber() {
  const t = new Date();
  return `P-${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}-01`;
}

export function CreateQuoteForm() {
  const router = useRouter();
  const [number, setNumber] = React.useState(defaultNumber);

  // Every visit to the home page starts a clean draft.
  const start = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.setItem(START_NUMBER_KEY, number.trim() || defaultNumber());
    } catch {
      // sessionStorage unavailable: the wizard falls back to its default number
    }
    router.push('/crear');
  };

  return (
    <form onSubmit={start} className="max-w-xl">
      <label
        htmlFor="numero"
        className="text-muted-foreground font-mono text-xs tracking-[0.2em] uppercase"
      >
        Número de presupuesto
      </label>
      <Input
        id="numero"
        value={number}
        onChange={e => setNumber(e.target.value)}
        className="mt-2 h-10 rounded-sm font-mono"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" className="rounded-sm" size="lg">
          Crear presupuesto <ArrowRight />
        </Button>
      </div>
    </form>
  );
}
