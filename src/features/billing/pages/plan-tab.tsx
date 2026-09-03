import { AlertTriangle, CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { profileService } from '@/features/profile/services';
import { billingService } from '../services';
import { useRazorpayCheckout } from '../hooks/use-razorpay-checkout';
import { PLANS, PlanCard, type TPlanId } from '../components';
import { formatDate } from '@/utils/format-money';

export function PlanTab() {
  const { data: profile, isLoading } = profileService.useGetMe();
  const { data: subscription } = billingService.useGetSubscription();

  const createOrder = billingService.useCreateSubscriptionOrder();
  const verify = billingService.useVerifySubscription();
  const cancel = billingService.useCancelSubscription();
  const resume = billingService.useResumeSubscription();
  const { open } = useRazorpayCheckout();

  const currentPlan: TPlanId = profile?.plan ?? 'FREE';

  const choosePlan = (plan: 'STARTER' | 'PRO') => {
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

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  return (
    <div className="flex flex-col gap-5">
      {subscription && (
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

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            onChoose={choosePlan}
            isPending={createOrder.isPending || verify.isPending}
          />
        ))}
      </div>
    </div>
  );
}
