import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { KPICard } from '@/components/KPICard';
import { BookingCard, BookingData } from '@/components/BookingCard';
import { OfferCard, OfferData } from '@/components/OfferCard';
import { FileText, Mail, Calendar, TrendingUp, Search, Bell } from 'lucide-react';

const mockBookings: BookingData[] = [
  {
    id: '1',
    truckName: 'LED-TX-001',
    region: 'DFW',
    date: 'Jan 15 • 6PM-10PM',
    status: 'booked',
    operatorName: 'Texas Fleet Co.',
    amount: 2400,
  },
];

const mockOffers: OfferData[] = [
  {
    id: '1',
    slotName: 'LED-TX-003 • Jan 20, Austin',
    counterparty: 'Lone Star Trucks',
    amount: 2000,
    status: 'pending',
    direction: 'sent',
    createdAt: '4h ago',
    expiresAt: 'in 20h',
  },
];

const BrokerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="px-4 py-4 bg-background/95 backdrop-blur-lg sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Good morning</p>
            <h1 className="text-xl font-bold text-foreground">MediaMax Agency</h1>
          </div>
          <button className="tap-target relative">
            <Bell className="w-6 h-6 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      <div className="screen-padding space-y-6">
        {/* Search CTA */}
        <button
          onClick={() => navigate('/broker/search')}
          className="w-full flex items-center gap-3 p-4 bg-secondary border border-border rounded-xl hover:border-primary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">Find LED Trucks</p>
            <p className="text-sm text-muted-foreground">Search marketplace across Texas</p>
          </div>
        </button>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            icon={FileText}
            label="Active Requests"
            value={3}
          />
          <KPICard
            icon={Mail}
            label="Pending Offers"
            value={2}
          />
          <KPICard
            icon={Calendar}
            label="Upcoming Runs"
            value={4}
          />
          <KPICard
            icon={TrendingUp}
            label="This Month"
            value="$12.4K"
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Pending Offers */}
        {mockOffers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Pending Offers</h2>
              <button
                onClick={() => navigate('/broker/offers')}
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
                  onClick={() => navigate(`/broker/offers/${offer.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Bookings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Bookings</h2>
            <button
              onClick={() => navigate('/broker/bookings')}
              className="text-sm text-primary font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {mockBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                showRole="broker"
                onClick={() => navigate(`/bookings/${booking.id}`)}
              />
            ))}
          </div>
        </section>
      </div>

      <BottomNav role="broker" />
    </div>
  );
};

export default BrokerDashboard;
