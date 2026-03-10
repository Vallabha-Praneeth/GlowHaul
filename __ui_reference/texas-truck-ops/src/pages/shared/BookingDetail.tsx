import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge, StatusType } from '@/components/StatusBadge';
import { RegionChip } from '@/components/RegionChip';
import { Truck, Calendar, Clock, DollarSign, User, Building2, CheckCircle2 } from 'lucide-react';

interface TimelineEvent {
  id: string;
  status: StatusType;
  label: string;
  timestamp: string;
  isActive: boolean;
  isCompleted: boolean;
}

const mockBooking = {
  id: '1',
  truckName: 'LED-TX-001',
  screenSize: '20x10 ft',
  region: 'DFW' as const,
  date: 'January 15, 2025',
  timeWindow: '6:00 PM - 10:00 PM',
  status: 'booked' as StatusType,
  amount: 2400,
  operator: {
    name: 'Texas Fleet Co.',
    company: 'Texas Fleet LLC',
  },
  broker: {
    name: 'MediaMax Agency',
    company: 'MediaMax LLC',
  },
  driver: {
    name: 'John Driver',
  },
  timeline: [
    { id: '1', status: 'offered' as StatusType, label: 'Offer Sent', timestamp: 'Jan 10, 2:30 PM', isActive: false, isCompleted: true },
    { id: '2', status: 'booked' as StatusType, label: 'Booking Confirmed', timestamp: 'Jan 10, 4:15 PM', isActive: true, isCompleted: true },
    { id: '3', status: 'running' as StatusType, label: 'Campaign Running', timestamp: 'Scheduled', isActive: false, isCompleted: false },
    { id: '4', status: 'completed' as StatusType, label: 'Completed', timestamp: 'Pending', isActive: false, isCompleted: false },
  ] as TimelineEvent[],
};

const BookingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="mobile-container pb-8">
      <ScreenHeader title="Booking Details" showBack />

      <div className="screen-padding space-y-6">
        {/* Hero */}
        <div className="card-gradient p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{mockBooking.truckName}</h2>
                <p className="text-sm text-muted-foreground">{mockBooking.screenSize}</p>
              </div>
            </div>
            <StatusBadge status={mockBooking.status} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <RegionChip region={mockBooking.region} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{mockBooking.date}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{mockBooking.timeWindow}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-2xl font-bold text-primary">${mockBooking.amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Status Timeline</h3>
          <div className="relative">
            {mockBooking.timeline.map((event, index) => (
              <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                {/* Timeline line and dot */}
                <div className="relative flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center z-10 ${
                    event.isCompleted 
                      ? 'bg-primary' 
                      : event.isActive 
                        ? 'bg-primary animate-pulse' 
                        : 'bg-secondary border-2 border-border'
                  }`}>
                    {event.isCompleted && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  {index < mockBooking.timeline.length - 1 && (
                    <div className={`absolute top-4 w-0.5 h-full ${
                      event.isCompleted ? 'bg-primary' : 'bg-border'
                    }`} />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 -mt-0.5">
                  <p className={`font-medium ${event.isCompleted || event.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {event.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parties */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Parties</h3>
          
          <div className="space-y-3">
            {/* Operator */}
            <div className="card-gradient p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Operator</p>
                <p className="font-semibold text-foreground">{mockBooking.operator.name}</p>
              </div>
            </div>

            {/* Broker */}
            <div className="card-gradient p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Broker</p>
                <p className="font-semibold text-foreground">{mockBooking.broker.name}</p>
              </div>
            </div>

            {/* Driver */}
            {mockBooking.driver && (
              <div className="card-gradient p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="font-semibold text-foreground">{mockBooking.driver.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-secondary border border-border rounded-xl font-medium text-foreground">
            Contact
          </button>
          <button className="flex-1 py-3 bg-secondary border border-border rounded-xl font-medium text-foreground">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
