import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type NumberInputProps = Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> & {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
};

export const NumberInput = ({ value, onChange, className, ...props }: NumberInputProps) => {
  const [raw, setRaw] = React.useState(value != null ? String(value) : '');

  // Sync when external value changes (e.g. form reset)
  React.useEffect(() => {
    setRaw(value != null ? String(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    // Allow empty, digits, and one leading minus
    if (str === '' || /^-?\d*\.?\d*$/.test(str)) {
      setRaw(str);
      if (str === '' || str === '-') {
        onChange(null);
      } else {
        const num = Number(str);
        if (!isNaN(num)) onChange(num);
      }
    }
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={raw}
      className={cn(className)}
      onChange={handleChange}
      onWheel={(e) => e.currentTarget.blur()}
    />
  );
};

export default NumberInput;
