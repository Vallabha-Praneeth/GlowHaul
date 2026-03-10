import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { RegionChip } from '@/components/RegionChip';
import { SlotCard, SlotData } from '@/components/SlotCard';
import { Edit, Truck, Monitor, MapPin, Calendar, Settings } from 'lucide-react';

const mockTruck = {
  id: '1',
  name: 'LED-TX-001',
  plateNumber: 'ABC-1234',
  screenSize: '20x10 ft',
  resolution: '1920x1080',
  homeRegion: 'DFW' as const,
  operatingRegions: ['DFW', 'Houston', 'Austin'] as const,
  status: 'active' as const,
  isVerified: true,
  imageUrl: null,
};

const mockSlots: SlotData[] = [
  {
    id: '1',
    truckName: 'LED-TX-001',
    screenSize: '20x10 ft',
    region: 'DFW',
    date: 'Jan 15',
    timeWindow: '6PM-10PM',
    price: 2500,
    status: 'available',
    isVerified: true,
  },
  {
    id: '2',
    truckName: 'LED-TX-001',
    screenSize: '20x10 ft',
    region: 'Houston',
    date: 'Jan 18',
    timeWindow: '5PM-9PM',
    price: 2200,
    status: 'booked',
    isVerified: true,
  },
];

const TruckDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="mobile-container">
      <ScreenHeader
        title="Truck Details"
        showBack
        rightAction={
          <button
            onClick={() => navigate(`/operator/trucks/${id}/edit`)}
            className="tap-target"
          >
            <Edit className="w-5 h-5 text-foreground" />
          </button>
        }
      />

      <div className="screen-padding space-y-6">
        {/* Truck Hero */}
        <div className="card-gradient p-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center">
              <Truck className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-foreground">{mockTruck.name}</h2>
                {mockTruck.isVerified && (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">Plate: {mockTruck.plateNumber}</p>
              <StatusBadge status="available" />
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Specifications</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-gradient p-4">
              <div className="flex items-center gap-2 mb-1">
                <Monitor className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Screen Size</span>
              </div>
              <p className="text-foreground font-semibold">{mockTruck.screenSize}</p>
            </div>
            <div className="card-gradient p-4">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Resolution</span>
              </div>
              <p className="text-foreground font-semibold">{mockTruck.resolution}</p>
            </div>
          </div>
        </div>

        {/* Regions */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Operating Regions</h3>
          <div className="flex flex-wrap gap-2">
            {mockTruck.operatingRegions.map((region) => (
              <RegionChip key={region} region={region} />
            ))}
          </div>
        </div>

        {/* Active Slots */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Active Slots ({mockSlots.length})
            </h3>
            <button
              onClick={() => navigate('/operator/slots/new')}
              className="text-sm text-primary font-medium"
            >
              + Add Slot
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
        </div>
      </div>

      <BottomNav role="operator" />
    </div>
  );
};

export default TruckDetail;
