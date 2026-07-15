'use client';

import { motion } from 'motion/react';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepDef = {
  title: string;
  icon: LucideIcon;
};

/** Stepper header adapted from @shadcn-space/stepper-01: icon circles joined
 *  by an animated progress line, controlled by the parent. */
export function Stepper({
  steps,
  active,
  onSelect
}: {
  steps: readonly StepDef[];
  active: number;
  onSelect: (index: number) => void;
}) {
  // The connector spans from the first circle's center to the last one's.
  const inset = `${100 / (steps.length * 2)}%`;

  return (
    <div className="relative flex w-full items-start justify-between">
      <div className="bg-border absolute top-4 h-0.5" style={{ left: inset, right: inset }} />
      <motion.div
        className="bg-primary absolute top-4 h-0.5 origin-left"
        style={{ left: inset, right: inset }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: active / (steps.length - 1) }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      />

      {steps.map((step, idx) => {
        const isCompleted = idx < active;
        const isActive = idx === active;
        return (
          <button
            key={step.title}
            type="button"
            onClick={() => onSelect(idx)}
            className="group relative flex flex-1 cursor-pointer flex-col items-center"
            aria-current={isActive ? 'step' : undefined}
          >
            <motion.span
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow-sm transition-colors duration-300',
                isCompleted || isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground group-hover:text-foreground border'
              )}
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </motion.span>
            <span
              className={cn(
                'mt-2 hidden text-xs tracking-wide transition-colors duration-300 select-none sm:block',
                isActive
                  ? 'text-foreground font-semibold'
                  : isCompleted
                    ? 'text-foreground/70 font-medium'
                    : 'text-muted-foreground/60 group-hover:text-muted-foreground'
              )}
            >
              {step.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
