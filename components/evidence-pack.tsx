import type { ReceiptRecord } from '@/lib/receipt-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CheckCircle2 } from 'lucide-react';

interface EvidencePackProps {
  receipt: ReceiptRecord;
}

export function EvidencePack({ receipt }: EvidencePackProps) {
  const evidenceItems = [
    {
      label: 'Receipt ID',
      value: receipt.receiptId,
      included: true,
    },
    {
      label: 'Reference ID',
      value: receipt.referenceId,
      included: true,
    },
    {
      label: 'Status',
      value: receipt.status.toUpperCase(),
      included: true,
    },
    {
      label: 'Timestamp',
      value: receipt.timestamp,
      included: true,
    },
    {
      label: 'Activity Log',
      value: `${receipt.apiLog.length} entries`,
      included: true,
    },
    {
      label: 'Manifest',
      value: 'Complete',
      included: true,
    },
    {
      label: 'Freeze ID',
      value: receipt.freezeId || 'Pending submission',
      included: !!receipt.freezeId,
    },
    {
      label: 'Release Tag',
      value: receipt.releaseTag || 'N/A',
      included: !!receipt.releaseTag,
    },
  ];

  return (
    <Card className="w-full border-accent/30 bg-accent/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
            <Package className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-base">Evidence Pack</CardTitle>
            <p className="text-xs text-muted-foreground">
              Complete record with all required evidence
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {evidenceItems.map((item, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-4 p-2 rounded-lg bg-background/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2
                  className={`w-4 h-4 flex-shrink-0 ${
                    item.included ? 'text-success' : 'text-muted-foreground'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
