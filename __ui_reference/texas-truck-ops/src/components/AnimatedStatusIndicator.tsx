import React from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';
import { StatusType } from './StatusBadge';

// Inline Lottie animation data for each status
// These are simplified animations that work well at small sizes

const availableAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Available",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Pulse",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [100], e: [0] }, { t: 60, s: [0] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [200, 200, 100] }, { t: 60, s: [200, 200, 100] }] }
      },
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [30, 30] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.133, 0.773, 0.275, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 3 }
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Core",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [110, 110, 100] }, { t: 30, s: [110, 110, 100], e: [100, 100, 100] }, { t: 60, s: [100, 100, 100] }] }
      },
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [20, 20] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.133, 0.773, 0.275, 1] },
          o: { a: 0, k: 100 }
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
};

const pendingAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 100,
  h: 100,
  nm: "Pending",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Hourglass",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [180] }, { t: 45, s: [180], e: [360] }, { t: 90, s: [360] }] },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [20, 30] },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 4 }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.961, 0.62, 0.043, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 90,
      st: 0
    }
  ]
};

const bookedAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Booked",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Lock",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [90, 90, 100], e: [100, 100, 100] }, { t: 15, s: [100, 100, 100], e: [95, 95, 100] }, { t: 30, s: [95, 95, 100] }] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [24, 20] },
              p: { a: 0, k: [0, 5] },
              r: { a: 0, k: 4 }
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.231, 0.51, 0.965, 1] },
              o: { a: 0, k: 100 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        },
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [14, 10] },
              p: { a: 0, k: [0, -8] },
              r: { a: 0, k: 5 }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.231, 0.51, 0.965, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 }
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
};

const runningAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Running",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Progress",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 60, s: [360] }] },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [30, 30] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.659, 0.333, 0.969, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 4 }
        },
        {
          ty: "tm",
          s: { a: 0, k: 0 },
          e: { a: 0, k: 75 },
          o: { a: 0, k: 0 }
        }
      ],
      ip: 0,
      op: 60,
      st: 0
    }
  ]
};

const completedAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 45,
  w: 100,
  h: 100,
  nm: "Completed",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [0, 0, 100], e: [120, 120, 100] }, { t: 15, s: [120, 120, 100], e: [100, 100, 100] }, { t: 25, s: [100, 100, 100] }] }
      },
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [30, 30] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.42, 0.447, 0.502, 1] },
          o: { a: 0, k: 100 }
        }
      ],
      ip: 0,
      op: 45,
      st: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Checkmark",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 10, s: [0], e: [100] }, { t: 20, s: [100] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  c: false,
                  v: [[-6, 0], [-2, 4], [6, -4]],
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]]
                }
              }
            },
            {
              ty: "st",
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 45,
      st: 0
    }
  ]
};

const cancelledAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 30,
  w: 100,
  h: 100,
  nm: "Cancelled",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "X",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [-45], e: [0] }, { t: 15, s: [0] }] },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [80, 80, 100], e: [100, 100, 100] }, { t: 15, s: [100, 100, 100] }] }
      },
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [30, 30] },
          p: { a: 0, k: [0, 0] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.937, 0.267, 0.267, 1] },
          o: { a: 0, k: 100 }
        }
      ],
      ip: 0,
      op: 30,
      st: 0
    }
  ]
};

const animationData: Record<StatusType, object> = {
  available: availableAnimation,
  offered: pendingAnimation,
  booked: bookedAnimation,
  running: runningAnimation,
  completed: completedAnimation,
  cancelled: cancelledAnimation,
};

interface AnimatedStatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const AnimatedStatusIndicator: React.FC<AnimatedStatusIndicatorProps> = ({
  status,
  size = 'md',
  className,
}) => {
  return (
    <div className={cn(sizeClasses[size], className)}>
      <Lottie
        animationData={animationData[status]}
        loop={status === 'available' || status === 'offered' || status === 'running'}
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default AnimatedStatusIndicator;
