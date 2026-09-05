import { Banknote, CreditCard, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TEntitlements } from '../types';

type TCollectionModeCardProps = {
  entitlements: TEntitlements;
  onChange: (gatewayCollectionEnabled: boolean) => void;
  isPending: boolean;
};

/**
 * Switches platform payment collection off so the shop takes money at the
 * counter. Gated on the plan, and shown locked rather than hidden when the shop
 * cannot use it — a feature you cannot see is a feature you never upgrade for.
 */
export function CollectionModeCard({
  entitlements,
  onChange,
  isPending,
}: TCollectionModeCardProps) {
  const { canDisableGateway, gatewayCollectionEnabled } = entitlements;
  const atCounter = !gatewayCollectionEnabled;

  return (
    <Card className={cn(!canDisableGateway && 'opacity-90')}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {atCounter ? (
            <Banknote className="size-4 text-muted-foreground" />
          ) : (
            <CreditCard className="size-4 text-muted-foreground" />
          )}
          How you take payment
        </CardTitle>
        <CardDescription>
          {atCounter
            ? 'Customers pay you directly at the counter. We create no online order.'
            : 'Customers pay online before their job prints, and we settle to your account.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="gateway-collection" className="text-sm font-medium">
              Collect payments through the platform
            </Label>
            <p className="text-xs text-muted-foreground">
              {atCounter
                ? 'Currently off — jobs go straight to your print queue and you collect in person.'
                : 'Currently on — a job only prints once the customer has paid online.'}
            </p>
          </div>

          <Switch
            id="gateway-collection"
            checked={gatewayCollectionEnabled}
            disabled={!canDisableGateway || isPending}
            onCheckedChange={onChange}
          />
        </div>

        {!canDisableGateway && (
          <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Collecting at your counter is a <span className="font-medium">Business</span> plan
              feature. On your current plan we handle collection so we can take our commission from
              each job.
            </span>
          </div>
        )}

        {canDisableGateway && atCounter && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <Banknote className="mt-0.5 size-3.5 shrink-0" />
            <span>
              With this off, a job prints as soon as the customer confirms — before you have the
              money in hand. Take payment at the counter as you hand over the prints. Refunds are
              yours to settle directly; we have no transaction to reverse.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
