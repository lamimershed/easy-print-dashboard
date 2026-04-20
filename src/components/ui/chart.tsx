'use client';

import * as React from 'react';
import { ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
};

const ChartContainer = ({ config, className, children, ...props }: ChartContainerProps) => {
  const style = React.useMemo(() => {
    const cssVars = Object.entries(config).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value?.color) {
        acc[`--color-${key}`] = value.color;
      }
      return acc;
    }, {});
    return cssVars;
  }, [config]);

  return (
    <div className={cn('w-full', className)} style={style} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
};

const ChartTooltip = Tooltip;

const ChartTooltipContent = ({
  label,
  payload,
  indicator = 'dot',
}: TooltipProps<number, string> & { indicator?: 'dot' | 'line' }) => {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs shadow-lg">
      <div className="text-muted-foreground">{label}</div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div
            key={`${item.dataKey}-${item.value}`}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-2.5 w-2.5 rounded-full',
                  indicator === 'line' && 'h-0.5 w-4 rounded-full'
                )}
                style={{ backgroundColor: item.color ?? 'var(--chart-1)' }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ChartContainer, ChartTooltip, ChartTooltipContent };
