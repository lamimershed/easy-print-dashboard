import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const ErrorBlock = ({ message, children }: { message?: string; children?: ReactNode }) => {
  return (
    <div
      className={cn(
        message &&
          '[&_[role=combobox]]:border-destructive [&_button]:border-destructive [&_input]:border-destructive'
      )}
    >
      {children}
      <p className="mt-0.5 h-6 text-xs text-destructive">{message ?? ''}</p>
    </div>
  );
};
export default ErrorBlock;
