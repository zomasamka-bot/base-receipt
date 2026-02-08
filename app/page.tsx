'use client';

import { useEffect } from 'react';
import { usePiAuth } from '@/contexts/pi-auth-context';
import { useAppState } from '@/hooks/use-app-state';
import { Button } from '@/components/ui/button';
import { ReceiptCard } from '@/components/receipt-card';
import { ActivityLog } from '@/components/activity-log';
import { HooksPanel } from '@/components/hooks-panel';
import { EvidencePack } from '@/components/evidence-pack';
import { ReceiptEngine } from '@/lib/receipt-engine';
import type { ActionConfig } from '@/lib/receipt-types';
import type { ApprovalOptions } from '@/lib/pi-approval';
import { FileText, Sparkles, Globe } from 'lucide-react';

const BASE_ACTION: ActionConfig = {
  id: 'base-receipt',
  name: 'Base Receipt Creation',
  description: 'Generate a foundational reference record for approved actions',
  requiresApproval: true,
};

export default function HomePage() {
  const { userData, appId } = usePiAuth();
  const { 
    receipt, 
    isProcessing, 
    setReceipt, 
    setIsProcessing, 
    reset,
    domainIdentity 
  } = useAppState();

  // Log domain binding on mount
  useEffect(() => {
    console.log('[v0] App initialized on domain:', domainIdentity.fullDomain);
  }, [domainIdentity]);

  const handleTestnetApproval = async () => {
    if (!userData || !appId || isProcessing) return;

    setIsProcessing(true);

    try {
      // Step 1: Created - Receipt IDs generated immediately
      let currentReceipt = ReceiptEngine.createReceipt(
        userData.username,
        BASE_ACTION,
        appId
      );
      setReceipt(currentReceipt);

      // Step 2: Request Pi Testnet wallet approval (approval-only, no funds)
      const approvalOptions: ApprovalOptions = {
        action: BASE_ACTION.name,
        metadata: {
          action: BASE_ACTION.name,
          receiptId: currentReceipt.receiptId,
          referenceId: currentReceipt.referenceId,
          timestamp: currentReceipt.timestamp,
        },
        onApproved: async (metadata) => {
          console.log('[v0] Testnet approval received:', metadata);
          
          // Step 3: Update to approved status
          const approvedReceipt = ReceiptEngine.updateReceiptStatus(
            currentReceipt,
            'approved',
            `[${new Date().toISOString()}] Pi Testnet wallet approval received`
          );
          setReceipt(approvedReceipt);
          
          // Step 4: Finalize and submit record
          setTimeout(() => {
            const finalReceipt = ReceiptEngine.finalizeReceipt(approvedReceipt);
            setReceipt(finalReceipt);
            setIsProcessing(false);
          }, 500);
        },
        onError: (error) => {
          console.error('[v0] Testnet approval failed:', error);
          const failedReceipt = ReceiptEngine.failReceipt(
            currentReceipt,
            error.message || 'Testnet approval cancelled or failed'
          );
          setReceipt(failedReceipt);
          setIsProcessing(false);
        },
      };

      // Request approval via Pi Browser wallet
      if (typeof window !== 'undefined' && window.requestApproval) {
        await window.requestApproval(approvalOptions);
      } else {
        throw new Error('Pi Browser required. Please open this app in Pi Browser.');
      }
    } catch (error) {
      console.error('[v0] Receipt creation failed:', error);
      if (receipt) {
        const failedReceipt = ReceiptEngine.failReceipt(
          receipt,
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
        setReceipt(failedReceipt);
      }
      setIsProcessing(false);
    }
  };

  const handleCreateReceipt = () => {
    handleTestnetApproval();
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold">Base Receipt</h1>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    <Globe className="w-3 h-3" />
                    <span className="text-xs font-medium">{domainIdentity.fullDomain}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {domainIdentity.description}
                </p>
              </div>
            </div>
            {userData && (
              <div className="text-right">
                <p className="text-sm font-medium">{userData.username}</p>
                <p className="text-xs text-muted-foreground">@{userData.app_id}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Hero Section */}
          {!receipt && (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-balance">
                  {'Create Your Base Receipt'}
                </h2>
                <p className="text-muted-foreground text-balance leading-relaxed">
                  {'Generate a unique reference record with Pi Testnet wallet approval. No direct financial execution—oversight and verification only.'}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col gap-3">
            {!receipt ? (
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold"
                onClick={handleCreateReceipt}
                disabled={isProcessing || !userData}
              >
                {isProcessing ? 'Processing...' : 'Create Base Receipt'}
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 text-base font-semibold bg-transparent"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Create Another Receipt
              </Button>
            )}
          </div>

          {/* Receipt Card */}
          {receipt && (
            <div className="space-y-4">
              <ReceiptCard receipt={receipt} />
              <EvidencePack receipt={receipt} />
              <ActivityLog logs={receipt.apiLog} />
            </div>
          )}

          {/* System Hooks Panel */}
          {!receipt && <HooksPanel />}

          {/* Info Card */}
          {!receipt && (
            <div className="p-4 rounded-lg border bg-muted/30">
              <h3 className="font-semibold mb-2">How it works</h3>
              <ol className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <li>{'1. Click to initiate a base receipt record'}</li>
                <li>{'2. Approve in Pi Browser wallet (Testnet approval only)'}</li>
                <li>{'3. Receive your unique Receipt & Reference ID instantly'}</li>
                <li>{'4. Live evidence pack with IDs, timestamps, and runtime logs'}</li>
              </ol>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-1">
            <p className="text-center text-xs text-muted-foreground">
              {'Oversight and verification layer • No direct financial execution'}
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {'Testnet approval for reference records only'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
