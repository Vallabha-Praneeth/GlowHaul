import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusDisplay } from '@/components/StatusDisplay';
import { RegionChip } from '@/components/RegionChip';
import { Truck, Calendar, Clock, MapPin, Navigation, Phone, User, Camera, CheckCircle2 } from 'lucide-react';

const mockRun = {
  id: '1',
  truckName: 'LED-TX-001',
  plateNumber: 'ABC-1234',
  region: 'DFW' as const,
  date: 'January 15, 2025',
  timeWindow: '6:00 PM - 10:00 PM',
  status: 'running' as const,
  operator: {
    name: 'Texas Fleet Co.',
    phone: '+1 (512) 555-0123',
  },
  route: {
    startLocation: 'Downtown Dallas',
    endLocation: 'Uptown Dallas',
    stops: ['Deep Ellum', 'Victory Park', 'Knox-Henderson'],
  },
  campaign: {
    name: 'Auto Dealership Promo',
    advertiser: 'MediaMax Agency',
  },
  payout: 150,
  checklist: [
    { id: '1', label: 'Inspect truck exterior', completed: true },
    { id: '2', label: 'Verify LED screens working', completed: true },
    { id: '3', label: 'Check fuel level', completed: false },
    { id: '4', label: 'Load campaign content', completed: false },
  ],
};

const RunDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="mobile-container">
      <ScreenHeader title="Run Details" showBack />

      <div className="screen-padding space-y-6">
        {/* Status Banner with Animation */}
        <StatusDisplay
          status={mockRun.status}
          title="Current Status"
          subtitle={`${mockRun.truckName} • ${mockRun.plateNumber}`}
          value={`$${mockRun.payout}`}
        />

        {/* Schedule */}
        <div className="card-gradient p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold text-foreground">{mockRun.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Time Window</p>
              <p className="font-semibold text-foreground">{mockRun.timeWindow}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Region</p>
              <RegionChip region={mockRun.region} />
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Route</h3>
          <div className="card-gradient p-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-status-available" />
                <div className="w-0.5 h-16 bg-border" />
                <div className="w-3 h-3 rounded-full bg-status-cancelled" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start</p>
                  <p className="font-semibold text-foreground">{mockRun.route.startLocation}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mockRun.route.stops.map((stop) => (
                    <span key={stop} className="text-xs px-2 py-1 bg-secondary rounded-full text-muted-foreground">
                      {stop}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End</p>
                  <p className="font-semibold text-foreground">{mockRun.route.endLocation}</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-3 bg-secondary border border-border rounded-xl font-medium text-foreground flex items-center justify-center gap-2 hover:border-primary/50 transition-colors">
              <Navigation className="w-5 h-5" />
              Open in Maps
            </button>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pre-Run Checklist</h3>
          <div className="space-y-2">
            {mockRun.checklist.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  item.completed ? 'bg-status-available-bg border-status-available/20' : 'bg-secondary border-border'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  item.completed ? 'bg-status-available' : 'border-2 border-muted-foreground'
                }`}>
                  {item.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="card-gradient p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operator</p>
                <p className="font-semibold text-foreground">{mockRun.operator.name}</p>
              </div>
            </div>
            <a
              href={`tel:${mockRun.operator.phone}`}
              className="tap-target w-12 h-12 rounded-full bg-primary flex items-center justify-center"
            >
              <Phone className="w-5 h-5 text-primary-foreground" />
            </a>
          </div>
        </div>

        {/* Proof Upload CTA */}
        {mockRun.status === 'running' && (
          <button
            onClick={() => navigate(`/driver/runs/${id}/proof`)}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg flex items-center justify-center gap-2 glow-primary"
          >
            <Camera className="w-5 h-5" />
            Upload Proof of Service
          </button>
        )}
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default RunDetail;
