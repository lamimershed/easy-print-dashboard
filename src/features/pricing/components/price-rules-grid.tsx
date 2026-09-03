import { useMemo, useState } from 'react';
import { Layers, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RupeeInput } from './rupee-input';
import { PriceTierEditor } from './price-tier-editor';
import { formatPaise } from '@/utils/format-money';
import { COLOR_MODES, PAPER_SIZES, type TPriceRule, type TPriceTier } from '../types';

type TPriceRulesGridProps = {
  rules: TPriceRule[];
  onChange: (rules: TPriceRule[]) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
};

const key = (rule: { paperSize: string; colorMode: string }) =>
  `${rule.paperSize}:${rule.colorMode}`;

/**
 * The full paper-size × colour grid, saved as one unit.
 *
 * Every combination is always shown, even ones the shop has not switched on —
 * a size that is missing from the grid is indistinguishable from a size the
 * shop chose not to sell, and only one of those is fixable by the shop.
 */
export function PriceRulesGrid({
  rules,
  onChange,
  onSave,
  isSaving,
  isDirty,
}: TPriceRulesGridProps) {
  const [editingTiersFor, setEditingTiersFor] = useState<string | null>(null);

  const byKey = useMemo(() => new Map(rules.map((rule) => [key(rule), rule])), [rules]);

  const resolve = (paperSize: string, colorMode: string): TPriceRule =>
    byKey.get(`${paperSize}:${colorMode}`) ?? {
      paperSize: paperSize as TPriceRule['paperSize'],
      colorMode: colorMode as TPriceRule['colorMode'],
      pricePerSheetPaise: 0,
      isActive: false,
      tiers: [],
    };

  const patch = (paperSize: string, colorMode: string, changes: Partial<TPriceRule>) => {
    const existing = byKey.get(`${paperSize}:${colorMode}`);
    const next = { ...resolve(paperSize, colorMode), ...changes };

    onChange(
      existing ? rules.map((rule) => (key(rule) === key(next) ? next : rule)) : [...rules, next]
    );
  };

  const activeCount = rules.filter((rule) => rule.isActive).length;
  const editingRule = editingTiersFor ? (byKey.get(editingTiersFor) ?? null) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Price per sheet</CardTitle>
            <CardDescription>
              What you charge for one printed sheet. Double-sided pages share a sheet.
            </CardDescription>
          </div>

          <Button onClick={onSave} disabled={!isDirty || isSaving || activeCount === 0} size="sm">
            {isSaving ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-3.5" />
            )}
            Save prices
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {activeCount === 0 && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            Every option is switched off, so customers cannot order anything. Turn at least one on.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Paper
                </th>
                {COLOR_MODES.map((mode) => (
                  <th
                    key={mode.value}
                    className="py-2 pr-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {mode.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {PAPER_SIZES.map((size) => (
                <tr key={size.value} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{size.label}</span>
                      <span className="text-[11px] text-muted-foreground">{size.hint}</span>
                    </div>
                  </td>

                  {COLOR_MODES.map((mode) => {
                    const rule = resolve(size.value, mode.value);
                    const cellKey = `${size.value}:${mode.value}`;

                    return (
                      <td key={mode.value} className="py-3 pr-4 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={(isActive) =>
                                patch(size.value, mode.value, { isActive })
                              }
                              aria-label={`Offer ${size.label} ${mode.label}`}
                            />
                            <RupeeInput
                              valuePaise={rule.pricePerSheetPaise}
                              onChangePaise={(pricePerSheetPaise) =>
                                patch(size.value, mode.value, { pricePerSheetPaise })
                              }
                              disabled={!rule.isActive}
                              className={cn('w-28', !rule.isActive && 'opacity-50')}
                              aria-label={`${size.label} ${mode.label} price per sheet`}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={!rule.isActive}
                            onClick={() => setEditingTiersFor(cellKey)}
                            className="flex items-center gap-1 text-left text-[11px] text-muted-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Layers className="size-3" />
                            {rule.tiers.length > 0 ? (
                              <span className="flex items-center gap-1">
                                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                  {rule.tiers.length}
                                </Badge>
                                volume discount{rule.tiers.length === 1 ? '' : 's'}
                              </span>
                            ) : (
                              'Add volume discount'
                            )}
                          </button>

                          {rule.isActive && rule.tiers.length > 0 && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {rule.tiers
                                .slice()
                                .sort((a, b) => a.minSheets - b.minSheets)
                                .map(
                                  (t) => `${t.minSheets}+ → ${formatPaise(t.pricePerSheetPaise)}`
                                )
                                .join(' · ')}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <PriceTierEditor
        rule={editingRule}
        onClose={() => setEditingTiersFor(null)}
        onSave={(tiers: TPriceTier[]) => {
          if (!editingRule) return;
          patch(editingRule.paperSize, editingRule.colorMode, { tiers });
        }}
      />
    </Card>
  );
}
