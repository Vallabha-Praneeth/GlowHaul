import React from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge, StatusType } from './StatusBadge';
import { DollarSign, Clock, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export interface OfferData {
  id: string;
  slotName: string;
  counterparty: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  direction: 'sent' | 'received';
  createdAt: string;
  expiresAt?: string;
}

interface OfferCardProps {
  offer: OfferData;
  onClick?: () => void;
  className?: string;
}

const offerStatusMap: Record<OfferData['status'], StatusType> = {
  pending: 'offered',
  accepted: 'booked',
  rejected: 'cancelled',
  countered: 'offered',
};

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onClick, className }) => {
  const DirectionIcon = offer.direction === 'sent' ? ArrowUpRight : ArrowDownLeft;

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
            <DirectionIcon className={cn(
              'w-4 h-4',
              offer.direction === 'sent' ? 'text-status-offered' : 'text-primary'
            )} />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {offer.direction === 'sent' ? 'Sent to' : 'Received from'}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{offer.counterparty}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{offer.slotName}</p>
        </div>
        <StatusBadge status={offerStatusMap[offer.status]} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span className="text-foreground font-semibold">${offer.amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{offer.createdAt}</span>
          </div>
        </div>
        {onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
      </div>

      {offer.expiresAt && offer.status === 'pending' && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-status-offered">Expires {offer.expiresAt}</p>
        </div>
      )}
    </button>
  );
};

export default OfferCard;
