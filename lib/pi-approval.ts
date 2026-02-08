/**
 * Pi Network Approval Module for Base Receipt
 * 
 * Provides approval-only functionality using Pi Network SDK
 * NO PAYMENTS - This module handles approval signatures only
 */

import { api } from "@/lib/api";

// ============================================================================
// Type Definitions
// ============================================================================

export type ApprovalMetadata = {
  action: string;
  receiptId: string;
  referenceId: string;
  timestamp: string;
  [key: string]: any;
};

export type ApprovalOptions = {
  action: string;
  metadata: ApprovalMetadata;
  onApproved?: (metadata: ApprovalMetadata) => void;
  onError?: (error: Error) => void;
};

export type PiApprovalData = {
  amount: number; // Set to 0 for approval-only
  memo: string;
  metadata: ApprovalMetadata;
};

export type PiApprovalCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error) => void;
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
        onIncompletePaymentFound: (payment: any) => Promise<void>
      ) => Promise<{
        accessToken: string;
        user: { uid: string; username: string };
      }>;
      createPayment: (
        paymentData: PiApprovalData,
        callbacks: PiApprovalCallbacks
      ) => void;
    };
    requestApproval: (options: ApprovalOptions) => Promise<void>;
  }
}

// ============================================================================
// Approval Callbacks (Testnet)
// ============================================================================

const createApprovalCallbacks = (
  options: ApprovalOptions
): PiApprovalCallbacks => {
  const onReadyForServerApproval = async (paymentId: string): Promise<void> => {
    try {
      console.log("[v0] Approval request received:", paymentId);
      console.log("[v0] Calling backend /api/approve...");
      
      // Call same-origin backend API
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          amount: 0,
          metadata: options.metadata,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Backend approval failed');
      }

      console.log("[v0] Backend approval successful:", result);
      
      if (options.onApproved) {
        options.onApproved(options.metadata);
      }
    } catch (error) {
      console.error("[v0] Failed to process approval:", error);
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error("Approval processing failed")
        );
      }
    }
  };

  const onReadyForServerCompletion = async (
    paymentId: string,
    txid: string
  ): Promise<void> => {
    try {
      console.log("[v0] Completion request received:", { paymentId, txid });
      console.log("[v0] Calling backend /api/complete...");
      
      // Call same-origin backend API
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          txid,
          metadata: options.metadata,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Backend completion failed');
      }

      console.log("[v0] Backend completion successful:", result);
      
      if (options.onApproved) {
        options.onApproved(options.metadata);
      }
    } catch (error) {
      console.error("[v0] Failed to process completion:", error);
      // Don't throw here - completion is informational
    }
  };

  const onCancel = (paymentId: string): void => {
    console.log("[v0] Approval cancelled:", paymentId);
    if (options.onError) {
      options.onError(new Error("Approval cancelled by user"));
    }
  };

  const onError = (error: Error): void => {
    console.error("[v0] Approval error:", error);
    if (options.onError) {
      options.onError(error);
    }
  };

  return {
    onReadyForServerApproval,
    onReadyForServerCompletion,
    onCancel,
    onError,
  };
};

// ============================================================================
// Core Approval Function (Approval-Only, No Funds)
// ============================================================================

export const requestApproval = async (
  options: ApprovalOptions
): Promise<void> => {
  // Use Pi Network payment flow with 0 amount for approval-only
  const approvalData: PiApprovalData = {
    amount: 0, // Zero amount = approval signature only
    memo: `Base Receipt Approval: ${options.action}`,
    metadata: options.metadata,
  };

  const callbacks = createApprovalCallbacks(options);

  try {
    if (typeof window === "undefined" || !window.Pi) {
      throw new Error("Pi SDK not available. Please open in Pi Browser.");
    }

    console.log("[v0] Requesting Pi Network approval...");
    window.Pi.createPayment(approvalData, callbacks);
  } catch (error) {
    console.error("[v0] Failed to request approval:", error);
    if (options.onError) {
      options.onError(
        error instanceof Error ? error : new Error("Failed to request approval")
      );
    }
    throw error;
  }
};

// ============================================================================
// Initialize Global Approval Function
// ============================================================================

export const initializeGlobalApproval = (): void => {
  if (typeof window !== "undefined") {
    window.requestApproval = requestApproval;
  }
};
