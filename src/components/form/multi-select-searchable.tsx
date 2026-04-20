import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

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

type MultiSelectSearchableProps = {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  popupClassName?: string;
  disabled?: boolean;
};

export const MultiSelectSearchable: React.FC<MultiSelectSearchableProps> = ({
  onChange,
  value,
  options,
  placeholder,
  className,
  popupClassName,
  disabled,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedValue: string) => {
    if (value.includes(selectedValue)) {
      onChange(value.filter((v) => v !== selectedValue));
    } else {
      onChange([...value, selectedValue]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedLabels = options
    .filter((item) => value.includes(item.value))
    .map((item) => item.label)
    .join(', ');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-[200px] justify-between',
            !value.length && 'font-normal text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {value.length ? selectedLabels : (placeholder ?? 'Search ...')}
          </span>
          {value.length > 0 && (
            <div className="ml-auto" onClick={handleClear}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </div>
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0', popupClassName)}
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command className="h-auto">
          <CommandInput placeholder={placeholder ?? 'Search ...'} className="h-9" />
          <CommandList className="max-h-50 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
            <CommandEmpty>Not found.</CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => handleSelect(item.value)}
                >
                  {item.label}
                  <Check
                    className={cn(
                      'ml-auto',
                      value.includes(item.value) ? 'opacity-100' : 'opacity-0'
                    )}
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
