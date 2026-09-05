import { useQuery } from '@tanstack/react-query';

/**
 * India Post's public PIN directory — free, keyless, CORS-open.
 * Used to fill city/state so the address matches what Razorpay verifies
 * against; a hand-typed mismatch is the most common KYC rejection.
 */
const POSTAL_API = 'https://api.postalpincode.in/pincode';

const PIN_PATTERN = /^[1-9][0-9]{5}$/;

type TPostOffice = {
  Name: string;
  District: string;
  State: string;
};

type TPostalResponse = {
  Status: 'Success' | 'Error' | '404';
  Message: string;
  PostOffice: TPostOffice[] | null;
}[];

export type TPincodeLocation = {
  city: string;
  state: string;
};

async function lookupPincode(pincode: string): Promise<TPincodeLocation | null> {
  const response = await fetch(`${POSTAL_API}/${pincode}`);
  if (!response.ok) throw new Error('PIN lookup failed');

  const [result] = (await response.json()) as TPostalResponse;
  const offices = result?.PostOffice;
  if (result?.Status !== 'Success' || !offices?.length) return null;

  const [first] = offices;
  return { city: first.District, state: first.State };
}

/** Resolves a 6-digit PIN to its city and state. Idle until the PIN is valid. */
export function usePincodeLookup(pincode: string) {
  const isValid = PIN_PATTERN.test(pincode.trim());

  return useQuery({
    queryKey: ['pincode', pincode.trim()],
    queryFn: () => lookupPincode(pincode.trim()),
    enabled: isValid,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}
