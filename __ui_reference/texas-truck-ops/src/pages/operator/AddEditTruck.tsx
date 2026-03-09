import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { RegionChip, RegionType } from '@/components/RegionChip';
import { Camera, Truck, Monitor, MapPin, Check } from 'lucide-react';

const regions: RegionType[] = ['DFW', 'Houston', 'Austin', 'San Antonio', 'El Paso', 'RGV'];

const AddEditTruck = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: isEditing ? 'LED-TX-001' : '',
    plateNumber: isEditing ? 'ABC-1234' : '',
    screenWidth: isEditing ? '20' : '',
    screenHeight: isEditing ? '10' : '',
    resolution: isEditing ? '1920x1080' : '',
    homeRegion: isEditing ? 'DFW' as RegionType : null as RegionType | null,
    operatingRegions: isEditing ? ['DFW', 'Houston'] as RegionType[] : [] as RegionType[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // API call would go here
    navigate('/operator');
  };

  const toggleOperatingRegion = (region: RegionType) => {
    setFormData((prev) => ({
      ...prev,
      operatingRegions: prev.operatingRegions.includes(region)
        ? prev.operatingRegions.filter((r) => r !== region)
        : [...prev.operatingRegions, region],
    }));
  };

  return (
    <div className="mobile-container">
      <ScreenHeader
        title={isEditing ? 'Edit Truck' : 'Add Truck'}
        showBack
        rightAction={
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
          >
            {isEditing ? 'Save' : 'Add'}
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="screen-padding space-y-6">
        {/* Photo Upload */}
        <div className="flex justify-center">
          <button
            type="button"
            className="w-32 h-32 rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <Camera className="w-8 h-8" />
            <span className="text-xs">Add Photo</span>
          </button>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Truck Name / ID
            </label>
            <div className="relative">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="LED-TX-001"
                className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              License Plate
            </label>
            <input
              type="text"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
              placeholder="ABC-1234"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
            />
          </div>
        </div>

        {/* Screen Specs */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Screen Specifications</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Width (ft)
              </label>
              <input
                type="number"
                value={formData.screenWidth}
                onChange={(e) => setFormData({ ...formData, screenWidth: e.target.value })}
                placeholder="20"
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Height (ft)
              </label>
              <input
                type="number"
                value={formData.screenHeight}
                onChange={(e) => setFormData({ ...formData, screenHeight: e.target.value })}
                placeholder="10"
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Resolution
            </label>
            <div className="relative">
              <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                placeholder="1920x1080"
                className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Home Region */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Home Region</h3>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setFormData({ ...formData, homeRegion: region })}
                className={`relative ${formData.homeRegion === region ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full' : ''}`}
              >
                <RegionChip region={region} />
                {formData.homeRegion === region && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Operating Regions */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Operating Regions <span className="text-xs font-normal">(Select multiple)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => toggleOperatingRegion(region)}
                className={`relative ${formData.operatingRegions.includes(region) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full' : ''}`}
              >
                <RegionChip region={region} />
                {formData.operatingRegions.includes(region) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </form>

      <BottomNav role="operator" />
    </div>
  );
};

export default AddEditTruck;
