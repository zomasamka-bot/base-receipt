import type { ReceiptStatus } from '@/lib/receipt-types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ReceiptStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: ReceiptStatus) => {
    switch (status) {
      case 'created':
        return {
          label: 'Created',
          className: 'bg-info/10 text-info border-info/20',
        };
      case 'approved':
        return {
          label: 'Approved',
          className: 'bg-success/10 text-success border-success/20',
        };
      case 'submitted':
        return {
          label: 'Submitted',
          className: 'bg-accent/10 text-accent border-accent/20',
        };
      case 'failed':
        return {
          label: 'Failed',
          className: 'bg-destructive/10 text-destructive border-destructive/20',
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
        config.className
      )}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {config.label}
    </div>
  );
}
