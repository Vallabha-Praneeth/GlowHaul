import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { RegionChip } from '@/components/RegionChip';
import { Truck, Monitor, Calendar, Clock, DollarSign, User, Building2, Star, CheckCircle2 } from 'lucide-react';

const mockSlot = {
  id: '1',
  truckName: 'LED-TX-001',
  screenSize: '20x10 ft',
  resolution: '1920x1080',
  region: 'DFW' as const,
  date: 'January 15, 2025',
  timeWindow: '6:00 PM - 10:00 PM',
  price: 2500,
  status: 'available' as const,
  isVerified: true,
  operator: {
    name: 'Texas Fleet Co.',
    rating: 4.9,
    completedRuns: 156,
    responseTime: '< 2h',
  },
  notes: 'Premium location coverage. Driver included. Content must be approved 24h before run.',
};

const SlotDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="mobile-container">
      <ScreenHeader title="Slot Details" showBack />

      <div className="screen-padding space-y-6">
        {/* Hero */}
        <div className="card-gradient p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{mockSlot.truckName}</h2>
                  {mockSlot.isVerified && (
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                  )}
                </div>
                <RegionChip region={mockSlot.region} className="mt-1" />
              </div>
            </div>
            <StatusBadge status={mockSlot.status} />
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-muted-foreground">Price</span>
            <span className="text-2xl font-bold text-primary">${mockSlot.price.toLocaleString()}</span>
          </div>
        </div>

        {/* Slot Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-gradient p-3">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Monitor className="w-4 h-4" />
                <span className="text-xs">Screen</span>
              </div>
              <p className="font-semibold text-foreground">{mockSlot.screenSize}</p>
              <p className="text-xs text-muted-foreground">{mockSlot.resolution}</p>
            </div>
            <div className="card-gradient p-3">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Date</span>
              </div>
              <p className="font-semibold text-foreground">{mockSlot.date}</p>
            </div>
            <div className="card-gradient p-3 col-span-2">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Time Window</span>
              </div>
              <p className="font-semibold text-foreground">{mockSlot.timeWindow}</p>
            </div>
          </div>
        </div>

        {/* Operator */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Operator</h3>
          <div className="card-gradient p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{mockSlot.operator.name}</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="w-3.5 h-3.5 fill-status-offered text-status-offered" />
                  <span>{mockSlot.operator.rating}</span>
                  <span>•</span>
                  <span>{mockSlot.operator.completedRuns} runs</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Avg. response: {mockSlot.operator.responseTime}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {mockSlot.notes && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notes</h3>
            <p className="text-sm text-muted-foreground">{mockSlot.notes}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate(`/broker/slots/${id}/offer`)}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg glow-primary"
        >
          Send Offer
        </button>
      </div>

      <BottomNav role="broker" />
    </div>
  );
};

export default SlotDetail;
