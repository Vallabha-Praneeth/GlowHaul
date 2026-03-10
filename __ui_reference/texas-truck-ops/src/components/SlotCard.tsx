import React from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge, StatusType } from './StatusBadge';
import { RegionChip, RegionType } from './RegionChip';
import { Calendar, Clock, Monitor, DollarSign, ChevronRight } from 'lucide-react';

export interface SlotData {
  id: string;
  truckName: string;
  screenSize: string;
  region: RegionType;
  date: string;
  timeWindow: string;
  price: number;
  status: StatusType;
  isVerified?: boolean;
}

interface SlotCardProps {
  slot: SlotData;
  onClick?: () => void;
  className?: string;
}

export const SlotCard: React.FC<SlotCardProps> = ({ slot, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left card-gradient p-4 transition-all active:scale-[0.98]',
        onClick && 'cursor-pointer hover:border-primary/50',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{slot.truckName}</h3>
            {slot.isVerified && (
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <RegionChip region={slot.region} className="mt-1" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={slot.status} animated={slot.status === 'available' || slot.status === 'running'} />
          <div className="flex items-center text-primary font-bold text-lg">
            <DollarSign className="w-4 h-4" />
            {slot.price.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Monitor className="w-4 h-4" />
          <span>{slot.screenSize}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{slot.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{slot.timeWindow}</span>
        </div>
      </div>

      {onClick && (
        <div className="flex justify-end mt-3 pt-3 border-t border-border">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </button>
  );
};

export default SlotCard;
