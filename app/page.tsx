'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ReceiptCard } from '@/components/receipt-card';
import { ActivityLog } from '@/components/activity-log';
import { HooksPanel } from '@/components/hooks-panel';
import { EvidencePack } from '@/components/evidence-pack';
import { ReceiptEngine } from '@/lib/receipt-engine';
import type { ReceiptRecord, ActionConfig } from '@/lib/receipt-types';
import { FileText, Wallet, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';

const PRODUCTION_HOST   = 'base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app';
const PRODUCTION_URL    = `https://${PRODUCTION_HOST}`;
const MIN_PAYMENT_AMOUNT = 0.001; // Pi Testnet minimum

const BASE_ACTION: ActionConfig = {
  id:               'base-receipt',
  name:             'Base Receipt Creation',
  description:      'Generate a foundational reference record for approved actions',
  requiresApproval: true,
};

type WalletStatus =
  | { state: 'idle' }
  | { state: 'connecting' }
  | { state: 'connected'; username: string; accessToken: string }
  | { state: 'error'; message: string };

export default function HomePage() {
  const [wallet, setWallet]             = useState<WalletStatus>({ state: 'idle' });
  const [receipt, setReceipt]           = useState<ReceiptRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountInput, setAmountInput]   = useState<string>('1');
  const [amountError, setAmountError]   = useState<string>('');
  const busyRef   = useRef(false);
  const sdkLoaded = useRef(false);

  // Load the Pi SDK script once. Pi Browser injects window.Pi natively,
  // so the script tag is a no-op there but ensures the SDK exists elsewhere.
  useEffect(() => {
    if (sdkLoaded.current || typeof window === 'undefined') return;
    if (typeof window.Pi !== 'undefined') { sdkLoaded.current = true; return; }
    const s    = document.createElement('script');
    s.src      = 'https://sdk.minepi.com/pi-sdk.js';
    s.async    = false; // must be synchronous so window.Pi is ready before use
    s.onload   = () => { sdkLoaded.current = true; };
    document.head.appendChild(s);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function waitForPiSDK(maxMs = 5000): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window.Pi !== 'undefined') { resolve(); return; }
      const start    = Date.now();
      const interval = setInterval(() => {
        if (typeof window.Pi !== 'undefined') { clearInterval(interval); resolve(); return; }
        if (Date.now() - start >= maxMs)       { clearInterval(interval); resolve(); }
      }, 100);
    });
  }

  // ── Step 1: Connect Pi Wallet ─────────────────────────────────────────────
  async function connectWallet() {
    if (busyRef.current) return;
    busyRef.current = true;
    setWallet({ state: 'connecting' });

    try {
      await waitForPiSDK(5000);

      if (typeof window.Pi === 'undefined') {
        throw new Error(
          `Pi Browser is required. Open ${PRODUCTION_URL} inside Pi Browser.`
        );
      }

      // Pi.init() must be called once per session before authenticate().
      // sandbox: false = Testnet / real Pi network (not Sandbox mode).
      window.Pi.init({ version: '2.0', sandbox: false });

      const auth = await window.Pi.authenticate(
        ['username', 'payments'],
        async (payment: { identifier: string }) => {
          // Incomplete-payment handler: called when there is an unfinished payment.
          // Silently complete it so it does not block new payments.
          try {
            await fetch('/complete', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ paymentId: payment.identifier, txid: null }),
            });
          } catch { /* non-blocking */ }
        }
      );

      if (!auth?.accessToken || !auth?.user) {
        throw new Error('Pi.authenticate() did not return a valid token or user.');
      }

      // Persist session to Upstash Redis (best-effort).
      fetch('/api/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ accessToken: auth.accessToken, user: auth.user }),
      }).catch(() => { /* non-blocking */ });

      setWallet({
        state:       'connected',
        username:    auth.user.username,
        accessToken: auth.accessToken,
      });
    } catch (err) {
      setWallet({
        state:   'error',
        message: err instanceof Error ? err.message : 'Wallet connection failed.',
      });
    } finally {
      busyRef.current = false;
    }
  }

  // ── Step 2: Create Base Receipt ───────────────────────────────────────────
  async function createReceipt() {
    if (wallet.state !== 'connected' || isProcessing) return;

    // Validate amount
    const parsed = parseFloat(amountInput);
    if (isNaN(parsed) || parsed < MIN_PAYMENT_AMOUNT) {
      setAmountError(`Minimum amount is ${MIN_PAYMENT_AMOUNT} Pi`);
      return;
    }
    setAmountError('');
    const paymentAmount = parsed;

    setIsProcessing(true);

    const username = wallet.username;
    let current    = ReceiptEngine.createReceipt(username, BASE_ACTION, PRODUCTION_HOST);
    setReceipt({ ...current });

    try {
      await new Promise<void>((resolve, reject) => {
        window.Pi.createPayment(
          {
            amount:   paymentAmount,
            memo:     `Base Receipt: ${current.receiptId}`,
            metadata: {
              receiptId:   current.receiptId,
              referenceId: current.referenceId,
            },
          },
          {
            // Pi SDK calls this after the user taps Approve in their wallet.
            // We MUST await our /approve call — Pi's SDK waits for this
            // async callback to complete before proceeding to the blockchain step.
            onReadyForServerApproval: async (paymentId: string) => {
              current = ReceiptEngine.updateReceiptStatus(
                current,
                'approved',
                `[${new Date().toISOString()}] Approved — paymentId: ${paymentId}`
              );
              setReceipt({ ...current });

              try {
                const res = await fetch('/approve', {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({
                    paymentId,
                    amount:   paymentAmount,
                    metadata: {
                      receiptId:   current.receiptId,
                      referenceId: current.referenceId,
                      username,
                    },
                  }),
                });
                if (!res.ok) {
                  console.error('[receipt] /approve returned', res.status, await res.text());
                }
              } catch (err) {
                console.error('[receipt] /approve fetch failed:', err);
              }
            },

            // Pi SDK calls this after the blockchain transaction is confirmed.
            // We MUST await our /complete call — Pi's SDK waits for this
            // async callback to complete before closing the payment flow.
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              try {
                const res = await fetch('/complete', {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({
                    paymentId,
                    txid,
                    metadata: {
                      receiptId:   current.receiptId,
                      referenceId: current.referenceId,
                      username,
                    },
                  }),
                });
                if (!res.ok) {
                  console.error('[receipt] /complete returned', res.status, await res.text());
                }
              } catch (err) {
                console.error('[receipt] /complete fetch failed:', err);
              }

              const final = ReceiptEngine.finalizeReceipt(current);
              setReceipt({ ...final });
              resolve();
            },

            onCancel: () => {
              reject(new Error('Payment was cancelled. Please try again.'));
            },

            onError: (error: Error, payment?: unknown) => {
              console.log('[receipt] Pi payment error:', error?.message, payment);
              reject(error);
            },
          }
        );
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during receipt creation.';
      setReceipt(prev => prev ? ReceiptEngine.failReceipt(prev, msg) : null);
    } finally {
      setIsProcessing(false);
    }
  }

  const isConnected = wallet.state === 'connected';

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold leading-none">Base Receipt</h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium whitespace-nowrap">
                  <Globe className="w-2.5 h-2.5" />
                  {PRODUCTION_HOST}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-none">
                Oversight and verification layer · Pi Testnet
              </p>
            </div>
          </div>

          {/* Connected wallet badge */}
          {wallet.state === 'connected' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">{wallet.username}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

        {/* Step 1 — Connect Wallet */}
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isConnected ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
              {isConnected ? '✓' : '1'}
            </span>
            <span className="font-semibold text-sm">Connect Pi Wallet</span>
          </div>

          {wallet.state === 'idle' && (
            <Button className="w-full h-12 gap-2 font-semibold" onClick={connectWallet}>
              <Wallet className="w-4 h-4" />
              Connect Pi Wallet
            </Button>
          )}

          {wallet.state === 'connecting' && (
            <Button className="w-full h-12 gap-2 font-semibold" disabled>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </Button>
          )}

          {wallet.state === 'connected' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="text-sm font-semibold text-accent">Wallet Connected</p>
                <p className="text-xs text-muted-foreground">
                  Signed in as <strong className="text-foreground">{wallet.username}</strong>
                </p>
              </div>
            </div>
          )}

          {wallet.state === 'error' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive leading-relaxed">{wallet.message}</p>
              </div>
              <Button variant="outline" className="w-full h-10 text-sm" onClick={() => { setWallet({ state: 'idle' }); connectWallet(); }}>
                Retry Connection
              </Button>
            </div>
          )}
        </section>

        {/* Step 2 — Create Receipt */}
        <section className={`rounded-xl border bg-card p-4 space-y-3 transition-opacity ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isConnected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </span>
            <span className="font-semibold text-sm">Create Base Receipt</span>
          </div>

          {!receipt ? (
            <div className="space-y-3">
              {/* Amount input */}
              <div className="space-y-1.5">
                <label htmlFor="pi-amount" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Amount (PI)
                </label>
                <div className="relative">
                  <input
                    id="pi-amount"
                    type="number"
                    inputMode="decimal"
                    min={MIN_PAYMENT_AMOUNT}
                    step="0.001"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      setAmountError('');
                    }}
                    disabled={isProcessing}
                    placeholder={`e.g. 1`}
                    className="w-full h-12 rounded-lg border bg-background px-4 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    PI
                  </span>
                </div>
                {amountError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {amountError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum: {MIN_PAYMENT_AMOUNT} Pi · This amount will be used in the Testnet payment.
                </p>
              </div>

              <Button
                className="w-full h-12 font-semibold"
                onClick={createReceipt}
                disabled={!isConnected || isProcessing}
              >
                {isProcessing
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Waiting for wallet approval...</>
                  : 'Create Base Receipt'}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12 font-semibold bg-transparent"
              onClick={() => setReceipt(null)}
              disabled={isProcessing}
            >
              Create Another Receipt
            </Button>
          )}
        </section>

        {/* Receipt output */}
        {receipt && (
          <div className="space-y-4">
            <ReceiptCard  receipt={receipt} />
            <EvidencePack receipt={receipt} />
            <ActivityLog  logs={receipt.apiLog} />
          </div>
        )}

        {/* Hooks panel — shown only when idle */}
        {!receipt && <HooksPanel />}

        {/* How it works */}
        {!receipt && (
          <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
            <p className="font-semibold text-sm">How it works</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 leading-relaxed list-none">
              <li>1. Open <strong className="text-foreground">{PRODUCTION_URL}</strong> inside Pi Browser</li>
              <li>2. Tap <strong className="text-foreground">Connect Pi Wallet</strong> and approve in Pi Browser</li>
              <li>3. Your Pi username appears in the header</li>
              <li>4. Enter the Pi amount, tap <strong className="text-foreground">Create Base Receipt</strong>, and approve in Pi Browser</li>
              <li>5. Receipt ID, Reference ID, and evidence pack are generated instantly</li>
            </ol>
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="border-t">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Oversight and verification layer · No direct financial execution
          </p>
          <p className="text-xs text-muted-foreground">{PRODUCTION_URL}</p>
        </div>
      </footer>

    </div>
  );
}
