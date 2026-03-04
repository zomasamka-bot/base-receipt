import type { ReceiptRecord, ReceiptStatus, ActionConfig } from './receipt-types';

export class ReceiptEngine {
  // Version and Release Configuration
  private static readonly APP_VERSION = '1.0.0';
  private static readonly RELEASE_TAG = 'RELEASE-1.0.0-FINAL';

  private static generateReceiptId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `BR-${timestamp}-${random}`;
  }

  private static generateReferenceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15).toUpperCase();
    return `REF-${timestamp}-${random}`;
  }

  private static generateFreezeId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11).toUpperCase();
    return `FRZ-${timestamp}-${random}`;
  }

  static createReceipt(
    username: string,
    actionConfig: ActionConfig,
    appId: string
  ): ReceiptRecord {
    const timestamp = new Date().toISOString();
    const receiptId = this.generateReceiptId();
    const referenceId = this.generateReferenceId();

    return {
      receiptId,
      referenceId,
      status: 'created',
      timestamp,
      username,
      action: actionConfig.name,
      freezeId: undefined,
      releaseTag: this.RELEASE_TAG,
      apiLog: [
        `[${new Date().toISOString()}] Receipt created - ${this.RELEASE_TAG}`,
        `[${new Date().toISOString()}] Receipt ID: ${receiptId}`,
        `[${new Date().toISOString()}] Reference ID: ${referenceId}`,
      ],
      manifest: {
        appId,
        action: actionConfig.name,
        timestamp,
        piUser: username,
        releaseVersion: this.APP_VERSION,
      },
    };
  }

  static updateReceiptStatus(
    receipt: ReceiptRecord,
    status: ReceiptStatus,
    additionalLog?: string
  ): ReceiptRecord {
    const logEntry = additionalLog || `[${new Date().toISOString()}] Status changed to: ${status}`;
    
    return {
      ...receipt,
      status,
      apiLog: [...receipt.apiLog, logEntry],
    };
  }

  static finalizeReceipt(receipt: ReceiptRecord): ReceiptRecord {
    const freezeId = this.generateFreezeId();
    const freezeTag = `FREEZE-${this.APP_VERSION}`;
    
    return {
      ...receipt,
      status: 'submitted',
      freezeId,
      apiLog: [
        ...receipt.apiLog,
        `[${new Date().toISOString()}] Freeze ID generated: ${freezeId}`,
        `[${new Date().toISOString()}] Freeze Tag: ${freezeTag}`,
        `[${new Date().toISOString()}] Receipt record submitted (approval only)`,
      ],
      manifest: {
        ...receipt.manifest,
        freezeTag,
      },
    };
  }

  static failReceipt(receipt: ReceiptRecord, error: string): ReceiptRecord {
    return {
      ...receipt,
      status: 'failed',
      apiLog: [
        ...receipt.apiLog,
        `[${new Date().toISOString()}] ERROR: ${error}`,
        `[${new Date().toISOString()}] Receipt creation failed`,
      ],
    };
  }
}
