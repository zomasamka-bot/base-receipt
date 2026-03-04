/**
 * Pi Network — Real Testnet Approval Module
 *
 * Uses Pi.createPayment() with amount = 1 Pi (minimum for Testnet Step 10).
 * Callbacks hit same-origin /api/approve and /api/complete.
 * NO simulation. NO auto-approval.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApprovalMetadata = {
  action:      string;
  receiptId:   string;
  referenceId: string;
  timestamp:   string;
  [key: string]: unknown;
};

export type ApprovalOptions = {
  action:      string;
  metadata:    ApprovalMetadata;
  onApproved?: (metadata: ApprovalMetadata) => void;
  onError?:    (error: Error) => void;
};

type PiPaymentData = {
  amount:   number;
  memo:     string;
  metadata: ApprovalMetadata;
};

type PiPaymentCallbacks = {
  onReadyForServerApproval:    (paymentId: string) => void;
  onReadyForServerCompletion:  (paymentId: string, txid: string) => void;
  onCancel:                    (paymentId: string) => void;
  onError:                     (error: Error, payment: unknown) => void;
};

// ─── Global Window Declaration ────────────────────────────────────────────────

declare global {
  interface Window {
    Pi: {
      init:          (config: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate:  (
        scopes: string[],
        onIncompletePaymentFound: (payment: unknown) => Promise<void>
      ) => Promise<{ accessToken: string; user: { uid: string; username: string } }>;
      createPayment: (data: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
    };
    requestApproval: (options: ApprovalOptions) => Promise<void>;
  }
}

// ─── Backend Calls (same-origin relative paths) ───────────────────────────────

async function callApprove(paymentId: string, metadata: ApprovalMetadata): Promise<void> {
  console.log('[pi-approval] POST /api/approve →', paymentId);
  const res = await fetch('/api/approve', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ paymentId, amount: 1, metadata }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Approval backend failed');
  console.log('[pi-approval] /api/approve ← success', json);
}

async function callComplete(paymentId: string, txid: string, metadata: ApprovalMetadata): Promise<void> {
  console.log('[pi-approval] POST /api/complete →', paymentId, txid);
  const res = await fetch('/api/complete', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ paymentId, txid, metadata }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Completion backend failed');
  console.log('[pi-approval] /api/complete ← success', json);
}

// ─── Core Flow ────────────────────────────────────────────────────────────────

export const requestApproval = async (options: ApprovalOptions): Promise<void> => {
  if (typeof window === 'undefined' || !window.Pi) {
    throw new Error('Pi SDK not available. Open this app inside Pi Browser.');
  }

  const paymentData: PiPaymentData = {
    amount:   1, // Minimum Testnet amount required for Step 10
    memo:     `Base Receipt: ${options.metadata.receiptId}`,
    metadata: options.metadata,
  };

  console.log('[pi-approval] createPayment →', paymentData);

  window.Pi.createPayment(paymentData, {

    onReadyForServerApproval: async (paymentId: string) => {
      try {
        await callApprove(paymentId, options.metadata);
        options.onApproved?.(options.metadata);
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Approval failed');
        console.error('[pi-approval] onReadyForServerApproval error:', e);
        options.onError?.(e);
      }
    },

    onReadyForServerCompletion: async (paymentId: string, txid: string) => {
      try {
        await callComplete(paymentId, txid, options.metadata);
        // onApproved already fired above; no second call needed
      } catch (err) {
        console.error('[pi-approval] onReadyForServerCompletion error:', err);
        // Non-fatal — receipt is already in approved state
      }
    },

    onCancel: (paymentId: string) => {
      console.warn('[pi-approval] Payment cancelled:', paymentId);
      options.onError?.(new Error('Wallet approval cancelled by user.'));
    },

    onError: (error: Error, payment: unknown) => {
      console.error('[pi-approval] Pi SDK error:', error, payment);
      options.onError?.(error instanceof Error ? error : new Error('Pi SDK payment error'));
    },
  });
};

// ─── Global Binding ───────────────────────────────────────────────────────────

export const initializeGlobalApproval = (): void => {
  if (typeof window !== 'undefined') {
    window.requestApproval = requestApproval;
  }
};
