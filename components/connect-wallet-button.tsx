'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2, CheckCircle, XCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type WalletStep = 'idle' | 'connecting' | 'verifying' | 'connected' | 'failed';

export interface WalletUser {
  uid:      string;
  username: string;
}

interface ConnectWalletButtonProps {
  onConnect?: (accessToken: string, user: WalletUser) => void;
  onError?:   (error: Error) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Pi Browser injects window.Pi before the page runs when the SDK is loaded.
// This check is the single source of truth — no UA sniffing, no guessing.
function hasPiSDK(): boolean {
  return typeof window !== 'undefined' && typeof window.Pi !== 'undefined';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConnectWalletButton({ onConnect, onError }: ConnectWalletButtonProps) {
  const [sdkReady,      setSdkReady]      = useState(false);
  const [walletStep,    setWalletStep]    = useState<WalletStep>('idle');
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  const [errorMsg,      setErrorMsg]      = useState<string>('');

  // Wait for window.Pi to be available (set by the Pi SDK script).
  // strategy="beforeInteractive" means it should already be there on first
  // render — the interval is a safety net for slower devices.
  useEffect(() => {
    if (hasPiSDK()) {
      setSdkReady(true);
      return;
    }
    let ticks = 0;
    const id = setInterval(() => {
      ticks++;
      if (hasPiSDK()) {
        clearInterval(id);
        setSdkReady(true);
      } else if (ticks >= 50) {          // 50 × 100ms = 5 seconds max wait
        clearInterval(id);
        // SDK never appeared — app is not running inside Pi Browser.
        // sdkReady stays false; the button will show a clear message.
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // ── Real Pi.authenticate() ────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    if (!sdkReady) {
      setErrorMsg('Pi Browser is required to connect your wallet. Open this app at the production URL inside Pi Browser.');
      setWalletStep('failed');
      return;
    }

    if (walletStep === 'connecting' || walletStep === 'verifying' || walletStep === 'connected') return;

    setWalletStep('connecting');
    setErrorMsg('');

    try {
      // Pi.init() is required in the Pi Browser developer environment.
      // sandbox: false = Testnet mode (not sandbox/production).
      window.Pi.init({ version: '2.0', sandbox: false });

      const auth = await window.Pi.authenticate(
        ['username', 'payments'],
        async (_payment: unknown) => {
          // Incomplete payment handler — silently call our own endpoint
          try {
            await fetch('/api/complete', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ paymentId: (_payment as any)?.identifier }),
            });
          } catch { /* non-fatal */ }
        }
      );

      if (!auth?.accessToken) {
        throw new Error('Pi.authenticate() returned no access token.');
      }

      setWalletStep('verifying');

      // Verify token with our same-origin backend and create Redis session
      const res  = await fetch('/api/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ accessToken: auth.accessToken, user: auth.user }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Session verification failed.');
      }

      const username = auth.user?.username ?? json.username ?? 'Pi User';
      setConnectedUser(username);
      setWalletStep('connected');

      onConnect?.(auth.accessToken, {
        uid:      auth.user?.uid ?? json.uid ?? '',
        username,
      });

    } catch (err) {
      const e = err instanceof Error ? err : new Error('Wallet connection failed.');
      setErrorMsg(e.message);
      setWalletStep('failed');
      onError?.(e);
    }
  }, [sdkReady, walletStep, onConnect, onError]);

  const handleRetry = useCallback(() => {
    setWalletStep('idle');
    setErrorMsg('');
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isBusy     = walletStep === 'connecting' || walletStep === 'verifying';
  const isDone     = walletStep === 'connected';
  const isDisabled = isBusy || isDone;

  return (
    <div className="space-y-3">

      {/* SDK not detected notice */}
      {!sdkReady && walletStep === 'idle' && (
        <div className="px-3 py-2 rounded-md bg-muted/60 text-xs text-muted-foreground border">
          Pi Browser not detected. Open the app at the production URL inside Pi Browser to connect your real Testnet wallet.
        </div>
      )}

      {/* Main action button */}
      <Button
        size="lg"
        variant={isDone ? 'outline' : walletStep === 'failed' ? 'destructive' : 'default'}
        className="w-full h-12 text-base font-semibold"
        onClick={walletStep === 'failed' ? handleRetry : handleConnect}
        disabled={isDisabled}
        type="button"
      >
        <span className="flex items-center gap-2">
          {walletStep === 'connecting' && <><Loader2 className="w-4 h-4 animate-spin" />Connecting to Pi Wallet...</>}
          {walletStep === 'verifying'  && <><Loader2 className="w-4 h-4 animate-spin" />Verifying session...</>}
          {walletStep === 'connected'  && <><CheckCircle className="w-4 h-4" />Connected — {connectedUser}</>}
          {walletStep === 'failed'     && <><XCircle className="w-4 h-4" />Retry Connection</>}
          {walletStep === 'idle'       && <><Wallet className="w-4 h-4" />Connect Pi Wallet</>}
        </span>
      </Button>

      {/* Error detail */}
      {walletStep === 'failed' && errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success */}
      {walletStep === 'connected' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 text-sm text-accent border border-accent/20">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Pi Wallet connected on Testnet. Proceed to Step 2.</span>
        </div>
      )}

    </div>
  );
}
