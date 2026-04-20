import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const ToggleSwitch = ({ className, ...props }: React.ComponentProps<typeof Switch>) => (
  <Switch
    className={cn('data-[state=checked]:bg-[#b85465] data-[state=unchecked]:bg-input', className)}
    {...props}
  />
);
