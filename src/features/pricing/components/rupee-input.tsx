import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type TRupeeInputProps = {
  /** Value in paise — the only unit that crosses the wire. */
  valuePaise: number;
  onChangePaise: (paise: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  'aria-label'?: string;
};

/**
 * Money is stored in paise and typed in rupees. Nobody wants to enter `250` to
 * mean ₹2.50, so the conversion happens here and nowhere else.
 *
 * Keeps its own draft string while focused so a half-typed "2." is not
 * destroyed by a round-trip through Number().
 */
export function RupeeInput({
  valuePaise,
  onChangePaise,
  disabled,
  className,
  placeholder,
  ...rest
}: TRupeeInputProps) {
  // Only the in-flight edit is state. The committed value is always derived
  // from the prop, so there is nothing to keep in sync.
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (valuePaise / 100).toFixed(2);

  const commit = (raw: string) => {
    const rupees = Number(raw);
    // Round to whole paise — a shop cannot charge a fraction of one.
    if (!Number.isNaN(rupees) && rupees >= 0) onChangePaise(Math.round(rupees * 100));
    setDraft(null);
  };

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>
      <Input
        {...rest}
        inputMode="decimal"
        disabled={disabled}
        placeholder={placeholder}
        value={display}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        className="pl-7 text-right tabular-nums"
      />
    </div>
  );
}
