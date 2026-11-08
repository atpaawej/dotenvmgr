'use client';

import { FolderPlus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Card } from '@/components/ui/card';

const environments = ['production', 'development', 'test'];

const vaultFacts = [
  { label: 'Cipher', value: 'AES-256-GCM' },
  { label: 'Key derivation', value: 'HKDF' },
  { label: 'At rest', value: 'Ciphertext only' },
  { label: 'Session', value: 'HTTP-only' },
];

export function DashboardWorkspace() {
  const reduceMotion = useReducedMotion();
  const reveal = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      type: 'spring' as const,
      duration: 0.55,
      bounce: 0.08,
      delay: reduceMotion ? 0 : delay,
    },
  });

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
      <motion.div {...reveal(0.2)}>
        <Card className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold tracking-[-0.01em] text-neutral-100">
                Projects
              </h2>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Each project carries its own encrypted environments.
              </p>
            </div>
            <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[0.65rem] font-medium text-neutral-500">
              0 projects
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-neutral-500">
              <FolderPlus aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-sm font-medium text-neutral-200">No projects yet</h3>
            <p className="mt-1.5 max-w-xs text-xs leading-5 text-neutral-500">
              Projects and their environment tabs will appear here once the
              secret pipeline lands.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
              {environments.map((environment) => (
                <span
                  key={environment}
                  className="rounded-md border border-white/[0.06] bg-black/20 px-2 py-1 text-[0.65rem] font-medium capitalize text-neutral-500"
                >
                  {environment}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div {...reveal(0.26)}>
        <Card className="flex h-full flex-col">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-neutral-100">
              Vault
            </h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Guarantees enforced below the interface.
            </p>
          </div>

          <dl className="flex-1 divide-y divide-white/[0.06] px-5">
            {vaultFacts.map((fact) => (
              <div key={fact.label} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-xs text-neutral-500">{fact.label}</dt>
                <dd className="font-mono text-[0.68rem] tracking-[-0.01em] text-neutral-300">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </motion.div>
    </div>
  );
}
