import { cn } from '@/lib/utils';
import { profileService } from '@/features/profile/services';
import { Skeleton } from '@/components/ui/skeleton';

export function AppTopbar() {
  const { data: profile, isLoading } = profileService.useGetMe();

  const displayName = profile?.companyName ?? 'Easy Print';
  const displayEmail = '';

  return (
    <header
      className={cn(
        'relative flex h-14 w-full items-center gap-4 rounded-3xl bg-card px-4 transition-all duration-300 ease-in-out md:h-16'
      )}
    >
      <div className="flex items-center gap-2 text-foreground">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden flex-col items-start leading-none sm:flex">
          {isLoading ? (
            <>
              <Skeleton className="mb-1 h-3 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </>
          ) : (
            <>
              <span className="text-xs font-bold text-foreground">{displayName}</span>
              {displayEmail && (
                <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                  {displayEmail}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1" />
    </header>
  );
}
