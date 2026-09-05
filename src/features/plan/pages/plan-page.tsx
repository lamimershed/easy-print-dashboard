import { AlertTriangle, CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/format-money';
import { planService } from '../services';
import { useRazorpayCheckout } from '../hooks/use-razorpay-checkout';
import {
  CollectionModeCard,
  PLANS,
  PlanCard,
  PrintQuotaCard,
  TrialBanner,
  type TPayablePlanId,
} from '../components';

export function PlanPage() {
  // One call carries plan, trial countdown, quota and collection mode, so these
  // never disagree with each other the way separate queries would.
  const { data: entitlements, isLoading } = planService.useGetEntitlements();

  const createOrder = planService.useCreateSubscriptionOrder();
  const verify = planService.useVerifySubscription();
  const cancel = planService.useCancelSubscription();
  const resume = planService.useResumeSubscription();
  const startTrial = planService.useStartTrial();
  const setCollectionMode = planService.useSetCollectionMode();
  const { open } = useRazorpayCheckout();

  const choosePlan = (plan: TPayablePlanId) => {
    createOrder.mutate(plan, {
      onSuccess: async (order) => {
        try {
          await open({
            keyId: order.razorpayKeyId,
            orderId: order.orderId,
            amountPaise: order.amountPaise,
            currency: order.currency,
            name: order.shopName,
            description: `${plan} plan — monthly`,
            onSuccess: (response) => verify.mutate(response),
            onFailed: (response) =>
              toast.error(response.error?.description ?? 'The payment was declined.'),
          });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Could not open the payment window.');
        }
      },
    });
  };

  if (isLoading || !entitlements) return <Skeleton className="h-72 w-full rounded-xl" />;

  const { plan: currentPlan, subscription, isTrial, usage } = entitlements;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Plan</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          What you pay us, what it includes, and how you take payment.
        </p>
      </div>

      <TrialBanner
        entitlements={entitlements}
        onStartTrial={() => startTrial.mutate()}
        isStarting={startTrial.isPending}
      />

      {/* A trial has its own banner and no renewal date to manage. */}
      {subscription && !isTrial && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Your subscription</CardTitle>
            <CardDescription>
              {subscription.cancelAtPeriodEnd
                ? 'Scheduled to end — you keep access until the date below.'
                : 'Renews automatically each month.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              <span className="text-sm">
                {subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                <span className="font-semibold">{formatDate(subscription.currentPeriodEnd)}</span>
              </span>
            </div>

            {subscription.cancelAtPeriodEnd ? (
              <Button
                variant="outline"
                size="sm"
                disabled={resume.isPending}
                onClick={() => resume.mutate()}
              >
                {resume.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                Keep my plan
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                Cancel at period end
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!subscription && currentPlan !== 'FREE' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span className="text-xs">
            You are on the {currentPlan} plan without an active subscription record. Renew below to
            put it on a monthly cycle.
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Only rendered when the plan actually includes an allowance. */}
        {usage?.includedSheets ? <PrintQuotaCard usage={usage} /> : null}
        <CollectionModeCard
          entitlements={entitlements}
          onChange={(enabled) => setCollectionMode.mutate(enabled)}
          isPending={setCollectionMode.isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            isTrialing={isTrial && plan.id === currentPlan}
            onChoose={choosePlan}
            isPending={createOrder.isPending || verify.isPending}
          />
        ))}
      </div>
    </div>
  );
}
