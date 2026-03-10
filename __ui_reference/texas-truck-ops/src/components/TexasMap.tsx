import React, { useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { cn } from '@/lib/utils';
import { RegionChip, RegionType } from './RegionChip';
import { StatusBadge, StatusType } from './StatusBadge';
import { Truck, DollarSign, Calendar, Clock } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Provide a publishable token via VITE_MAPBOX_TOKEN when running this reference app.
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Texas region coordinates
const TEXAS_REGIONS: Record<RegionType, { lat: number; lng: number; zoom: number }> = {
  'DFW': { lat: 32.7767, lng: -96.7970, zoom: 10 },
  'Houston': { lat: 29.7604, lng: -95.3698, zoom: 10 },
  'Austin': { lat: 30.2672, lng: -97.7431, zoom: 11 },
  'San Antonio': { lat: 29.4241, lng: -98.4936, zoom: 10 },
  'El Paso': { lat: 31.7619, lng: -106.4850, zoom: 11 },
  'RGV': { lat: 26.2034, lng: -98.2300, zoom: 10 },
};

// Texas center for initial view
const TEXAS_CENTER = { lat: 31.0, lng: -100.0, zoom: 5.5 };

export interface TruckMarker {
  id: string;
  truckName: string;
  region: RegionType;
  lat: number;
  lng: number;
  status: StatusType;
  price: number;
  date: string;
  timeWindow: string;
  screenSize: string;
  isVerified?: boolean;
}

interface TexasMapProps {
  markers: TruckMarker[];
  selectedRegions?: RegionType[];
  onMarkerClick?: (marker: TruckMarker) => void;
  className?: string;
}

const statusColors: Record<StatusType, string> = {
  available: '#22c55e',
  offered: '#f59e0b',
  booked: '#3b82f6',
  running: '#a855f7',
  completed: '#6b7280',
  cancelled: '#ef4444',
};

export const TexasMap: React.FC<TexasMapProps> = ({
  markers,
  selectedRegions = [],
  onMarkerClick,
  className,
}) => {
  const [viewState, setViewState] = useState({
    latitude: TEXAS_CENTER.lat,
    longitude: TEXAS_CENTER.lng,
    zoom: TEXAS_CENTER.zoom,
  });
  const [selectedMarker, setSelectedMarker] = useState<TruckMarker | null>(null);

  // Filter markers by selected regions
  const filteredMarkers = selectedRegions.length > 0
    ? markers.filter((m) => selectedRegions.includes(m.region))
    : markers;

  const handleMarkerClick = useCallback((marker: TruckMarker) => {
    setSelectedMarker(marker);
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Region center markers */}
        {Object.entries(TEXAS_REGIONS).map(([region, coords]) => {
          const regionMarkers = filteredMarkers.filter((m) => m.region === region);
          if (regionMarkers.length === 0) return null;

          return (
            <Marker
              key={`region-${region}`}
              latitude={coords.lat}
              longitude={coords.lng}
              anchor="center"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs shadow-lg border-2 border-primary-foreground/20">
                  {regionMarkers.length}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Individual truck markers */}
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(marker);
            }}
          >
            <div className="cursor-pointer transform hover:scale-110 transition-transform">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
                style={{ backgroundColor: statusColors[marker.status] }}
              >
                <Truck className="w-4 h-4 text-white" />
              </div>
              {marker.status === 'available' && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-50"
                  style={{ backgroundColor: statusColors.available }}
                />
              )}
            </div>
          </Marker>
        ))}

        {/* Popup for selected marker */}
        {selectedMarker && (
          <Popup
            latitude={selectedMarker.lat}
            longitude={selectedMarker.lng}
            anchor="bottom"
            offset={[0, -40]}
            closeOnClick={false}
            onClose={handlePopupClose}
            className="map-popup"
          >
            <div className="p-3 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-foreground">{selectedMarker.truckName}</h3>
                <StatusBadge status={selectedMarker.status} showDot={false} />
              </div>
              
              <RegionChip region={selectedMarker.region} className="mb-2" />

              <div className="space-y-1 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{selectedMarker.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{selectedMarker.timeWindow}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-bold text-primary text-lg">
                  ${selectedMarker.price.toLocaleString()}
                </span>
                {onMarkerClick && (
                  <button
                    onClick={() => onMarkerClick(selectedMarker)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Region legend */}
      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-available" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-offered" />
          <span className="text-muted-foreground">Offered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-booked" />
          <span className="text-muted-foreground">Booked</span>
        </div>
      </div>
    </div>
  );
};

export default TexasMap;
