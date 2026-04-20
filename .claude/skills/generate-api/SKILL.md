---
name: generate-api
description: Generate the three API layer files for a new feature — types, schema, and service — following this project's conventions.
argument-hint: <feature-name> <base-endpoint> [description of the resource and its fields]
---

# Generate API Feature Files

Generate the three API layer files for a new feature: **types**, **schema**, and **service**.

## Usage

`/generate-api <feature-name> <base-endpoint> [description of the resource and its fields]`

**Example:** `/generate-api product /tb/products A product with name, price, category, stock, isActive fields`

---

## What to generate

Create these three files inside `src/features/<feature-name>/`:

---

### 1. `types/<feature>-type.ts`

Real example from this repo (`booking-type.ts`):

```typescript
import { ApiPaginationResponse, ApiResponse } from '@/services/type';

export type TBooking = {
  _id: string;
  _id_customer: string;
  _id_restaurant: string;
  customerName: string;
  phone: string;
  email: string;
  cover: number;
  status: TBookingStatus;
  bookingDate: string; // ISO date string
  bookingTime: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;
};

export type TBookingStatus = 'created' | 'confirmed' | 'completed' | 'cancelled';

export type TBookingListFilter = {
  search?: string;
  sort?: 'createdAt:asc' | 'createdAt:desc';
  fromDate?: string; // yyyy-MM-dd
  toDate?: string; // yyyy-MM-dd
  page?: number;
  limit?: number;
};

export type TBookingListResponse = ApiPaginationResponse<TBooking[]>;
export type TBookingResponse = ApiResponse<TBooking>;

// Master interface — aggregates all types for service imports
export interface TBookingType {
  TBooking: TBooking;
  TListFilter: TBookingListFilter;
  TListResponse: TBookingListResponse;
  TBookingResponse: TBookingResponse;
}
```

Rules:

- Use `ApiPaginationResponse<T[]>` for paginated list responses (imports from `@/services/type`)
- Use `ApiResponse<T>` for single-item responses
- Always export a master `T[Entity]Type` interface aggregating all types — this is what the service imports
- Status unions are string literal types
- Date fields are `string` with `// ISO date string` or `// yyyy-MM-dd` comments

---

### 2. `schemas/<feature>-schema.ts`

Real example from this repo (`create-booking-schema.tsx`):

```typescript
import { z } from 'zod';

export const reservationSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .trim()
    .refine((val) => !/\s{2,}/.test(val), {
      message: 'Multiple consecutive spaces are not allowed',
    })
    .refine((val) => /^[a-zA-Z\s]+$/.test(val), {
      message: 'Name can only contain letters and spaces.',
    }),
  phone: z.string().min(1, { message: 'Phone number is required.' }),
  email: z.string().email('Invalid email address'),
  cover: z.number().min(1, 'At least 1 guest is required'),
  _id_event: z.string().nullable(),
  reservationNotes: z.string().optional(),
  bookingDate: z.string({ required_error: 'Booking date is required' }),
  bookingTime: z.string().min(1, 'Booking time is required'),
});

export type TReservationFormType = z.infer<typeof reservationSchema>;
```

Rules:

- Required strings: `.string().min(1, 'Field is required')`
- Nullable foreign key IDs: `z.string().nullable()`
- Optional fields: `.optional()`
- Always export the inferred type as `T[Entity]FormType`

---

### 3. `services/<feature>-service.ts`

Real examples from this repo. Study both patterns below — use the one that fits:

**Pattern A — list with typed filter object** (from `booking-service.ts`):

```typescript
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';
import api from '@/services/api';
import { TParams } from '@/services';
import { TBookingType } from '../types';
import { TReservationFormType } from '../schemas/create-booking-schema';

const queryKeys = {
  all: ['bookings'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: TBookingType['TListFilter'], restaurantId: string) =>
    [...queryKeys.lists(), restaurantId, filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string, restaurantId: string) => [...queryKeys.details(), restaurantId, id] as const,
};

const useGetBookings = (filter: TBookingType['TListFilter']) => {
  const { restaurantId } = useParams<TParams>();
  if (!restaurantId) throw new Error('restaurantId is required');

  return useQuery({
    queryKeys: queryKeys.list(filter, restaurantId),
    queryFn: async () => {
      const { search, sort, fromDate, toDate, limit, page } = filter;
      const queryParams = [
        search ? `search=${encodeURIComponent(search)}` : '',
        sort ? `sort=${sort}` : '',
        fromDate ? `fromDate=${fromDate}` : '',
        toDate ? `toDate=${toDate}` : '',
        limit ? `limit=${limit}` : '',
        page ? `page=${page}` : '',
      ]
        .filter(Boolean)
        .join('&');

      const response = await api.get<TBookingType['TListResponse']>(
        `/tb/bookings${queryParams ? `?${queryParams}` : ''}`,
        { headers: { 'Restaurant-ID': restaurantId } }
      );
      return response.data?.data;
    },
  });
};

const useGetBooking = (id: string) => {
  const { restaurantId } = useParams<TParams>();
  if (!restaurantId) throw new Error('restaurantId is required');

  return useQuery({
    queryKeys: queryKeys.detail(id, restaurantId),
    queryFn: async () => {
      const { data } = await api.get(`/tb/bookings/${id}`, {
        headers: { 'Restaurant-ID': restaurantId },
      });
      return data.data as TBookingType['TBooking'];
    },
    enabled: !!id,
  });
};

const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { restaurantId } = useParams<TParams>();

  return useMutation({
    mutationFn: async (data: TReservationFormType) => {
      const { data: response } = await api.post('/tb/bookings', data, {
        headers: { 'Restaurant-ID': restaurantId },
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Booking created successfully');
      queryClient.invalidateQueries({ queryKeys: queryKeys.lists() });
    },
    onError: () => {
      toast.error('Error creating booking');
    },
  });
};

const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  const { restaurantId } = useParams<TParams>();

  return useMutation({
    mutationFn: async (data: Partial<TBookingType['TBooking']>) => {
      const { _id, ...rest } = data;
      const response = await api.put(`/tb/bookings/${_id}`, rest, {
        headers: { 'Restaurant-ID': restaurantId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKeys: queryKeys.lists() });
    },
  });
};

const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  const { restaurantId } = useParams<TParams>();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tb/bookings/${id}`, {
        headers: { 'Restaurant-ID': restaurantId },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Booking deleted successfully');
      queryClient.invalidateQueries({ queryKeys: queryKeys.lists() });
    },
    onError: () => {
      toast.error('Error deleting booking');
    },
  });
};

export const bookingsService = {
  queryKeys,
  useGetBookings,
  useGetBooking,
  useCreateBooking,
  useUpdateBooking,
  useDeleteBooking,
};
```

**Pattern B — list with primitive params** (from `customer-service.ts`):

```typescript
const customerKeys = {
  all: ['customers'] as const,
  list: (page: number, limit: number, search: string, sort: string) =>
    [...customerKeys.all, 'list', page, limit, search, sort] as const,
  listAll: () => [...customerKeys.all, 'list'] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
};

const useGetCustomersWithPagination = ({
  limit,
  page,
  sort,
  search,
}: {
  page: number;
  limit: number;
  sort?: 'createdAt:desc';
  search: string;
}) => {
  const { restaurantId } = useParams<TParams>();
  if (!restaurantId) throw new Error('restaurantId is required');

  return useQuery({
    queryKeys: customerKeys.list(page, limit, search, sort || 'createdAt:desc'),
    queryFn: async () => {
      const response = await api.get(
        `/tb/customers?page=${page}&limit=${limit}&sort=${sort || 'createdAt:desc'}&search=${search || ''}`,
        { headers: { 'Restaurant-ID': restaurantId } }
      );
      return response.data;
    },
  });
};
```

Use Pattern A when the filter is complex/optional. Use Pattern B for simple paginated lists with fixed params.

**Key rules for services:**

- Imports order: `sonner` → `@tanstack/react-query` → `react-router` → `@/services/api` → `@/services` → local types
- Always `useParams<TParams>()` and guard with `if (!restaurantId) throw new Error(...)`
- All API calls pass `'Restaurant-ID': restaurantId` in headers
- Query param string built by filtering empty strings and joining with `&`
- `onSuccess` always calls `queryClient.invalidateQueries`
- `onError` always calls `toast.error`
- Export as a named object `[feature]Service` containing all hooks and keys

---

### Also create barrel files

**`types/index.ts`**

```typescript
export * from './[feature]-type';
```

**`schemas/index.ts`**

```typescript
export * from './[feature]-schema';
```

**`services/index.ts`**

```typescript
export * from './[feature]-service';
```

---

## Base types reference (`@/services/type`)

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  msg?: string;
  code: string;
  error?: string;
  serverTime: string;
}

interface PaginatedData<T> {
  docs: T;
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

type ApiPaginationResponse<T> = ApiResponse<PaginatedData<T>>;
type TParams = { restaurantId: string };
```

---

Now generate the files for: **$ARGUMENTS**
