import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { billingService } from '../services';
import {
  payoutAccountSchema,
  type TPayoutAccountFormValues,
  type TPayoutAccountParsed,
} from '../schemas/payout-account-schema';

type TField = {
  name: keyof TPayoutAccountParsed;
  label: string;
  placeholder: string;
  hint?: string;
  half?: boolean;
};

const FIELDS: TField[] = [
  { name: 'email', label: 'Business email', placeholder: 'shop@example.com' },
  { name: 'street1', label: 'Street address', placeholder: '123 MG Road' },
  { name: 'city', label: 'City', placeholder: 'Bangalore', half: true },
  { name: 'state', label: 'State', placeholder: 'Karnataka', half: true },
  { name: 'postalCode', label: 'PIN code', placeholder: '560001', half: true },
  {
    name: 'pan',
    label: 'PAN',
    placeholder: 'ABCDE1234F',
    hint: 'Of the person or business receiving payouts',
    half: true,
  },
  { name: 'gst', label: 'GSTIN (optional)', placeholder: '29ABCDE1234F1Z5' },
];

export function PayoutAccountForm({ defaultEmail }: { defaultEmail?: string }) {
  const register = billingService.useRegisterPayoutAccount();

  const form = useForm<TPayoutAccountFormValues>({
    resolver: zodResolver(payoutAccountSchema),
    defaultValues: { email: defaultEmail ?? '', gst: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    const parsed = payoutAccountSchema.parse(values);

    register.mutate({
      email: parsed.email,
      profile: {
        category: 'others',
        subcategory: 'printing_services',
        addresses: {
          registered: {
            street1: parsed.street1,
            city: parsed.city,
            state: parsed.state,
            postal_code: parsed.postalCode,
            country: 'IN',
          },
        },
      },
      legal_info: { pan: parsed.pan, ...(parsed.gst ? { gst: parsed.gst } : {}) },
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Set up your payout account</CardTitle>
        <CardDescription>
          Razorpay verifies these details before it can send you money. Customers can pay you in the
          meantime — those earnings are held and released once verification finishes.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div
                key={field.name}
                className={
                  field.half ? 'flex flex-col gap-1.5' : 'flex flex-col gap-1.5 sm:col-span-2'
                }
              >
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  placeholder={field.placeholder}
                  {...form.register(field.name)}
                />
                {field.hint && !form.formState.errors[field.name] && (
                  <span className="text-xs text-muted-foreground">{field.hint}</span>
                )}
                {form.formState.errors[field.name] && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors[field.name]?.message as string}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <ShieldCheck className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              These details go straight to Razorpay. We never store your PAN or bank information.
            </span>
          </div>

          <Button type="submit" disabled={register.isPending} className="self-start">
            {register.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Submit for verification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
