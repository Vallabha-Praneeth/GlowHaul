import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { RegionChip, RegionType } from '@/components/RegionChip';
import { Calendar, Clock, DollarSign, Truck, ChevronDown } from 'lucide-react';

const regions: RegionType[] = ['DFW', 'Houston', 'Austin', 'San Antonio', 'El Paso', 'RGV'];

const mockTrucks = [
  { id: '1', name: 'LED-TX-001', screenSize: '20x10 ft' },
  { id: '2', name: 'LED-TX-002', screenSize: '16x8 ft' },
  { id: '3', name: 'LED-TX-003', screenSize: '12x6 ft' },
];

const AddEditSlot = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    truckId: isEditing ? '1' : '',
    region: isEditing ? 'DFW' as RegionType : null as RegionType | null,
    date: isEditing ? '2025-01-15' : '',
    startTime: isEditing ? '18:00' : '',
    endTime: isEditing ? '22:00' : '',
    price: isEditing ? '2500' : '',
    notes: '',
  });

  const [showTruckPicker, setShowTruckPicker] = useState(false);
  const selectedTruck = mockTrucks.find((t) => t.id === formData.truckId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/operator/slots');
  };

  return (
    <div className="mobile-container">
      <ScreenHeader
        title={isEditing ? 'Edit Slot' : 'Add Availability'}
        showBack
        rightAction={
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
          >
            {isEditing ? 'Save' : 'Publish'}
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="screen-padding space-y-6">
        {/* Truck Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Select Truck</label>
          <button
            type="button"
            onClick={() => setShowTruckPicker(!showTruckPicker)}
            className="w-full flex items-center justify-between px-4 py-3 bg-secondary border border-border rounded-xl text-left"
          >
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-muted-foreground" />
              {selectedTruck ? (
                <div>
                  <p className="text-foreground font-medium">{selectedTruck.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedTruck.screenSize}</p>
                </div>
              ) : (
                <span className="text-muted-foreground">Choose a truck</span>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showTruckPicker ? 'rotate-180' : ''}`} />
          </button>
          
          {showTruckPicker && (
            <div className="bg-secondary border border-border rounded-xl overflow-hidden">
              {mockTrucks.map((truck) => (
                <button
                  key={truck.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, truckId: truck.id });
                    setShowTruckPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border last:border-b-0 ${
                    formData.truckId === truck.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                >
                  <Truck className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-foreground font-medium">{truck.name}</p>
                    <p className="text-sm text-muted-foreground">{truck.screenSize}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Region */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Operating Region</label>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <RegionChip
                key={region}
                region={region}
                selected={formData.region === region}
                onClick={() => setFormData({ ...formData, region })}
              />
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Time Window */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Time Window</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Asking Price ($)</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="2500"
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any special requirements or notes..."
            rows={3}
            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
      </form>

      <BottomNav role="operator" />
    </div>
  );
};

export default AddEditSlot;
