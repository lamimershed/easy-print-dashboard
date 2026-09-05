import { useNavigate, useParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EarningsTab } from './earnings-tab';
import { TransactionsTab } from './transactions-tab';
import { PayoutsTab } from './payouts-tab';
import { RefundsTab } from './refunds-tab';
import { PayoutAccountTab } from './payout-account-tab';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'payouts', label: 'Payouts' },
  { value: 'refunds', label: 'Refunds' },
  { value: 'payout-account', label: 'Payout account' },
] as const;

type TTabValue = (typeof TABS)[number]['value'];

const DEFAULT_TAB: TTabValue = 'overview';

/**
 * The tab lives in the URL so a banner elsewhere can deep-link straight to the
 * payout-account form — the fix for held earnings has to be one click away.
 */
export default function BillingPage() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const active = (TABS.find((t) => t.value === tab)?.value ?? DEFAULT_TAB) as TTabValue;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Earnings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Money your customers have paid you — transactions, payouts and refunds.
        </p>
      </div>

      <Tabs
        value={active}
        onValueChange={(value) =>
          navigate(value === DEFAULT_TAB ? '/billing' : `/billing/${value}`)
        }
      >
        <TabsList className="flex w-full flex-wrap justify-start">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <EarningsTab />
        </TabsContent>
        <TabsContent value="transactions" className="mt-5">
          <TransactionsTab />
        </TabsContent>
        <TabsContent value="payouts" className="mt-5">
          <PayoutsTab />
        </TabsContent>
        <TabsContent value="refunds" className="mt-5">
          <RefundsTab />
        </TabsContent>
        <TabsContent value="payout-account" className="mt-5">
          <PayoutAccountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
