import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
type SelectMenuProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
};

export const SelectMenu: React.FC<SelectMenuProps> = ({
  onChange,
  options,
  value,
  placeholder,
  label,
  icon,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Select open={open} onOpenChange={setOpen} value={value} onValueChange={onChange}>
      <div className="relative">
        <SelectTrigger className={cn('w-[180px] justify-start border-border', className)}>
          {icon}
          <SelectValue placeholder={placeholder ?? 'Select...'} />
        </SelectTrigger>
        {value && (
          <div
            className="absolute top-1/2 right-7 ml-auto -translate-y-1/2 cursor-pointer bg-background"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange('');
            }}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </div>
        )}
      </div>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
