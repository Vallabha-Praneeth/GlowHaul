import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { RegionChip } from '@/components/RegionChip';
import { User, Calendar, Clock, DollarSign, Truck, Monitor, Building2, X, Check, RefreshCw } from 'lucide-react';

const mockOffer = {
  id: '1',
  status: 'pending' as const,
  slot: {
    truckName: 'LED-TX-001',
    screenSize: '20x10 ft',
    region: 'DFW' as const,
    date: 'January 15, 2025',
    timeWindow: '6:00 PM - 10:00 PM',
    askingPrice: 2500,
  },
  broker: {
    name: 'MediaMax Agency',
    company: 'MediaMax LLC',
    rating: 4.8,
    completedDeals: 24,
  },
  amount: 2400,
  message: 'We\'re running a campaign for a major auto dealership and your truck is perfect for the DFW market. Looking forward to working together!',
  createdAt: '2 hours ago',
  expiresAt: 'in 22 hours',
};

const OfferDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');

  const handleAccept = () => {
    // API call
    navigate('/operator/bookings');
  };

  const handleReject = () => {
    // API call
    navigate('/operator/offers');
  };

  const handleCounter = () => {
    // API call
    setShowCounterModal(false);
    navigate('/operator/offers');
  };

  return (
    <div className="mobile-container">
      <ScreenHeader title="Offer Details" showBack />

      <div className="screen-padding space-y-6">
        {/* Status Banner */}
        <div className="flex items-center justify-between p-4 bg-status-offered-bg rounded-xl border border-status-offered/20">
          <div>
            <p className="text-sm text-muted-foreground">Offer Amount</p>
            <p className="text-2xl font-bold text-foreground">${mockOffer.amount.toLocaleString()}</p>
          </div>
          <StatusBadge status="offered" />
        </div>

        {/* Broker Info */}
        <div className="card-gradient p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{mockOffer.broker.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                <span>{mockOffer.broker.company}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              ⭐ {mockOffer.broker.rating}
            </span>
            <span className="text-muted-foreground">
              {mockOffer.broker.completedDeals} deals
            </span>
          </div>
          {mockOffer.message && (
            <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground italic">
              "{mockOffer.message}"
            </p>
          )}
        </div>

        {/* Slot Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Slot Details</h3>
          <div className="card-gradient p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">{mockOffer.slot.truckName}</span>
              </div>
              <RegionChip region={mockOffer.slot.region} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor className="w-4 h-4" />
                <span>{mockOffer.slot.screenSize}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{mockOffer.slot.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{mockOffer.slot.timeWindow}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Asking: ${mockOffer.slot.askingPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="card-gradient p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Your asking price</span>
            <span className="font-semibold text-foreground">${mockOffer.slot.askingPrice.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Offer amount</span>
            <span className="font-semibold text-primary">${mockOffer.amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Difference</span>
            <span className="font-semibold text-status-cancelled">
              -${(mockOffer.slot.askingPrice - mockOffer.amount).toLocaleString()} ({Math.round((1 - mockOffer.amount / mockOffer.slot.askingPrice) * 100)}%)
            </span>
          </div>
        </div>

        {/* Expiry */}
        <p className="text-center text-sm text-status-offered">
          Expires {mockOffer.expiresAt}
        </p>

        {/* Actions */}
        {mockOffer.status === 'pending' && (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              className="w-full py-4 bg-status-available text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Accept Offer
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCounterModal(true)}
                className="py-3 bg-secondary border border-border rounded-xl font-medium text-foreground flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Counter
              </button>
              <button
                onClick={handleReject}
                className="py-3 bg-status-cancelled-bg border border-status-cancelled/20 rounded-xl font-medium text-status-cancelled flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Counter Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full max-w-md mx-auto bg-card border-t border-border rounded-t-3xl p-6 animate-slide-in-bottom">
            <h3 className="text-lg font-bold text-foreground mb-4">Counter Offer</h3>
            <div className="relative mb-4">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder={mockOffer.slot.askingPrice.toString()}
                className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCounterModal(false)}
                className="py-3 bg-secondary border border-border rounded-xl font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCounter}
                className="py-3 bg-primary text-primary-foreground rounded-xl font-medium"
              >
                Send Counter
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="operator" />
    </div>
  );
};

export default OfferDetail;
