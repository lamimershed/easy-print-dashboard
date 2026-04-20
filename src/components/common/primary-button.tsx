import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const PrimaryButton = ({ className, ...props }: React.ComponentProps<typeof Button>) => (
  <Button
    className={cn(
      'bg-linear-to-br from-[#2267E6] to-[#FF2F2F] px-4 py-4 text-white hover:opacity-90 hover:brightness-105',
      className
    )}
    {...props}
  />
);
