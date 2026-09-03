import { useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pricingService } from '../services';
import { formatPaise } from '@/utils/format-money';
import {
  COLOR_MODES,
  PAPER_SIZES,
  type TColorMode,
  type TPaperSize,
  type TPriceAddon,
} from '../types';

/**
 * The live calculator.
 *
 * Typing paise into a grid tells a shop owner nothing about what a real job
 * costs. This prices a job they recognise, through the same engine the customer
 * hits, and shows the identical breakdown — so the grid stops being a form and
 * starts being a tool.
 */
export function PricePreviewCard({ addons }: { addons: TPriceAddon[] }) {
  const [pageCount, setPageCount] = useState(20);
  const [copies, setCopies] = useState(2);
  const [paperSize, setPaperSize] = useState<TPaperSize>('A4');
  const [colorMode, setColorMode] = useState<TColorMode>('blackwhite');
  const [duplex, setDuplex] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const input = {
    pageCount,
    copies,
    paperSize,
    colorMode,
    duplex: duplex ? ('longEdge' as const) : ('simplex' as const),
    addonIds: selectedAddons,
  };

  const { data: quote, isFetching, error } = pricingService.usePreview(input);
  const b = quote?.breakdown;

  const activeAddons = addons.filter((addon) => addon.isActive);

  const toggleAddon = (id: string, checked: boolean) =>
    setSelectedAddons((current) =>
      checked ? [...current, id] : current.filter((existing) => existing !== id)
    );

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Calculator className="size-4 text-primary" />
          What a customer pays
        </CardTitle>
        <CardDescription>Priced by the same engine the customer’s app uses.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Pages</Label>
            <Input
              type="number"
              min={1}
              value={pageCount}
              onChange={(event) => setPageCount(Math.max(1, Number(event.target.value) || 1))}
              className="tabular-nums"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Copies</Label>
            <Input
              type="number"
              min={1}
              value={copies}
              onChange={(event) => setCopies(Math.max(1, Number(event.target.value) || 1))}
              className="tabular-nums"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Paper</Label>
            <Select value={paperSize} onValueChange={(v) => setPaperSize(v as TPaperSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPER_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Colour</Label>
            <Select value={colorMode} onValueChange={(v) => setColorMode(v as TColorMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <Label className="text-xs">Double-sided</Label>
          <Switch checked={duplex} onCheckedChange={setDuplex} />
        </div>

        {activeAddons.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Extras</Label>
            {activeAddons.map((addon) => (
              <label key={addon.id} className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={selectedAddons.includes(addon.id)}
                  onCheckedChange={(checked) => toggleAddon(addon.id, checked === true)}
                />
                <span className="text-xs">{addon.name}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {formatPaise(addon.pricePaise)}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* ── Result ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          {error ? (
            <p className="text-xs text-destructive">
              This combination has no price yet. Switch it on in the grid.
            </p>
          ) : !b ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Pricing…
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Row
                label={`${b.totalSheets} sheet${b.totalSheets === 1 ? '' : 's'} × ${formatPaise(b.perSheetPaise)}`}
                value={formatPaise(b.subtotalPaise)}
              />

              {b.tierMinSheets !== null && (
                <Note>
                  Volume discount applied from {b.tierMinSheets} sheets — down from{' '}
                  {formatPaise(b.basePerSheetPaise)} a sheet.
                </Note>
              )}

              {b.duplexDiscountPaise > 0 && (
                <Row
                  label="Double-sided discount"
                  value={`− ${formatPaise(b.duplexDiscountPaise)}`}
                />
              )}

              {b.minChargeApplied && <Note>Your minimum charge set the print price.</Note>}

              {b.addons.map((addon) => (
                <Row
                  key={addon.id}
                  label={`${addon.name}${addon.quantity > 1 ? ` × ${addon.quantity}` : ''}`}
                  value={formatPaise(addon.totalPaise)}
                />
              ))}

              {b.roundingAdjustmentPaise !== 0 && (
                <Row
                  label="Rounding"
                  value={`${b.roundingAdjustmentPaise > 0 ? '+' : '−'} ${formatPaise(Math.abs(b.roundingAdjustmentPaise))}`}
                />
              )}

              <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2">
                <span className="text-sm font-semibold">Customer pays</span>
                <span className="text-2xl font-black text-primary tabular-nums">
                  {formatPaise(quote.totalPaise)}
                  {isFetching && <Loader2 className="ml-2 inline size-3 animate-spin" />}
                </span>
              </div>

              <div className="mt-1 flex flex-col gap-1 border-t border-border pt-2">
                <Row
                  label="Platform commission"
                  value={`− ${formatPaise(quote.commissionPaise)}`}
                />
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-foreground">You keep</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {formatPaise(quote.payoutPaise)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground italic">{children}</p>;
}
