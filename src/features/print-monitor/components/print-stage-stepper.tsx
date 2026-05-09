import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrintStage } from '@/types/electron';

interface PrintStageStepperProps {
  currentStage: PrintStage;
  className?: string;
}

type StepConfig = {
  stage: PrintStage;
  label: string;
};

const STEPS: StepConfig[] = [
  { stage: 'preparing', label: 'Preparing' },
  { stage: 'spooling', label: 'Spooling' },
  { stage: 'printing', label: 'Printing' },
  { stage: 'complete', label: 'Complete' },
];

const STAGE_ORDER: Record<PrintStage, number> = {
  idle: -1,
  preparing: 0,
  spooling: 1,
  printing: 2,
  complete: 3,
  error: 3,
};

export function PrintStageStepper({ currentStage, className }: PrintStageStepperProps) {
  if (currentStage === 'idle') return null;

  const currentIndex = STAGE_ORDER[currentStage];
  const isError = currentStage === 'error';

  return (
    <div className={cn('py-4', className)}>
      <p className="mb-3 text-[11px] font-black tracking-widest text-muted-foreground uppercase">
        Print Stage
      </p>
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const stepIndex = STAGE_ORDER[step.stage];
          const isDone = !isError && currentIndex > stepIndex;
          const isActive = !isError && currentIndex === stepIndex;
          const isErrorStep = isError && idx === currentIndex;
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.stage} className="flex flex-1 items-center">
              {/* Step dot + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                    isDone && 'border-primary bg-primary text-primary-foreground',
                    isActive && 'animate-pulse border-primary bg-primary/20 text-primary',
                    isErrorStep && 'border-destructive bg-destructive/10 text-destructive',
                    !isDone &&
                      !isActive &&
                      !isErrorStep &&
                      'border-border bg-muted text-muted-foreground'
                  )}
                >
                  {isDone && <Check className="size-3.5" strokeWidth={3} />}
                  {isErrorStep && <AlertCircle className="size-3.5" />}
                  {!isDone && !isErrorStep && (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[9px] font-bold tracking-wider whitespace-nowrap uppercase',
                    isDone && 'text-primary',
                    isActive && 'text-primary',
                    isErrorStep && 'text-destructive',
                    !isDone && !isActive && !isErrorStep && 'text-muted-foreground'
                  )}
                >
                  {isErrorStep ? 'Error' : step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'mb-5 h-0.5 flex-1 transition-all',
                    isDone ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
