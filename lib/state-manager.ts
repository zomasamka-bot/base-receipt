/**
 * Unified State Management System
 * Handles internal state sync and cross-tab browser synchronization
 */

import type { ReceiptRecord } from './receipt-types';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  RECEIPT_STATE: 'base-receipt:state',
  SYNC_TIMESTAMP: 'base-receipt:sync-timestamp',
  DOMAIN_IDENTITY: 'base-receipt:domain',
} as const;

// ============================================================================
// Domain Configuration
// ============================================================================

export const DOMAIN_CONFIG = {
  appName: 'Base Receipt',
  domain: 'base.pi',
  subdomain: 'receipt',
  fullDomain: 'receipt.base.pi',
  description: 'Oversight and verification layer for Pi Network',
} as const;

// ============================================================================
// State Interface
// ============================================================================

export interface AppState {
  receipt: ReceiptRecord | null;
  isProcessing: boolean;
  lastUpdated: string;
  domain: typeof DOMAIN_CONFIG;
}

// ============================================================================
// State Manager Class
// ============================================================================

export class StateManager {
  private static instance: StateManager;
  private listeners: Set<(state: AppState) => void> = new Set();
  private currentState: AppState = {
    receipt: null,
    isProcessing: false,
    lastUpdated: new Date().toISOString(),
    domain: DOMAIN_CONFIG,
  };

  private constructor() {
    this.initializeCrossTabSync();
    this.loadPersistedState();
  }

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  // ============================================================================
  // Internal State Management
  // ============================================================================

  getState(): AppState {
    return { ...this.currentState };
  }

  setState(updater: Partial<AppState> | ((prev: AppState) => Partial<AppState>)): void {
    const updates = typeof updater === 'function' ? updater(this.currentState) : updater;
    
    this.currentState = {
      ...this.currentState,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    console.log('[v0] State updated:', this.currentState);

    // Persist to localStorage
    this.persistState();

    // Notify all listeners
    this.notifyListeners();

    // Broadcast to other tabs
    this.broadcastStateChange();
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current state
    listener(this.getState());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('[v0] Listener error:', error);
      }
    });
  }

  // ============================================================================
  // Persistence (localStorage)
  // ============================================================================

  private persistState(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.RECEIPT_STATE, JSON.stringify(this.currentState));
      localStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, new Date().toISOString());
      localStorage.setItem(STORAGE_KEYS.DOMAIN_IDENTITY, JSON.stringify(DOMAIN_CONFIG));
      
      console.log('[v0] State persisted to localStorage');
    } catch (error) {
      console.error('[v0] Failed to persist state:', error);
    }
  }

  private loadPersistedState(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECEIPT_STATE);
      if (stored) {
        const parsedState = JSON.parse(stored);
        this.currentState = {
          ...this.currentState,
          ...parsedState,
          domain: DOMAIN_CONFIG, // Always use current domain config
        };
        console.log('[v0] State loaded from localStorage');
      }
    } catch (error) {
      console.error('[v0] Failed to load persisted state:', error);
    }
  }

  // ============================================================================
  // Cross-Tab Synchronization
  // ============================================================================

  private initializeCrossTabSync(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.RECEIPT_STATE && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          
          // Conflict resolution: use latest timestamp
          if (new Date(newState.lastUpdated) > new Date(this.currentState.lastUpdated)) {
            console.log('[v0] Cross-tab state sync: updating from another tab');
            this.currentState = {
              ...newState,
              domain: DOMAIN_CONFIG, // Ensure domain consistency
            };
            this.notifyListeners();
          }
        } catch (error) {
          console.error('[v0] Failed to sync cross-tab state:', error);
        }
      }
    });

    console.log('[v0] Cross-tab synchronization initialized');
  }

  private broadcastStateChange(): void {
    // Storage event will fire in other tabs automatically when we persist
    // Just log for debugging
    console.log('[v0] State change broadcast to other tabs');
  }

  // ============================================================================
  // Reset & Clear
  // ============================================================================

  reset(): void {
    this.currentState = {
      receipt: null,
      isProcessing: false,
      lastUpdated: new Date().toISOString(),
      domain: DOMAIN_CONFIG,
    };
    this.persistState();
    this.notifyListeners();
    console.log('[v0] State reset');
  }

  clearAll(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEYS.RECEIPT_STATE);
      localStorage.removeItem(STORAGE_KEYS.SYNC_TIMESTAMP);
      this.reset();
      console.log('[v0] All state cleared');
    } catch (error) {
      console.error('[v0] Failed to clear state:', error);
    }
  }

  // ============================================================================
  // Domain Identity
  // ============================================================================

  getDomainIdentity(): typeof DOMAIN_CONFIG {
    return DOMAIN_CONFIG;
  }

  verifyDomainBinding(): boolean {
    if (typeof window === 'undefined') return true;

    const stored = localStorage.getItem(STORAGE_KEYS.DOMAIN_IDENTITY);
    if (!stored) return true;

    try {
      const storedDomain = JSON.parse(stored);
      const isValid = storedDomain.fullDomain === DOMAIN_CONFIG.fullDomain;
      
      if (!isValid) {
        console.warn('[v0] Domain binding mismatch detected');
      }
      
      return isValid;
    } catch (error) {
      console.error('[v0] Failed to verify domain binding:', error);
      return false;
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const stateManager = StateManager.getInstance();
