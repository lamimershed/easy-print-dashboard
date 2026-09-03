import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RupeeInput } from './rupee-input';
import { pricingService } from '../services';
import { ROUNDING_MODES, type TPriceList, type TRoundingMode } from '../types';

export function PriceSettingsCard({ list }: { list: TPriceList }) {
  const updateSettings = pricingService.useUpdateSettings();

  // The parent remounts this on every saved version, so the initial values are
  // always current and there is no prop-to-state sync to get wrong.
  const [minChargePaise, setMinChargePaise] = useState(list.minChargePaise);
  const [duplexDiscountPercent, setDuplexDiscountPercent] = useState(list.duplexDiscountPercent);
  const [roundingMode, setRoundingMode] = useState<TRoundingMode>(list.roundingMode);

  const isDirty =
    minChargePaise !== list.minChargePaise ||
    duplexDiscountPercent !== list.duplexDiscountPercent ||
    roundingMode !== list.roundingMode;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Rules that apply to every job</CardTitle>
            <CardDescription>Minimum charge, double-sided discount and rounding.</CardDescription>
          </div>

          <Button
            size="sm"
            disabled={!isDirty || updateSettings.isPending}
            onClick={() =>
              updateSettings.mutate({ minChargePaise, duplexDiscountPercent, roundingMode })
            }
          >
            {updateSettings.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-3.5" />
            )}
            Save
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Minimum charge</Label>
          <RupeeInput valuePaise={minChargePaise} onChangePaise={setMinChargePaise} />
          <span className="text-[11px] text-muted-foreground">
            Applies to the printing itself. Extras are added on top of it.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Double-sided discount</Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={duplexDiscountPercent}
              onChange={(event) =>
                setDuplexDiscountPercent(
                  Math.min(100, Math.max(0, Number(event.target.value) || 0))
                )
              }
              className="pr-7 text-right tabular-nums"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            On top of already halving the sheet count.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Round the total</Label>
          <Select value={roundingMode} onValueChange={(v) => setRoundingMode(v as TRoundingMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUNDING_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-muted-foreground">
            {ROUNDING_MODES.find((m) => m.value === roundingMode)?.hint}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
