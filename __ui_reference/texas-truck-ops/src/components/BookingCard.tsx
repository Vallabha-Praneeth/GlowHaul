import React from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge, StatusType } from './StatusBadge';
import { RegionChip, RegionType } from './RegionChip';
import { Calendar, Truck, User, ChevronRight } from 'lucide-react';

export interface BookingData {
  id: string;
  truckName: string;
  region: RegionType;
  date: string;
  status: StatusType;
  operatorName?: string;
  brokerName?: string;
  driverName?: string;
  amount: number;
}

interface BookingCardProps {
  booking: BookingData;
  onClick?: () => void;
  showRole?: 'operator' | 'broker' | 'driver';
  className?: string;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick, showRole, className }) => {
  const getCounterpartyInfo = () => {
    switch (showRole) {
      case 'operator':
        return { label: 'Broker', name: booking.brokerName };
      case 'broker':
        return { label: 'Operator', name: booking.operatorName };
      case 'driver':
        return { label: 'Operator', name: booking.operatorName };
      default:
        return null;
    }
  };

  const counterparty = getCounterpartyInfo();

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
            <Truck className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">{booking.truckName}</h3>
          </div>
          <RegionChip region={booking.region} className="mt-1" />
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{booking.date}</span>
        </div>
        {counterparty && counterparty.name && (
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>{counterparty.label}: {counterparty.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-primary font-bold">${booking.amount.toLocaleString()}</span>
        {onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
      </div>
    </button>
  );
};

export default BookingCard;
