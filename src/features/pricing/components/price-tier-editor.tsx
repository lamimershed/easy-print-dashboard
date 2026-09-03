import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RupeeInput } from './rupee-input';
import { formatPaise } from '@/utils/format-money';
import type { TPriceRule, TPriceTier } from '../types';

type TPriceTierEditorProps = {
  rule: TPriceRule | null;
  onClose: () => void;
  onSave: (tiers: TPriceTier[]) => void;
};

/**
 * Volume bands for one rule.
 *
 * Bands are flat, not graduated — reaching 100 sheets prices all 100 at the
 * band rate. That is how print shops quote, and the copy says so plainly
 * because the alternative reading would cost the shop money.
 */
export function PriceTierEditor({ rule, onClose, onSave }: TPriceTierEditorProps) {
  const tiers = rule?.tiers ?? [];

  const update = (index: number, patch: Partial<TPriceTier>) => {
    onSave(tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
  };

  const add = () => {
    const lastThreshold = tiers.length ? Math.max(...tiers.map((t) => t.minSheets)) : 0;
    const base = rule?.pricePerSheetPaise ?? 100;

    onSave([
      ...tiers,
      {
        minSheets: lastThreshold ? lastThreshold * 2 : 50,
        pricePerSheetPaise: Math.max(0, Math.round(base * 0.8)),
      },
    ]);
  };

  const remove = (index: number) => onSave(tiers.filter((_, i) => i !== index));

  const duplicates = new Set(
    tiers.map((t) => t.minSheets).filter((v, i, arr) => arr.indexOf(v) !== i)
  );

  return (
    <Dialog open={Boolean(rule)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Volume discounts</DialogTitle>
          <DialogDescription>
            {rule
              ? `${rule.paperSize} · ${rule.colorMode === 'color' ? 'Colour' : 'Black & white'} — base rate ${formatPaise(rule.pricePerSheetPaise)} a sheet`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Bands apply to the <strong className="text-foreground">whole job</strong>. A 100-sheet
            job at a “100 sheets” band is charged the band rate for all 100 sheets, not just the
            hundredth.
          </p>

          {tiers.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No volume discounts. Every sheet is charged the base rate.
            </p>
          )}

          {tiers.map((tier, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-xs">From this many sheets</Label>
                <Input
                  type="number"
                  min={2}
                  value={tier.minSheets}
                  onChange={(event) =>
                    update(index, { minSheets: Math.max(2, Number(event.target.value) || 2) })
                  }
                  className="tabular-nums"
                />
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-xs">Price per sheet</Label>
                <RupeeInput
                  valuePaise={tier.pricePerSheetPaise}
                  onChangePaise={(pricePerSheetPaise) => update(index, { pricePerSheetPaise })}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Remove band"
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
          ))}

          {duplicates.size > 0 && (
            <p className="text-xs text-destructive">
              Two bands start at the same number of sheets. Keep one.
            </p>
          )}

          {rule && tiers.some((t) => t.pricePerSheetPaise > rule.pricePerSheetPaise) && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              A band costs more than your base rate — large jobs would be charged more than small
              ones. That is allowed, but check it is what you meant.
            </p>
          )}

          <Button variant="outline" size="sm" onClick={add} className="self-start">
            <Plus className="mr-1.5 size-3.5" />
            Add a band
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={onClose} disabled={duplicates.size > 0}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
