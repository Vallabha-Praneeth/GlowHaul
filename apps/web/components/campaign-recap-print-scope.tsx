'use client';

import { useEffect } from 'react';

export function CampaignRecapPrintScope() {
  useEffect(() => {
    document.body.classList.add('print-recap');

    return () => {
      document.body.classList.remove('print-recap');
    };
  }, []);

  return null;
}
