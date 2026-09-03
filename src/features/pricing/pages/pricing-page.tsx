import { useState } from 'react';
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { pricingService } from '../services';
import {
  PriceAddonsList,
  PriceRevisions,
  PriceRulesGrid,
  PriceSettingsCard,
  PricePreviewCard,
} from '../components';
import type { TPriceList, TPriceRule } from '../types';

export default function PricingPage() {
  const { data: list, isLoading } = pricingService.useGetPriceList();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Pricing</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          What you charge customers — per sheet, in volume, and for extras.
        </p>
      </div>

      {isLoading || !list ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-[420px] w-full rounded-xl" />
          <Skeleton className="h-[420px] w-full rounded-xl" />
        </div>
      ) : (
        // Remounting on every saved version is what keeps the editors' local
        // drafts honest: a save produces a new version, which produces fresh
        // initial state.
        <PricingEditor key={list.version} list={list} />
      )}
    </div>
  );
}

function PricingEditor({ list }: { list: TPriceList }) {
  const updateRules = pricingService.useUpdateRules();

  // The grid is edited locally and saved as a unit, so a half-finished edit is
  // never what customers are charged.
  const [draftRules, setDraftRules] = useState<TPriceRule[]>(list.rules);

  const isDirty = JSON.stringify(draftRules) !== JSON.stringify(list.rules);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Changing a price only affects orders placed{' '}
          <strong className="text-foreground">after</strong> you save. Anything already paid for
          keeps the price the customer agreed to.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <PriceRulesGrid
            rules={draftRules}
            onChange={setDraftRules}
            onSave={() => updateRules.mutate(draftRules)}
            isSaving={updateRules.isPending}
            isDirty={isDirty}
          />
          <PriceSettingsCard list={list} />
          <PriceAddonsList addons={list.addons} />
          <PriceRevisions />
        </div>

        <div className="min-w-0">
          <PricePreviewCard addons={list.addons} />
        </div>
      </div>
    </div>
  );
}
