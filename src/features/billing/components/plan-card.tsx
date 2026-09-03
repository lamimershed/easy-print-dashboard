import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatPaise } from '@/utils/format-money';

export type TPlanId = 'FREE' | 'STARTER' | 'PRO';

export const PLANS: Array<{
  id: TPlanId;
  name: string;
  pricePaise: number;
  tagline: string;
  features: string[];
}> = [
  {
    id: 'FREE',
    name: 'Free',
    pricePaise: 0,
    tagline: 'Get started with the essentials',
    features: ['Unlimited print sessions', 'Basic analytics', 'Standard commission rate'],
  },
  {
    id: 'STARTER',
    name: 'Starter',
    pricePaise: 49_900,
    tagline: 'For a busy single-counter shop',
    features: ['Everything in Free', 'Full analytics history', 'Priority support'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    pricePaise: 99_900,
    tagline: 'For multi-printer operations',
    features: ['Everything in Starter', 'Lower commission rate', 'Dedicated onboarding'],
  },
];

type TPlanCardProps = {
  plan: (typeof PLANS)[number];
  currentPlan: TPlanId;
  onChoose: (plan: 'STARTER' | 'PRO') => void;
  isPending: boolean;
};

export function PlanCard({ plan, currentPlan, onChoose, isPending }: TPlanCardProps) {
  const isCurrent = plan.id === currentPlan;
  const isFree = plan.id === 'FREE';

  return (
    <Card className={cn('relative h-full', isCurrent && 'border-primary/40 bg-primary/[0.03]')}>
      {isCurrent && (
        <Badge className="absolute top-4 right-4" variant="secondary">
          Current plan
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {plan.id === 'PRO' && <Sparkles className="size-4 text-primary" />}
          {plan.name}
        </CardTitle>
        <CardDescription>{plan.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black tabular-nums">
            {isFree ? 'Free' : formatPaise(plan.pricePaise)}
          </span>
          {!isFree && <span className="text-xs text-muted-foreground">/ month</span>}
        </div>

        <ul className="flex flex-1 flex-col gap-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {!isFree && !isCurrent && (
          <Button
            className="w-full"
            disabled={isPending}
            onClick={() => onChoose(plan.id as 'STARTER' | 'PRO')}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {currentPlan === 'PRO' ? 'Switch to this plan' : `Upgrade to ${plan.name}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
