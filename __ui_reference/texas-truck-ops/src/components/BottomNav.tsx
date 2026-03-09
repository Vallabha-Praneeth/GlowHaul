import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Search, Layers, Calendar, User } from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface BottomNavProps {
  role: 'operator' | 'broker' | 'driver';
}

const navConfigs: Record<BottomNavProps['role'], NavItem[]> = {
  operator: [
    { icon: Home, label: 'Home', path: '/operator' },
    { icon: Layers, label: 'Slots', path: '/operator/slots' },
    { icon: Calendar, label: 'Bookings', path: '/operator/bookings' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  broker: [
    { icon: Home, label: 'Home', path: '/broker' },
    { icon: Search, label: 'Search', path: '/broker/search' },
    { icon: Layers, label: 'Offers', path: '/broker/offers' },
    { icon: Calendar, label: 'Bookings', path: '/broker/bookings' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  driver: [
    { icon: Home, label: 'Home', path: '/driver' },
    { icon: Calendar, label: 'Runs', path: '/driver/runs' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
};

export const BottomNav: React.FC<BottomNavProps> = ({ role }) => {
  const location = useLocation();
  const items = navConfigs[role];

  return (
    <nav className="bottom-nav max-w-md mx-auto">
      <div className="flex items-center justify-around px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('bottom-nav-item flex-1', isActive && 'active')}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
