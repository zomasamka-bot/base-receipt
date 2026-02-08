import type { ReceiptRecord } from '@/lib/receipt-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './status-badge';
import { FileCheck2, Hash, Calendar, User, Lock, Tag } from 'lucide-react';

interface ReceiptCardProps {
  receipt: ReceiptRecord;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <FileCheck2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Base Receipt</CardTitle>
              <p className="text-sm text-muted-foreground">{receipt.action}</p>
            </div>
          </div>
          <StatusBadge status={receipt.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Release Tag */}
        {receipt.releaseTag && (
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{receipt.releaseTag}</span>
          </div>
        )}

        {/* Receipt ID */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Hash className="w-4 h-4" />
            Receipt ID
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 font-mono text-sm break-all">
            {receipt.receiptId}
          </div>
        </div>

        {/* Reference ID */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Hash className="w-4 h-4" />
            Reference ID
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 font-mono text-sm break-all">
            {receipt.referenceId}
          </div>
        </div>

        {/* Freeze ID (if available) */}
        {receipt.freezeId && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lock className="w-4 h-4" />
              Freeze ID
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20 font-mono text-sm break-all text-accent">
              {receipt.freezeId}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              Pi User
            </div>
            <div className="text-sm font-medium">{receipt.username}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              Timestamp
            </div>
            <div className="text-sm font-medium">
              {new Date(receipt.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Manifest */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Manifest
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <pre className="text-xs font-mono overflow-x-auto">
              {JSON.stringify(receipt.manifest, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
