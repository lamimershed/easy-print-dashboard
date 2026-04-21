import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardVariant = 'green' | 'white' | 'lime';

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel: string;
  SubIcon: LucideIcon;
  DecorIcon: LucideIcon;
  variant?: StatCardVariant;
  isLoading?: boolean;
}

const variantStyles: Record<
  StatCardVariant,
  { wrapper: string; label: string; value: string; sub: string; decor: string; iconBg: string }
> = {
  green: {
    wrapper: 'bg-primary/10',
    label: 'text-primary uppercase tracking-widest text-sm font-bold',
    value: 'text-primary',
    sub: 'text-primary/80',
    decor: 'text-primary/10',
    iconBg: '',
  },
  white: {
    wrapper: 'bg-card shadow-card-soft',
    label: 'text-muted-foreground uppercase tracking-widest text-sm font-bold',
    value: 'text-foreground',
    sub: 'text-primary',
    decor: 'text-muted/60',
    iconBg: '',
  },
  lime: {
    wrapper: 'bg-lime-200 dark:bg-lime-900',
    label: 'text-lime-800 dark:text-lime-200 uppercase tracking-widest text-sm font-bold',
    value: 'text-lime-900 dark:text-lime-100',
    sub: 'text-lime-800/80 dark:text-lime-300',
    decor: 'text-lime-800/10 dark:text-lime-200/10',
    iconBg: 'bg-lime-800/10 dark:bg-lime-200/10',
  },
};

export function StatCard({
  label,
  value,
  subLabel,
  SubIcon,
  DecorIcon,
  variant = 'white',
  isLoading = false,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn('group relative overflow-hidden rounded-xl p-8', styles.wrapper)}>
      <div className="relative z-10">
        <span className={styles.label}>{label}</span>
        {isLoading ? (
          <div className="mt-4 mb-2 h-12 w-24 animate-pulse rounded-lg bg-current opacity-10" />
        ) : (
          <div className={cn('mt-4 mb-2 text-5xl font-black', styles.value)}>{value}</div>
        )}
        <div className={cn('flex items-center gap-1 text-sm font-semibold', styles.sub)}>
          <SubIcon className="size-4 shrink-0" />
          <span>{subLabel}</span>
        </div>
      </div>
      {variant === 'lime' && (
        <div
          className={cn(
            'absolute top-8 right-8 flex h-16 w-16 items-center justify-center rounded-full',
            styles.iconBg
          )}
        >
          <DecorIcon className={cn('size-7', styles.value)} />
        </div>
      )}
      {variant !== 'lime' && (
        <DecorIcon
          className={cn(
            'absolute -right-4 -bottom-4 size-36 transition-transform group-hover:scale-110',
            styles.decor
          )}
        />
      )}
    </div>
  );
}
