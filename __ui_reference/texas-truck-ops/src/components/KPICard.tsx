import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ icon: Icon, label, value, trend, className }) => {
  return (
    <div className={cn('kpi-card', className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {trend && (
        <p className={cn(
          'text-xs mt-1',
          trend.isPositive ? 'text-status-available' : 'text-status-cancelled'
        )}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last week
        </p>
      )}
    </div>
  );
};

export default KPICard;
