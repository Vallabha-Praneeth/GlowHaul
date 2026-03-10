import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedStatusIndicator } from './AnimatedStatusIndicator';

export type StatusType = 'available' | 'offered' | 'booked' | 'running' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  animated?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; dotClass: string }> = {
  available: { label: 'Available', dotClass: 'bg-status-available' },
  offered: { label: 'Offered', dotClass: 'bg-status-offered' },
  booked: { label: 'Booked', dotClass: 'bg-status-booked' },
  running: { label: 'Running', dotClass: 'bg-status-running' },
  completed: { label: 'Completed', dotClass: 'bg-status-completed' },
  cancelled: { label: 'Cancelled', dotClass: 'bg-status-cancelled' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showDot = true, 
  animated = false,
  className 
}) => {
  const config = statusConfig[status];

  return (
    <span className={cn(`status-badge status-${status}`, className)}>
      {showDot && (
        animated ? (
          <AnimatedStatusIndicator status={status} size="sm" className="w-4 h-4 -ml-0.5" />
        ) : (
          <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass, status === 'available' && 'animate-pulse')} />
        )
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
