import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedStatusIndicator } from './AnimatedStatusIndicator';
import { StatusType } from './StatusBadge';

interface StatusDisplayProps {
  status: StatusType;
  title: string;
  subtitle?: string;
  value?: string | number;
  className?: string;
}

const statusLabels: Record<StatusType, string> = {
  available: 'Available',
  offered: 'Offer Pending',
  booked: 'Booked',
  running: 'Campaign Running',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusBgClasses: Record<StatusType, string> = {
  available: 'bg-status-available-bg border-status-available/20',
  offered: 'bg-status-offered-bg border-status-offered/20',
  booked: 'bg-status-booked-bg border-status-booked/20',
  running: 'bg-status-running-bg border-status-running/20',
  completed: 'bg-status-completed-bg border-status-completed/20',
  cancelled: 'bg-status-cancelled-bg border-status-cancelled/20',
};

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  status,
  title,
  subtitle,
  value,
  className,
}) => {
  return (
    <div className={cn('p-4 rounded-xl border', statusBgClasses[status], className)}>
      <div className="flex items-center gap-4">
        <AnimatedStatusIndicator status={status} size="lg" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-semibold text-foreground">{statusLabels[status]}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {value && (
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusDisplay;
