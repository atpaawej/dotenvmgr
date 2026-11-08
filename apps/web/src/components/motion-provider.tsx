'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** Let every Motion animation follow the visitor's reduced-motion preference. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
