import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

export type RegionType = 'DFW' | 'Houston' | 'Austin' | 'San Antonio' | 'El Paso' | 'RGV';

interface RegionChipProps {
  region: RegionType;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const regionColors: Record<RegionType, string> = {
  'DFW': 'bg-region-dfw/20 text-region-dfw border-region-dfw/30',
  'Houston': 'bg-region-houston/20 text-region-houston border-region-houston/30',
  'Austin': 'bg-region-austin/20 text-region-austin border-region-austin/30',
  'San Antonio': 'bg-region-sanantonio/20 text-region-sanantonio border-region-sanantonio/30',
  'El Paso': 'bg-region-elpaso/20 text-region-elpaso border-region-elpaso/30',
  'RGV': 'bg-region-rgv/20 text-region-rgv border-region-rgv/30',
};

export const RegionChip: React.FC<RegionChipProps> = ({ region, selected, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        regionColors[region],
        selected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        onClick && 'cursor-pointer hover:opacity-80 active:scale-95',
        className
      )}
    >
      <MapPin className="w-3 h-3" />
      {region}
    </button>
  );
};

export default RegionChip;
