import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { KPICard } from '@/components/KPICard';
import { BookingCard, BookingData } from '@/components/BookingCard';
import { EmptyState } from '@/components/EmptyState';
import { Calendar, DollarSign, Clock, MapPin, Bell, Truck } from 'lucide-react';

const mockRuns: BookingData[] = [
  {
    id: '1',
    truckName: 'LED-TX-001',
    region: 'DFW',
    date: 'Today • 6PM-10PM',
    status: 'running',
    operatorName: 'Texas Fleet Co.',
    amount: 150,
  },
  {
    id: '2',
    truckName: 'LED-TX-001',
    region: 'Houston',
    date: 'Tomorrow • 5PM-9PM',
    status: 'booked',
    operatorName: 'Texas Fleet Co.',
    amount: 140,
  },
  {
    id: '3',
    truckName: 'LED-TX-001',
    region: 'Austin',
    date: 'Jan 18 • 6PM-10PM',
    status: 'booked',
    operatorName: 'Texas Fleet Co.',
    amount: 150,
  },
];

const DriverDashboard = () => {
  const navigate = useNavigate();
  const activeRun = mockRuns.find((r) => r.status === 'running');
  const upcomingRuns = mockRuns.filter((r) => r.status === 'booked');

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="px-4 py-4 bg-background/95 backdrop-blur-lg sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-xl font-bold text-foreground">John Driver</h1>
          </div>
          <button className="tap-target relative">
            <Bell className="w-6 h-6 text-foreground" />
          </button>
        </div>
      </header>

      <div className="screen-padding space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <KPICard
            icon={Calendar}
            label="This Week"
            value={5}
          />
          <KPICard
            icon={Clock}
            label="Hours"
            value="18h"
          />
          <KPICard
            icon={DollarSign}
            label="Earnings"
            value="$740"
          />
        </div>

        {/* Active Run */}
        {activeRun && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Active Run
            </h2>
            <div className="relative">
              <div className="absolute -inset-1 bg-status-running/20 rounded-2xl animate-pulse" />
              <BookingCard
                booking={activeRun}
                showRole="driver"
                onClick={() => navigate(`/driver/runs/${activeRun.id}`)}
              />
            </div>
          </section>
        )}

        {/* Upcoming Runs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Runs</h2>
            <button
              onClick={() => navigate('/driver/runs')}
              className="text-sm text-primary font-medium"
            >
              View all
            </button>
          </div>
          {upcomingRuns.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No upcoming runs"
              description="Check back later for new assignments."
            />
          ) : (
            <div className="space-y-3">
              {upcomingRuns.map((run) => (
                <BookingCard
                  key={run.id}
                  booking={run}
                  showRole="driver"
                  onClick={() => navigate(`/driver/runs/${run.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default DriverDashboard;
