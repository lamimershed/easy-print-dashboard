import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type DropdownSearchableProps = {
  value: string | number | null | undefined;
  onChange: (value: string | number | null) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  className?: string;
  popupClassName?: string;
  placeholderClassName?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
};

export const SelectSearchable: React.FC<DropdownSearchableProps> = ({
  onChange,
  value,
  options,
  placeholder,
  className,
  popupClassName,
  placeholderClassName,
  onSearchChange,
  isLoading,
  disabled,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-[200px] justify-between',
            !value && 'font-normal text-muted-foreground',
            className
          )}
        >
          <span className={cn('truncate', placeholderClassName)}>
            {value
              ? options.find((item) => item.value === value)?.label
              : (placeholder ?? 'Search ...')}
          </span>
          {value && (
            <div
              className="ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </div>
          )}
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[200px] p-0', popupClassName)}>
        <Command>
          <CommandInput
            placeholder={placeholder ?? 'Search ...'}
            className="h-9"
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>{isLoading ? 'Loading...' : 'Not found.'}</CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.value === value ? null : item.value);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn('ml-auto', value === item.value ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
