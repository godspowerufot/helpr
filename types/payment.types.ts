// Mirrors `PaymentRead` from msflib-payments (ADR 0019). `amount` is in major units (naira).
export type PaymentStatus = 'verified' | 'unverified' | 'failed' | 'fulfilled';

export type PaymentGateway = 'paystack' | 'stripe';

export type PaymentRead = {
  id: number;
  account_id: number;
  email: string;
  description: string | null;
  amount: number;
  callback_url: string | null;
  data: Record<string, unknown> | null;
  authorization_url: string;
  access_code: string | null;
  reference: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  created_at: string;
  updated_at: string;
};

export type PaymentCheckout = {
  payment_id: number;
  reference: string;
  authorization_url: string;
};
