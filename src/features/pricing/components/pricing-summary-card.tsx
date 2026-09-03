import { Link } from 'react-router';
import { ArrowRight, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPaise } from '@/utils/format-money';
import { pricingService } from '../services';

/**
 * Read-only glance at what the shop charges, shown alongside its earnings.
 *
 * Pricing lives in its own section now, but "what I charge" and "what I earned"
 * belong in the same field of view — so Billing keeps a summary that links
 * across rather than duplicating the editor.
 */
export function PricingSummaryCard() {
  const { data: list, isLoading } = pricingService.useGetPriceList();

  if (isLoading) return <Skeleton className="h-[168px] w-full rounded-xl" />;
  if (!list) return null;

  const active = list.rules.filter((rule) => rule.isActive);
  const cheapest = active.reduce<number | null>(
    (min, rule) =>
      min === null ? rule.pricePerSheetPaise : Math.min(min, rule.pricePerSheetPaise),
    null
  );
  const activeAddons = list.addons.filter((addon) => addon.isActive);
  const withTiers = active.filter((rule) => rule.tiers.length > 0).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Tag className="size-4 text-muted-foreground" />
            Your prices
          </CardTitle>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] tabular-nums">
            v{list.version}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Figure label="From" value={cheapest === null ? '—' : `${formatPaise(cheapest)}/sheet`} />
          <Figure label="Options on" value={`${active.length}`} />
          <Figure label="Minimum" value={formatPaise(list.minChargePaise)} />
          {activeAddons.length > 0 && <Figure label="Extras" value={`${activeAddons.length}`} />}
          {withTiers > 0 && <Figure label="Volume discounts" value={`${withTiers}`} />}
        </div>

        <Link
          to="/pricing"
          className="flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          Change prices
          <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
    </div>
  );
}
