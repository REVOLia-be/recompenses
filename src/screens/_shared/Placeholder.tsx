import type { ReactNode } from 'react';
import { EmptyState, GlassCard } from '../../ui';

/** Bloc « écran en construction » utilisé par les placeholders. À supprimer quand l'écran est livré. */
export function Placeholder({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <GlassCard padding="sm">
      <EmptyState emoji={emoji} title={title} message={children ?? 'Cet écran arrive très bientôt ✨'} />
    </GlassCard>
  );
}
