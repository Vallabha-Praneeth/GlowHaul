import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { RegionChip, RegionType } from '@/components/RegionChip';
import { SlotCard, SlotData } from '@/components/SlotCard';
import { EmptyState } from '@/components/EmptyState';
import { TexasMap, TruckMarker } from '@/components/TexasMap';
import { Search, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

const regions: RegionType[] = ['DFW', 'Houston', 'Austin', 'San Antonio', 'El Paso', 'RGV'];

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
    truckName: 'LED-TX-005',
    screenSize: '16x8 ft',
    region: 'DFW',
    date: 'Jan 16',
    timeWindow: '4PM-8PM',
    price: 1800,
    status: 'available',
    isVerified: true,
  },
  {
    id: '3',
    truckName: 'LED-HOU-002',
    screenSize: '12x6 ft',
    region: 'Houston',
    date: 'Jan 17',
    timeWindow: '5PM-9PM',
    price: 1500,
    status: 'available',
    isVerified: false,
  },
  {
    id: '4',
    truckName: 'LED-AUS-001',
    screenSize: '20x10 ft',
    region: 'Austin',
    date: 'Jan 18',
    timeWindow: '6PM-10PM',
    price: 2200,
    status: 'available',
    isVerified: true,
  },
  {
    id: '5',
    truckName: 'LED-SA-001',
    screenSize: '16x8 ft',
    region: 'San Antonio',
    date: 'Jan 19',
    timeWindow: '5PM-9PM',
    price: 1900,
    status: 'offered',
    isVerified: true,
  },
  {
    id: '6',
    truckName: 'LED-EP-001',
    screenSize: '12x6 ft',
    region: 'El Paso',
    date: 'Jan 20',
    timeWindow: '6PM-10PM',
    price: 1600,
    status: 'available',
    isVerified: false,
  },
];

// Convert slots to map markers with coordinates
const slotToMarker = (slot: SlotData, index: number): TruckMarker => {
  const regionCoords: Record<RegionType, { lat: number; lng: number }> = {
    'DFW': { lat: 32.7767, lng: -96.7970 },
    'Houston': { lat: 29.7604, lng: -95.3698 },
    'Austin': { lat: 30.2672, lng: -97.7431 },
    'San Antonio': { lat: 29.4241, lng: -98.4936 },
    'El Paso': { lat: 31.7619, lng: -106.4850 },
    'RGV': { lat: 26.2034, lng: -98.2300 },
  };
  
  const base = regionCoords[slot.region];
  // Add slight offset for multiple trucks in same region
  const offset = (index % 5) * 0.02;
  
  return {
    id: slot.id,
    truckName: slot.truckName,
    region: slot.region,
    lat: base.lat + offset,
    lng: base.lng + offset,
    status: slot.status,
    price: slot.price,
    date: slot.date,
    timeWindow: slot.timeWindow,
    screenSize: slot.screenSize,
    isVerified: slot.isVerified,
  };
};

const MarketplaceSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<RegionType[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    verifiedOnly: false,
    minScreenWidth: '',
    maxPrice: '',
    dateFrom: '',
    dateTo: '',
  });
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const toggleRegion = (region: RegionType) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const filteredSlots = mockSlots.filter((slot) => {
    if (selectedRegions.length > 0 && !selectedRegions.includes(slot.region)) return false;
    if (filters.verifiedOnly && !slot.isVerified) return false;
    if (filters.maxPrice && slot.price > parseInt(filters.maxPrice)) return false;
    if (searchQuery && !slot.truckName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const mapMarkers = filteredSlots.map((slot, index) => slotToMarker(slot, index));

  const activeFilterCount = [
    filters.verifiedOnly,
    filters.minScreenWidth,
    filters.maxPrice,
    filters.dateFrom,
  ].filter(Boolean).length;

  const handleMarkerClick = (marker: TruckMarker) => {
    navigate(`/broker/slots/${marker.id}`);
  };

  return (
    <div className="mobile-container">
      <ScreenHeader title="Marketplace" subtitle={`${filteredSlots.length} slots available`} />

      <div className="px-4 pb-2 space-y-3">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trucks..."
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`tap-target px-4 border rounded-xl transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-secondary border-border text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="ml-1 text-sm">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Region Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {regions.map((region) => (
            <RegionChip
              key={region}
              region={region}
              selected={selectedRegions.includes(region)}
              onClick={() => toggleRegion(region)}
            />
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card-gradient p-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Filters</h3>
              <button
                onClick={() => setFilters({ verifiedOnly: false, minScreenWidth: '', maxPrice: '', dateFrom: '', dateTo: '' })}
                className="text-sm text-primary"
              >
                Clear all
              </button>
            </div>

            {/* Verified Only */}
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Verified trucks only</span>
              </div>
              <button
                onClick={() => setFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })}
                className={`w-12 h-7 rounded-full transition-colors ${
                  filters.verifiedOnly ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    filters.verifiedOnly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            {/* Max Price */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Max Price ($)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                placeholder="5000"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex bg-secondary rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'map' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      <div className="screen-padding pt-2">
        {viewMode === 'map' ? (
          /* Interactive Map View */
          <TexasMap
            markers={mapMarkers}
            selectedRegions={selectedRegions}
            onMarkerClick={handleMarkerClick}
            className="h-[400px]"
          />
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredSlots.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No slots found"
                description="Try adjusting your filters or search in different regions."
              />
            ) : (
              filteredSlots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onClick={() => navigate(`/broker/slots/${slot.id}`)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav role="broker" />
    </div>
  );
};

export default MarketplaceSearch;
