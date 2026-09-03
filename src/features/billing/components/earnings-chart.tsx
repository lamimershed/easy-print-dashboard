import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { formatPaise, formatPaiseCompact } from '@/utils/format-money';
import type { TEarningsPoint } from '../types';

const chartConfig = {
  grossPaise: { label: 'Gross', color: 'var(--chart-1)' },
  netPaise: { label: 'Net earnings', color: 'var(--chart-2)' },
  refundedPaise: { label: 'Refunded', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const SERIES = Object.entries(chartConfig) as Array<
  [keyof typeof chartConfig, { label: string; color: string }]
>;

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/**
 * Money tooltip — the shared one prints raw values, which for paise would read
 * as "12000" where the axis says "₹120".
 */
function EarningsTooltip({ label, payload }: TooltipProps<number, string>) {
  if (!payload?.length) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs shadow-lg">
      <div className="text-muted-foreground">
        {new Date(String(label)).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
      </div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={String(item.dataKey)} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex size-2.5 rounded-full"
                style={{ backgroundColor: item.color ?? 'var(--chart-1)' }}
              />
              <span className="text-muted-foreground">
                {chartConfig[item.dataKey as keyof typeof chartConfig]?.label ?? item.name}
              </span>
            </div>
            <span className="font-semibold text-foreground tabular-nums">
              {formatPaise(Number(item.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EarningsChart({ series }: { series: TEarningsPoint[] }) {
  const hasData = series.some((p) => p.grossPaise > 0 || p.refundedPaise > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">Earnings over time</CardTitle>

          <div className="flex items-center gap-4">
            {SERIES.map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="inline-flex size-2.5 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No payments in this period yet.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart data={series} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <defs>
                {SERIES.map(([key, cfg]) => (
                  <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cfg.color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={cfg.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={shortDate}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={(value: number) => formatPaiseCompact(value)}
                className="text-xs tabular-nums"
              />

              <ChartTooltip content={<EarningsTooltip />} />

              {SERIES.map(([key, cfg]) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="monotone"
                  stroke={cfg.color}
                  fill={`url(#fill-${key})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
