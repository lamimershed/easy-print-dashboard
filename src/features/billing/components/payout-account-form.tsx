import { useEffect, type ChangeEvent } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { billingService } from '../services';
import { usePincodeLookup } from '../hooks/use-pincode-lookup';
import {
  BUSINESS_TYPES,
  payoutAccountSchema,
  type TPayoutAccountFormValues,
} from '../schemas/payout-account-schema';

type TFieldName = Path<TPayoutAccountFormValues>;

type TField = {
  name: TFieldName;
  label: string;
  placeholder: string;
  hint?: string;
  half?: boolean;
  /** Razorpay stores PAN/GSTIN/IFSC upper-cased — do it as the user types. */
  uppercase?: boolean;
  maxLength?: number;
};

type TSection = {
  title: string;
  description: string;
  fields: TField[];
};

const SECTIONS: TSection[] = [
  {
    title: 'Business',
    description: 'As registered — Razorpay matches this against your PAN.',
    fields: [
      { name: 'legalBusinessName', label: 'Legal business name', placeholder: 'Acme Prints LLP' },
      { name: 'contactName', label: 'Primary contact', placeholder: 'Lami Mershed', half: true },
      {
        name: 'phone',
        label: 'Contact number',
        placeholder: '9876543210',
        half: true,
        maxLength: 10,
      },
      { name: 'email', label: 'Business email', placeholder: 'shop@example.com' },
    ],
  },
  {
    title: 'Registered address',
    description: 'The address on your business registration.',
    fields: [
      { name: 'street1', label: 'Street address', placeholder: '123 MG Road' },
      {
        name: 'postalCode',
        label: 'PIN code',
        placeholder: '560001',
        hint: 'City and state fill in automatically',
        half: true,
        maxLength: 6,
      },
      { name: 'city', label: 'City', placeholder: 'Bengaluru', half: true },
      { name: 'state', label: 'State', placeholder: 'Karnataka', half: true },
    ],
  },
  {
    title: 'Legal',
    description: 'Of the business receiving payouts.',
    fields: [
      {
        name: 'pan',
        label: 'Business PAN',
        placeholder: 'ABCDE1234F',
        half: true,
        uppercase: true,
        maxLength: 10,
      },
      {
        name: 'gst',
        label: 'GSTIN (optional)',
        placeholder: '29ABCDE1234F1Z5',
        half: true,
        uppercase: true,
        maxLength: 15,
      },
    ],
  },
  {
    title: 'Stakeholder',
    description: 'The person legally answerable for the business.',
    fields: [
      { name: 'stakeholderName', label: 'Full name', placeholder: 'Lami Mershed', half: true },
      { name: 'stakeholderEmail', label: 'Email', placeholder: 'owner@example.com', half: true },
      {
        name: 'stakeholderPan',
        label: 'Personal PAN',
        placeholder: 'ABCDE1234F',
        half: true,
        uppercase: true,
        maxLength: 10,
      },
    ],
  },
  {
    title: 'Settlement account',
    description: 'Where Razorpay deposits your earnings.',
    fields: [
      { name: 'beneficiaryName', label: 'Account holder name', placeholder: 'Acme Prints LLP' },
      {
        name: 'accountNumber',
        label: 'Account number',
        placeholder: '50100234567890',
        half: true,
        maxLength: 20,
      },
      {
        name: 'ifscCode',
        label: 'IFSC',
        placeholder: 'HDFC0000053',
        half: true,
        uppercase: true,
        maxLength: 11,
      },
    ],
  },
];

export function PayoutAccountForm({ defaultEmail }: { defaultEmail?: string }) {
  const register = billingService.useRegisterPayoutAccount();

  const form = useForm<TPayoutAccountFormValues>({
    resolver: zodResolver(payoutAccountSchema),
    defaultValues: {
      email: defaultEmail ?? '',
      phone: '',
      legalBusinessName: '',
      businessType: 'proprietorship',
      contactName: '',
      street1: '',
      city: '',
      state: '',
      postalCode: '',
      pan: '',
      gst: '',
      stakeholderName: '',
      stakeholderEmail: '',
      stakeholderPan: '',
      accountNumber: '',
      ifscCode: '',
      beneficiaryName: '',
    },
  });

  const postalCode = form.watch('postalCode') ?? '';
  const businessType = form.watch('businessType');
  const pincode = usePincodeLookup(postalCode);
  const location = pincode.data;

  // The PIN is the authority here: a city/state that disagrees with it is what
  // gets the linked account rejected, so a resolved PIN overwrites both fields.
  useEffect(() => {
    if (!location) return;
    form.setValue('city', location.city, { shouldValidate: true });
    form.setValue('state', location.state, { shouldValidate: true });
  }, [location, form]);

  const onSubmit = form.handleSubmit((values) => {
    const parsed = payoutAccountSchema.parse(values);

    register.mutate({
      email: parsed.email,
      phone: parsed.phone,
      legal_business_name: parsed.legalBusinessName,
      business_type: parsed.businessType,
      contact_name: parsed.contactName,
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
      stakeholder: {
        name: parsed.stakeholderName,
        email: parsed.stakeholderEmail,
        pan: parsed.stakeholderPan,
      },
      settlements: {
        account_number: parsed.accountNumber,
        ifsc_code: parsed.ifscCode,
        beneficiary_name: parsed.beneficiaryName,
      },
    });
  });

  const pinHint = (() => {
    if (pincode.isFetching) return 'Looking up PIN code…';
    if (pincode.isError) return 'Could not reach the PIN directory — type city and state manually';
    if (pincode.isSuccess && !location) return 'No such PIN code — check the digits';
    if (location) return `${location.city}, ${location.state}`;
    return undefined;
  })();

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
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {SECTIONS.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5 border-b border-border pb-2">
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => {
                  const error = form.formState.errors[field.name]?.message as string | undefined;
                  const isPin = field.name === 'postalCode';
                  const hint = isPin ? (pinHint ?? field.hint) : field.hint;

                  return (
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
                        maxLength={field.maxLength}
                        aria-invalid={!!error}
                        autoCapitalize={field.uppercase ? 'characters' : undefined}
                        autoComplete="off"
                        spellCheck={field.uppercase ? false : undefined}
                        className={cn(field.uppercase && 'uppercase placeholder:normal-case')}
                        {...form.register(field.name, {
                          // Upper-casing in onChange (not just on submit) keeps
                          // what the user sees identical to what Razorpay gets.
                          onChange: field.uppercase
                            ? (event: ChangeEvent<HTMLInputElement>) => {
                                event.target.value = event.target.value.toUpperCase();
                              }
                            : undefined,
                        })}
                      />
                      {hint && !error && (
                        <span
                          className={cn(
                            'flex items-center gap-1 text-xs text-muted-foreground',
                            isPin && location && 'text-primary'
                          )}
                        >
                          {isPin && location && <MapPin className="size-3 shrink-0" />}
                          {hint}
                        </span>
                      )}
                      {error && <span className="text-xs text-destructive">{error}</span>}
                    </div>
                  );
                })}

                {section.title === 'Business' && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="businessType">Business type</Label>
                    <Select
                      value={businessType}
                      onValueChange={(value) =>
                        form.setValue('businessType', value, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger id="businessType" className="w-full">
                        <SelectValue placeholder="Pick a business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.businessType && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.businessType.message}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>
          ))}

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <ShieldCheck className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              These details go straight to Razorpay. We never store your PAN or bank details — only
              the account id Razorpay gives back.
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
