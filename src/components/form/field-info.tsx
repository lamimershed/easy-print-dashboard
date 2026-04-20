import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FieldInfoProps = {
  hint: string;
};

export const FieldInfo = ({ hint }: FieldInfoProps) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="ml-1 inline h-3.5 w-3.5 cursor-pointer text-muted-foreground/60 hover:text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 text-xs">
        {hint}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
