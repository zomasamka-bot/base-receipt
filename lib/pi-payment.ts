/**
 * Pi Network Payment Integration Module
 *
 * Approval and completion callbacks route exclusively to our own
 * same-origin API endpoints (/api/approve, /api/complete).
 * No calls are made to any external backend server.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type PaymentMetadata = {
  [key: string]: any;
};

export type PaymentOptions = {
  amount: number;
  memo?: string;
  metadata: PaymentMetadata;
  onComplete?: (metadata: PaymentMetadata) => void;
  onError?: (error: Error, payment?: PiPayment) => void;
};

export type PiPaymentData = {
  amount: number;
  memo: string;
  metadata: PaymentMetadata;
};

export type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PiPayment) => void;
};

export type PiPayment = {
  identifier: string;
  amount: number;
  metadata: PaymentMetadata;
  transaction: {
    txid: string;
  };
};

// ============================================================================
// Global Window Declaration
// ============================================================================

declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate: (
        scopes: string[],
        checkIncompletePayments: (payment: PiPayment) => Promise<void>
      ) => Promise<{
        accessToken: string;
        user: { uid: string; username: string };
      }>;
      createPayment: (
        paymentData: PiPaymentData,
        callbacks: PiPaymentCallbacks
      ) => void;
      getIncompletePayments: () => Promise<PiPayment[]>;
    };
    pay: (options: PaymentOptions) => Promise<void>;
    requestApproval: (options: any) => Promise<void>;
  }
}

// ============================================================================
// Incomplete Payment Recovery
// Routes to our own /api/complete — never to an external server.
// Failures are silently swallowed so they never block Pi.authenticate().
// ============================================================================

export const checkIncompletePayments = async (
  payment: PiPayment
): Promise<void> => {
  try {
    if (!payment?.identifier) return;
    await fetch('/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: payment.identifier,
        txid: payment.transaction?.txid ?? '',
        metadata: payment.metadata ?? {},
      }),
    });
  } catch {
    // Intentionally silent — incomplete payment recovery must never
    // interrupt the authentication flow.
  }
};

// ============================================================================
// Payment Callbacks — same-origin endpoints only
// ============================================================================

const createPaymentCallbacks = (
  options: PaymentOptions
): PiPaymentCallbacks => {
  const onReadyForServerApproval = async (paymentId: string): Promise<void> => {
    try {
      await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, amount: options.amount, metadata: options.metadata }),
      });
    } catch (error) {
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error('Approval request failed')
        );
      }
    }
  };

  const onReadyForServerCompletion = async (
    paymentId: string,
    txid: string
  ): Promise<void> => {
    try {
      await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, txid, metadata: options.metadata }),
      });
      if (options.onComplete) {
        options.onComplete(options.metadata);
      }
    } catch (error) {
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error('Completion request failed')
        );
      }
    }
  };

  const onCancel = (_paymentId: string): void => {
    // No-op — cancellations are handled by the Pi SDK UI
  };

  const onError = (error: Error, payment?: PiPayment): void => {
    if (options.onError) options.onError(error, payment);
  };

  return { onReadyForServerApproval, onReadyForServerCompletion, onCancel, onError };
};

// ============================================================================
// Core Payment Function
// ============================================================================

export const pay = async (options: PaymentOptions): Promise<void> => {
  const paymentData: PiPaymentData = {
    amount: options.amount,
    memo: options.memo || `Payment of ${options.amount} Pi`,
    metadata: options.metadata,
  };

  const callbacks = createPaymentCallbacks(options);

  try {
    window.Pi.createPayment(paymentData, callbacks);
  } catch (error) {
    if (options.onError) {
      options.onError(
        error instanceof Error ? error : new Error('Failed to create payment')
      );
    }
    throw error;
  }
};

// ============================================================================
// Initialize Global Payment Function
// ============================================================================

export const initializeGlobalPayment = (): void => {
  if (typeof window !== 'undefined') {
    window.pay = pay;
  }
};
