import { History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { pricingService } from '../services';
import { formatDateTime } from '@/utils/format-money';

/**
 * A price change moves money on every future order, so who changed what and
 * when is worth keeping in front of the shop owner rather than in a log.
 */
export function PriceRevisions() {
  const { data: revisions, isLoading } = pricingService.useGetRevisions();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <History className="size-4 text-muted-foreground" />
          Change history
        </CardTitle>
        <CardDescription>Every save is recorded with what changed.</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !revisions?.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No changes yet.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {revisions.map((revision) => (
              <li key={revision.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] tabular-nums">
                  v{revision.version}
                </Badge>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium">
                    {revision.summary ?? 'Prices updated'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(revision.createdAt)}
                    {revision.changedBy === 'system' ? ' · automatic' : ''}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
