'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { es } from 'react-day-picker/locale';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

/** shadcn date picker (Popover + Calendar) that stores ISO yyyy-mm-dd. */
export function DateField({
  label,
  value,
  onChange,
  autoFocus,
  triggerClassName
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  autoFocus?: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [y, m, d] = value.split('-').map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        autoFocus={autoFocus}
        className={cn(
          'flex h-11 w-full items-center gap-2 px-3 text-left text-sm tabular-nums focus-visible:outline-none',
          triggerClassName
        )}
      >
        <CalendarDays className="text-muted-foreground size-4 shrink-0" aria-hidden />
        {date
          ? date.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          : 'Elegir fecha'}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={es}
          selected={date}
          defaultMonth={date}
          onSelect={day => {
            if (day) {
              const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              onChange(iso);
            }
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
