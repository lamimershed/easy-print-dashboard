import { RefundsTable } from '../components';

export function RefundsTab() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Refunds</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Refunds you issued, plus the automatic ones raised when a paid job could not be printed.
        </p>
      </div>

      <RefundsTable />
    </div>
  );
}
