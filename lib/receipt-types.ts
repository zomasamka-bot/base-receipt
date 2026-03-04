export type ReceiptStatus = 
  | 'created'
  | 'approved'
  | 'submitted'
  | 'failed';

export type ReceiptRecord = {
  receiptId: string;
  referenceId: string;
  status: ReceiptStatus;
  timestamp: string;
  username: string;
  action: string;
  freezeId?: string;
  releaseTag?: string;
  apiLog: string[];
  manifest: {
    appId: string;
    action: string;
    timestamp: string;
    piUser: string;
    releaseVersion: string;
    freezeTag?: string;
  };
};

export type ActionConfig = {
  id: string;
  name: string;
  description: string;
  requiresApproval: boolean;
};
