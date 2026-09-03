import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RupeeInput } from './rupee-input';
import { pricingService } from '../services';
import { formatPaise } from '@/utils/format-money';
import { ADDON_KINDS, type TAddonKind, type TPriceAddon } from '../types';

const KIND_LABEL: Record<TAddonKind, string> = {
  PER_JOB: 'once per order',
  PER_COPY: 'per copy',
  PER_SHEET: 'per sheet',
};

type TDraft = {
  id?: string;
  name: string;
  description: string;
  kind: TAddonKind;
  pricePaise: number;
};

const EMPTY: TDraft = { name: '', description: '', kind: 'PER_JOB', pricePaise: 0 };

export function PriceAddonsList({ addons }: { addons: TPriceAddon[] }) {
  const createAddon = pricingService.useCreateAddon();
  const updateAddon = pricingService.useUpdateAddon();
  const removeAddon = pricingService.useRemoveAddon();

  const [draft, setDraft] = useState<TDraft | null>(null);

  const active = addons.filter((addon) => addon.isActive);
  const isPending = createAddon.isPending || updateAddon.isPending;

  const save = () => {
    if (!draft || !draft.name.trim()) return;

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      kind: draft.kind,
      pricePaise: draft.pricePaise,
    };

    const onDone = { onSuccess: () => setDraft(null) };

    if (draft.id) updateAddon.mutate({ addonId: draft.id, ...payload }, onDone);
    else createAddon.mutate(payload, onDone);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Extras</CardTitle>
            <CardDescription>
              Binding, lamination, urgent handling — anything charged on top of the printing.
            </CardDescription>
          </div>

          <Button size="sm" variant="outline" onClick={() => setDraft(EMPTY)}>
            <Plus className="mr-1.5 size-3.5" />
            Add an extra
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {active.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No extras yet. Customers will only be charged for printing.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {active.map((addon) => (
              <div key={addon.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{addon.name}</span>
                    <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[10px]">
                      {KIND_LABEL[addon.kind]}
                    </Badge>
                  </div>
                  {addon.description && (
                    <span className="truncate text-xs text-muted-foreground">
                      {addon.description}
                    </span>
                  )}
                </div>

                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatPaise(addon.pricePaise)}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${addon.name}`}
                  onClick={() =>
                    setDraft({
                      id: addon.id,
                      name: addon.name,
                      description: addon.description ?? '',
                      kind: addon.kind,
                      pricePaise: addon.pricePaise,
                    })
                  }
                >
                  <Pencil className="size-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${addon.name}`}
                  disabled={removeAddon.isPending}
                  onClick={() => removeAddon.mutate(addon.id)}
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? 'Edit extra' : 'New extra'}</DialogTitle>
            <DialogDescription>
              Customers pick these when they place an order. The price is frozen onto the order, so
              changing it later never affects one already placed.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input
                  autoFocus
                  placeholder="Spiral binding"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="Plastic comb, up to 200 sheets"
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>How it is charged</Label>
                <Select
                  value={draft.kind}
                  onValueChange={(kind) => setDraft({ ...draft, kind: kind as TAddonKind })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDON_KINDS.map((kind) => (
                      <SelectItem key={kind.value} value={kind.value}>
                        {kind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground">
                  {ADDON_KINDS.find((k) => k.value === draft.kind)?.hint}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Price</Label>
                <RupeeInput
                  valuePaise={draft.pricePaise}
                  onChangePaise={(pricePaise) => setDraft({ ...draft, pricePaise })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={isPending || !draft?.name.trim()}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {draft?.id ? 'Save changes' : 'Add extra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
