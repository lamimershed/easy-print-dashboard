import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  accent?: 'green' | 'red' | 'neutral';
  animationDelay?: string;
  successRate?: number;
  subtext?: string;
  className?: string;
}

const CIRCUMFERENCE = 2 * Math.PI * 14;

export function StatCard({
  title,
  value,
  icon: Icon,
  accent = 'neutral',
  animationDelay,
  successRate,
  subtext,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'h-full animate-in duration-500 fill-mode-forwards fade-in slide-in-from-bottom-2',
        animationDelay
      )}
    >
      <Card
        className={cn(
          'relative h-full overflow-hidden',
          accent === 'green' && 'border-primary/20',
          accent === 'red' && 'border-destructive/20',
          className
        )}
      >
        <Icon
          className={cn(
            'pointer-events-none absolute -right-3 -bottom-3 size-28 opacity-[0.06]',
            accent === 'green' && 'text-primary',
            accent === 'red' && 'text-destructive',
            accent === 'neutral' && 'text-foreground'
          )}
        />
        <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-2">
          <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </CardTitle>
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              accent === 'green' && 'bg-primary/10',
              accent === 'red' && 'bg-destructive/10',
              accent === 'neutral' && 'bg-muted'
            )}
          >
            <Icon
              className={cn(
                'size-4',
                accent === 'green' && 'text-primary',
                accent === 'red' && 'text-destructive',
                accent === 'neutral' && 'text-muted-foreground'
              )}
            />
          </div>
        </CardHeader>
        <CardContent className="px-5 pt-1 pb-5">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-black tracking-tight text-foreground">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {successRate !== undefined && (
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                className="mb-0.5 shrink-0"
                aria-hidden="true"
              >
                <circle
                  cx="20"
                  cy="20"
                  r="14"
                  fill="none"
                  strokeWidth="3"
                  className="stroke-muted"
                  opacity="0.5"
                />
                <g transform="rotate(-90 20 20)">
                  <circle
                    cx="20"
                    cy="20"
                    r="14"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="stroke-primary"
                    strokeDasharray={`${(successRate / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  />
                </g>
                <text
                  x="20"
                  y="20"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  className="fill-foreground"
                >
                  {successRate}
                </text>
              </svg>
            )}
          </div>
          {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
