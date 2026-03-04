'use client';

/**
 * React Hook for Unified State Management
 * Provides reactive state updates with cross-tab sync
 */

import { useEffect, useState, useCallback } from 'react';
import { stateManager, type AppState } from '@/lib/state-manager';
import type { ReceiptRecord } from '@/lib/receipt-types';

export function useAppState() {
  const [state, setState] = useState<AppState>(stateManager.getState());

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState) => {
      console.log('[v0] React state updated from StateManager');
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Update receipt
  const setReceipt = useCallback((receipt: ReceiptRecord | null) => {
    stateManager.setState({ receipt });
  }, []);

  // Update processing status
  const setIsProcessing = useCallback((isProcessing: boolean) => {
    stateManager.setState({ isProcessing });
  }, []);

  // Reset state
  const reset = useCallback(() => {
    stateManager.reset();
  }, []);

  // Clear all state
  const clearAll = useCallback(() => {
    stateManager.clearAll();
  }, []);

  // Get domain identity
  const domainIdentity = stateManager.getDomainIdentity();

  return {
    receipt: state.receipt,
    isProcessing: state.isProcessing,
    lastUpdated: state.lastUpdated,
    domain: state.domain,
    setReceipt,
    setIsProcessing,
    reset,
    clearAll,
    domainIdentity,
  };
}
