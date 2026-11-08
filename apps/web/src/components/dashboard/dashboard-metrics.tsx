'use client';

import { FolderKanban, KeyRound, Layers } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Card } from '@/components/ui/card';

const metrics = [
  {
    title: 'Projects',
    value: '0',
    description: 'Workspaces waiting for their first project.',
    icon: FolderKanban,
  },
  {
    title: 'Environments',
    value: '3',
    description: 'Production, development, and test per project.',
    icon: Layers,
  },
  {
    title: 'Secrets',
    value: '0',
    description: 'Ciphertext only. Plaintext never touches storage.',
    icon: KeyRound,
  },
];

export function DashboardMetrics() {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-label="Instance metrics" className="mt-8 grid gap-3 sm:grid-cols-3">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            duration: 0.55,
            bounce: 0.1,
            delay: reduceMotion ? 0 : 0.05 * (index + 1),
          }}
        >
          <Card className="group h-full p-5 transition-[transform,border-color,background-color] duration-300 ease-[var(--ease-out)] [@media(hover:hover)]:hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.045]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-500">{metric.title}</p>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-neutral-500 transition-colors duration-300 group-hover:text-neutral-300">
                <metric.icon aria-hidden="true" strokeWidth={1.75} className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-6 text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-white tabular-nums">
              {metric.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">{metric.description}</p>
          </Card>
        </motion.div>
      ))}
    </section>
  );
}
