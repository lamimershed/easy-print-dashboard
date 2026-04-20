import * as React from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DownloadExcelButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
}

export const DownloadExcelButton = ({
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: DownloadExcelButtonProps) => (
  <Button
    disabled={isLoading || disabled}
    className={cn(
      'relative h-8 gap-1.5 overflow-hidden px-3 text-xs font-semibold text-white',
      'bg-gradient-to-r from-[#1D6F42] to-[#217346]',
      'shadow-[0_0_0_1px_#1D6F42] hover:shadow-[0_0_8px_2px_#1D6F4255] hover:brightness-110',
      'transition-all duration-200',
      'disabled:from-[#1D6F42]/50 disabled:to-[#217346]/50 disabled:shadow-none',
      className
    )}
    {...props}
  >
    {isLoading ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : (
      <FileSpreadsheet className="h-3.5 w-3.5" />
    )}

    <span>{isLoading ? 'Exporting…' : (children ?? 'Export Excel')}</span>

    {/* XLS badge */}
    {!isLoading && (
      <span className="ml-0.5 rounded-[3px] bg-white/20 px-1 py-px text-[9px] leading-tight font-bold tracking-wide">
        XLS
      </span>
    )}
  </Button>
);
