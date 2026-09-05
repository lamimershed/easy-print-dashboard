import { Check, Loader2, Minus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatPaise } from '@/utils/format-money';
import type { TClientPlan } from '../types';

export type TPlanId = TClientPlan;
/** The tiers a shop can actually buy. FREE is where you land, not what you pick. */
export type TPayablePlanId = Exclude<TClientPlan, 'FREE'>;

export const PLANS: Array<{
  id: TPlanId;
  name: string;
  pricePaise: number;
  tagline: string;
  /** The headline that decides the plan — rendered under the price. */
  commissionLabel: string;
  features: string[];
  /** Things this tier notably does not include, so the comparison is honest. */
  limitations?: string[];
}> = [
  {
    id: 'FREE',
    name: 'Free',
    pricePaise: 0,
    tagline: 'What you fall back to when no plan is active',
    commissionLabel: '30% commission on every job',
    features: ['Unlimited print sessions', 'Online payment collection', 'Basic analytics'],
    limitations: ['Cannot collect at the counter', 'Highest commission of any plan'],
  },
  {
    id: 'PARTNER',
    name: 'Partner',
    pricePaise: 50_000,
    tagline: 'Low monthly fee, and we take a much smaller share',
    commissionLabel: '+ 10% commission on every job',
    features: [
      'Commission cut from 30% to 10%',
      'Full analytics history',
      'Priority support',
      'Automatic payouts to your account',
    ],
    limitations: ['Cannot collect at the counter'],
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    pricePaise: 150_000,
    tagline: 'Flat fee — every rupee your customers pay is yours',
    commissionLabel: 'No commission. 0% on every job.',
    features: [
      'Everything in Partner',
      '4,000 prints included each month',
      'Switch off platform collection and take payment at your counter',
      'Dedicated onboarding',
    ],
  },
];

type TPlanCardProps = {
  plan: (typeof PLANS)[number];
  currentPlan: TPlanId;
  /** True while the shop is trialing this plan rather than paying for it. */
  isTrialing?: boolean;
  onChoose: (plan: TPayablePlanId) => void;
  isPending: boolean;
};

export function PlanCard({
  plan,
  currentPlan,
  isTrialing = false,
  onChoose,
  isPending,
}: TPlanCardProps) {
  const isCurrent = plan.id === currentPlan;
  const isFree = plan.id === 'FREE';
  const isBusiness = plan.id === 'BUSINESS';

  return (
    <Card
      className={cn(
        'relative h-full',
        isCurrent && 'border-primary/40 bg-primary/[0.03]',
        isBusiness && !isCurrent && 'border-primary/20'
      )}
    >
      {isCurrent && (
        <Badge className="absolute top-4 right-4" variant="secondary">
          {isTrialing ? 'On trial' : 'Current plan'}
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {isBusiness && <Sparkles className="size-4 text-primary" />}
          {plan.name}
        </CardTitle>
        <CardDescription>{plan.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tabular-nums">
              {isFree ? 'Free' : formatPaise(plan.pricePaise)}
            </span>
            {!isFree && <span className="text-xs text-muted-foreground">/ month</span>}
          </div>
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              isBusiness ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {plan.commissionLabel}
          </p>
        </div>

        <ul className="flex flex-1 flex-col gap-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
          {plan.limitations?.map((limitation) => (
            <li
              key={limitation}
              className="flex items-start gap-2 text-sm text-muted-foreground/70"
            >
              <Minus className="mt-0.5 size-3.5 shrink-0" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>

        {!isFree && (!isCurrent || isTrialing) && (
          <Button
            className="w-full"
            disabled={isPending}
            onClick={() => onChoose(plan.id as TPayablePlanId)}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isCurrent && isTrialing
              ? `Subscribe to ${plan.name}`
              : currentPlan === 'BUSINESS'
                ? 'Switch to this plan'
                : `Upgrade to ${plan.name}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
