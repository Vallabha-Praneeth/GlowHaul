import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <header className={cn('px-4 py-4 bg-background/95 backdrop-blur-lg sticky top-0 z-40 safe-area-top', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="tap-target -ml-3 text-foreground"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {rightAction && <div className="flex items-center">{rightAction}</div>}
      </div>
    </header>
  );
};

export default ScreenHeader;
