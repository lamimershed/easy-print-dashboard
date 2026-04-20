import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const SecondaryButton = ({ className, ...props }: React.ComponentProps<typeof Button>) => (
  <Button
    variant="outline"
    className={cn(
      'border-[#C0C5CB] bg-background text-foreground hover:bg-accent dark:border-[#E8E8E8]/16',
      className
    )}
    {...props}
  />
);
