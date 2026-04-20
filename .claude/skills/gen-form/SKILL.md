---
name: gen-form
description: Scaffold a Sheet-based form dialog component for a feature entity, following the coupon-form-dialog.tsx pattern.
argument-hint: <feature-name> <entity-name> "<section: field:type ...> [section2: field:type ...]"
---

# Generate Sheet Form Dialog

Scaffold a `<entity>-form-dialog.tsx` component inside `src/features/<feature>/components/<entity>/` following the canonical coupon-form-dialog.tsx pattern.

## Usage

`/gen-form <feature-name> <entity-name> "<field definitions>"`

**Example:**

```
/gen-form products product "Basic Info: name:text required, status:select(active|inactive) required; Pricing: price:number required, currency:text; Media: image:image"
```

---

## Argument format

```
"<Section Label>: <field>:<type> [required] [hint='...'], ...; <Section Label>: ..."
```

**Field types:**

| Type keyword              | Component used                                | Notes                                               |
| ------------------------- | --------------------------------------------- | --------------------------------------------------- |
| `text`                    | `<Input>` + `register()`                      | Simple string field                                 |
| `textarea`                | `<Input>` + `register()`                      | Use same Input, mention multiline in hint           |
| `number`                  | `<Controller>` + `<NumberInput>`              | Optional `min=`, `max=`, `prefix=`, `suffix=` attrs |
| `select(a\|b\|c)`         | `<Controller>` + `<SelectMenu>`               | Values extracted from parentheses                   |
| `multiselect`             | `<Controller>` + `<MultiSelectSearchable>`    | Pass options as prop or from a hook                 |
| `date`                    | `<Controller>` + `<DatePickerField>`          | Value is `string` (yyyy-MM-dd)                      |
| `image`                   | `<Controller>` + `<ImageDropzone>`            | Stores uploaded URL string                          |
| `checkbox-group(a\|b\|c)` | `<Controller>` + grid of `<Checkbox>` labels  | Values can be `string` or `number`                  |
| `array-rules`             | `<Controller>` + dedicated sub-component stub | For nested repeatable rule objects                  |

---

## What to generate

### File: `src/features/<feature>/components/<entity>/<entity>-form-dialog.tsx`

Follow **every rule below exactly**. The canonical reference is `src/features/loyalty/components/coupons/coupon-form-dialog.tsx`.

---

### 1. Imports

```tsx
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { PrimaryButton, SecondaryButton } from '@components/common';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
// Add only the form components actually used:
import { ErrorBlock, FieldInfo, SelectMenu, NumberInput, MultiSelectSearchable, DatePickerField } from '@/components/form';
import { ImageDropzone } from '@/components/form';
import { Checkbox } from '@/components/ui/checkbox';   // only if checkbox-group fields exist
import { z } from 'zod';
import { create<Entity>Schema, type TCreate<Entity>Request } from '../../schemas';
import type { T<Entity> } from '../../types';
```

Import order: React → react-hook-form → zod → shadcn/ui → common components → form components → local schemas/types.

---

### 2. Constants (above the component)

```tsx
// One constant per select/checkbox-group field:
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];
```

---

### 3. Form value type

```tsx
// Use z.input<> (NOT z.infer<>) — preserves pre-transform types for RHF
type T<Entity>FormValues = z.input<typeof create<Entity>Schema>;
```

---

### 4. Props type

```tsx
type <Entity>FormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TCreate<Entity>Request) => void;
  <entityCamelCase>?: T<Entity> | null;
  isLoading?: boolean;
};
```

---

### 5. Component structure

```tsx
const <Entity>FormDialog = ({ open, onClose, onSubmit, <entity>, isLoading = false }: <Entity>FormDialogProps) => {
  const isEditMode = !!<entity>;

  // ── defaultValues must use useMemo if it depends on any hook result ──────
  const defaultValues = useMemo<Partial<T<Entity>FormValues>>(
    () => ({
      // all fields with empty/zero/undefined defaults
    }),
    [/* hook-derived deps only, e.g. currency */],
  );

  const { control, handleSubmit, reset, watch, register, formState: { errors } } =
    useForm<T<Entity>FormValues>({
      resolver: zodResolver(create<Entity>Schema),
      defaultValues,
    });

  // ── Reset on open/close ──────────────────────────────────────────────────
  useEffect(() => {
    if (open && <entity>) {
      reset({ /* map all entity fields */ });
    } else if (open) {
      reset(defaultValues);
    }
  }, [open, <entity>, defaultValues, reset]);
  // No eslint-disable comments — useMemo ensures defaultValues is stable

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">

        {/* Header */}
        <SheetHeader className="shrink-0 px-6 pt-6 pb-4">
          <SheetTitle className="text-xl font-semibold">
            {isEditMode ? 'Edit <Entity>' : 'New <Entity>'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {isEditMode ? 'Update the details below.' : 'Fill in the details to create a new <entity>.'}
          </p>
        </SheetHeader>

        <Separator />

        {/* Scrollable body */}
        <form
          id="<entity>-form"
          onSubmit={handleSubmit((data) => onSubmit(data as TCreate<Entity>Request))}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="space-y-3">
            {/* One block per section */}
            {/* ── Section ───────────────────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Section Label
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* fields */}
              </div>
            </div>
            <Separator />
            {/* repeat for each section */}
          </div>
        </form>

        <Separator />

        {/* Sticky footer */}
        <SheetFooter className="shrink-0 flex-row gap-2 px-6 py-4">
          <SecondaryButton type="button" className="w-1/2" onClick={handleClose} disabled={isLoading}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" form="<entity>-form" className="w-1/2" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditMode ? 'Update <Entity>' : 'Create <Entity>'}
          </PrimaryButton>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
};

export default <Entity>FormDialog;
```

---

### 6. Field rendering patterns

**Text input:**

```tsx
<div className="space-y-1.5">
  <Label htmlFor="<fieldId>">
    Field Label <span className="text-destructive">*</span>{/* only if required */}
    <FieldInfo hint="Describe what this field is for." />
  </Label>
  <ErrorBlock message={errors.<field>?.message}>
    <Input id="<fieldId>" {...register('<field>')} placeholder="e.g. ..." />
  </ErrorBlock>
</div>
```

**Select:**

```tsx
<div className="space-y-1.5">
  <Label>
    Field Label
    <FieldInfo hint="..." />
  </Label>
  <Controller
    name="<field>"
    control={control}
    render={({ field }) => (
      <ErrorBlock message={errors.<field>?.message}>
        <SelectMenu
          value={field.value ?? ''}
          onChange={field.onChange}
          options={FIELD_OPTIONS}
          placeholder="Select..."
          label="Field Label"   {/* ← always 'label', never 'lable' */}
          className="w-full"
        />
      </ErrorBlock>
    )}
  />
</div>
```

**Number (with optional currency prefix/suffix):**

```tsx
<Controller
  name="<field>"
  control={control}
  render={({ field }) => (
    <ErrorBlock message={errors.<field>?.message}>
      <div className="relative">
        {/* optional: <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">£</span> */}
        <NumberInput
          min={0}
          value={field.value ?? null}
          onChange={(v) => field.onChange(v ?? undefined)}
          className="pl-7" {/* add if prefix */}
        />
      </div>
    </ErrorBlock>
  )}
/>
```

**Date picker:**

```tsx
<Controller
  name="<field>"
  control={control}
  render={({ field }) => (
    <ErrorBlock message={errors.<field>?.message}>
      <DatePickerField value={field.value} onChange={field.onChange} placeholder="Pick date" />
    </ErrorBlock>
  )}
/>
```

**Image dropzone:**

```tsx
<Controller
  name="<field>"
  control={control}
  render={({ field }) => (
    <ErrorBlock message={errors.<field>?.message}>
      <ImageDropzone value={field.value ?? ''} onChange={field.onChange} />
    </ErrorBlock>
  )}
/>
```

**Multi-select:**

```tsx
<Controller
  name="<field>"
  control={control}
  render={({ field }) => (
    <MultiSelectSearchable
      value={field.value ?? []}
      onChange={field.onChange}
      options={someList.map((item) => ({ value: item._id, label: item.name }))}
      placeholder="Search..."
      className="w-full"
      popupClassName="w-full"
    />
  )}
/>
```

**Checkbox group:**

```tsx
{/* Add a toggle helper above the return: */}
{/* const toggle<Field> = (current: T[], value: T, onChange: (v: T[]) => void) =>
      onChange(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]); */}

<Controller
  name="<field>"
  control={control}
  render={({ field }) => (
    <ErrorBlock message={errors.<field>?.message}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FIELD_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:bg-accent/50 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
          >
            <Checkbox
              checked={(field.value ?? []).includes(opt.value)}
              onCheckedChange={() => toggle<Field>(field.value ?? [], opt.value, field.onChange)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </ErrorBlock>
  )}
/>
```

**Array rules (nested repeatable object):**
Generate a dedicated sub-component `<entity>-<field>-rules.tsx` in the same folder, following the `availability-rules.tsx` pattern:

- Props: `{ rules: T<Rule>[]; onChange: (rules: T<Rule>[]) => void }`
- Use `useRef` for stable keys (NOT `key={index}`):
  ```tsx
  const nextKey = useRef(0);
  const ruleKeys = useRef<number[]>([]);
  if (ruleKeys.current.length < rules.length) {
    while (ruleKeys.current.length < rules.length) ruleKeys.current.push(nextKey.current++);
  } else if (ruleKeys.current.length > rules.length) {
    ruleKeys.current = ruleKeys.current.slice(0, rules.length);
  }
  // In addRule: ruleKeys.current = [...ruleKeys.current, nextKey.current++];
  // In removeRule: ruleKeys.current = ruleKeys.current.filter((_, i) => i !== index);
  ```
- Use `<Button type="button">` for Add/Remove — never `type="submit"`

---

### 7. Layout rules

- Two-column grid for most field pairs: `<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">`
- If a field has no pair (last in section or conditionally hidden sibling), span full: `className={cn('space-y-1.5', !hasSibling && 'sm:col-span-2')}`
- Sections separated by `<Separator />`
- Required star: `<span className="text-destructive">*</span>` next to required field labels only

---

### 8. Quality rules (mandatory)

- **NEVER** use `key={index}` for dynamic lists — use stable `useRef` keys
- **NEVER** write `eslint-disable-next-line react-hooks/exhaustive-deps` — fix deps properly with `useMemo`
- **NEVER** use `lable=` — the prop is `label=`
- **NEVER** hardcode colors — use CSS variables (`text-muted-foreground`, `border-border`, etc.)
- **NEVER** put raw API calls inside the component — use service hooks
- Wrap every field (except optional-with-no-validation) in `<ErrorBlock message={errors.field?.message}>`

---

### 9. After generating the file

1. Check if `src/features/<feature>/components/<entity>/index.ts` exists. If yes, add the export:

   ```ts
   export { default as <Entity>FormDialog } from './<entity>-form-dialog';
   ```

   If the file doesn't exist, create it with that single export.

2. Check if `src/features/<feature>/components/index.ts` exports from `./<entity>`. If not, add:

   ```ts
   export * from './<entity>';
   ```

3. Remind the user:
   - The schema (`create<Entity>Schema`) and type (`T<Entity>`) must exist in the feature's `schemas/` and `types/` folders before this component will compile.
   - Use `/generate-api` first if the API layer hasn't been scaffolded yet.

---

Now generate the form dialog for: **$ARGUMENTS**
