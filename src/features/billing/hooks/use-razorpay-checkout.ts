import { useCallback } from 'react';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

type TRazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (payload: TRazorpayFailure) => void) => void;
};

export type TRazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type TRazorpayFailure = {
  error?: { code?: string; description?: string; reason?: string };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => TRazorpayInstance;
  }
}

let loader: Promise<void> | null = null;

/** Loaded on demand rather than from index.html — most sessions never pay. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });

  return loader;
}

type TOpenOptions = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name: string;
  description?: string;
  onSuccess: (response: TRazorpaySuccess) => void;
  onFailed?: (response: TRazorpayFailure) => void;
  onDismiss?: () => void;
};

export function useRazorpayCheckout() {
  const open = useCallback(async (options: TOpenOptions) => {
    await loadCheckout();
    if (!window.Razorpay) throw new Error('Payment window unavailable');

    const checkout = new window.Razorpay({
      key: options.keyId,
      order_id: options.orderId,
      amount: options.amountPaise,
      currency: options.currency,
      name: options.name,
      description: options.description ?? 'Subscription',
      handler: options.onSuccess,
      modal: { ondismiss: options.onDismiss, escape: false, confirm_close: true },
      // We own the retry loop, so a second gateway-driven attempt would not be
      // narrated by our UI.
      retry: { enabled: false },
      theme: { color: '#00694E' },
    });

    if (options.onFailed) checkout.on('payment.failed', options.onFailed);
    checkout.open();
  }, []);

  return { open };
}
