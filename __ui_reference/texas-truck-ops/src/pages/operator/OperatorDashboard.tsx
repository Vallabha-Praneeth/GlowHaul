import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { KPICard } from '@/components/KPICard';
import { SlotCard, SlotData } from '@/components/SlotCard';
import { OfferCard, OfferData } from '@/components/OfferCard';
import { Truck, Layers, Mail, Calendar, Plus, Bell } from 'lucide-react';

// Mock data
const mockSlots: SlotData[] = [
  {
    id: '1',
    truckName: 'LED-TX-001',
    screenSize: '10x20 ft',
    region: 'DFW',
    date: 'Jan 15',
    timeWindow: '6PM-10PM',
    price: 2500,
    status: 'available',
    isVerified: true,
  },
  {
    id: '2',
    truckName: 'LED-TX-002',
    screenSize: '8x16 ft',
    region: 'Houston',
    date: 'Jan 16',
    timeWindow: '5PM-9PM',
    price: 2000,
    status: 'offered',
    isVerified: true,
  },
];

const mockOffers: OfferData[] = [
  {
    id: '1',
    slotName: 'LED-TX-001 • Jan 15',
    counterparty: 'MediaMax Agency',
    amount: 2400,
    status: 'pending',
    direction: 'received',
    createdAt: '2h ago',
    expiresAt: 'in 22h',
  },
];

const OperatorDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="px-4 py-4 bg-background/95 backdrop-blur-lg sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Good morning</p>
            <h1 className="text-xl font-bold text-foreground">Texas Fleet Co.</h1>
          </div>
          <button className="tap-target relative">
            <Bell className="w-6 h-6 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      <div className="screen-padding space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            icon={Layers}
            label="Active Slots"
            value={12}
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            icon={Mail}
            label="Pending Offers"
            value={3}
          />
          <KPICard
            icon={Calendar}
            label="Upcoming Runs"
            value={5}
          />
          <KPICard
            icon={Truck}
            label="Fleet Size"
            value={4}
          />
        </div>

        {/* Recent Slots */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Active Slots</h2>
            <button
              onClick={() => navigate('/operator/slots')}
              className="text-sm text-primary font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {mockSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onClick={() => navigate(`/operator/slots/${slot.id}`)}
              />
            ))}
          </div>
        </section>

        {/* Recent Offers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Recent Offers</h2>
            <button
              onClick={() => navigate('/operator/offers')}
              className="text-sm text-primary font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {mockOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onClick={() => navigate(`/operator/offers/${offer.id}`)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/operator/slots/new')}
        className="fab"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav role="operator" />
    </div>
  );
};

export default OperatorDashboard;
