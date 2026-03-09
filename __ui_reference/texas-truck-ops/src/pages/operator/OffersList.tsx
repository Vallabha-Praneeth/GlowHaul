import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { OfferCard, OfferData } from '@/components/OfferCard';
import { EmptyState } from '@/components/EmptyState';
import { Mail } from 'lucide-react';

const mockOffers: OfferData[] = [
  {
    id: '1',
    slotName: 'LED-TX-001 • Jan 15, DFW',
    counterparty: 'MediaMax Agency',
    amount: 2400,
    status: 'pending',
    direction: 'received',
    createdAt: '2h ago',
    expiresAt: 'in 22h',
  },
  {
    id: '2',
    slotName: 'LED-TX-002 • Jan 18, Houston',
    counterparty: 'AdVenture Co.',
    amount: 1800,
    status: 'pending',
    direction: 'received',
    createdAt: '5h ago',
    expiresAt: 'in 19h',
  },
  {
    id: '3',
    slotName: 'LED-TX-001 • Jan 12, Austin',
    counterparty: 'BillboardPro',
    amount: 2200,
    status: 'accepted',
    direction: 'received',
    createdAt: '2 days ago',
  },
  {
    id: '4',
    slotName: 'LED-TX-003 • Jan 10, San Antonio',
    counterparty: 'TexAds Inc.',
    amount: 1500,
    status: 'rejected',
    direction: 'received',
    createdAt: '3 days ago',
  },
];

const OffersList = () => {
  const navigate = useNavigate();
  const pendingOffers = mockOffers.filter((o) => o.status === 'pending');
  const pastOffers = mockOffers.filter((o) => o.status !== 'pending');

  return (
    <div className="mobile-container">
      <ScreenHeader title="Offers" subtitle={`${pendingOffers.length} pending`} />

      <div className="screen-padding space-y-6">
        {mockOffers.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No offers yet"
            description="When brokers send offers for your slots, they'll appear here."
          />
        ) : (
          <>
            {/* Pending Offers */}
            {pendingOffers.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Pending ({pendingOffers.length})
                </h2>
                <div className="space-y-3">
                  {pendingOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onClick={() => navigate(`/operator/offers/${offer.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Offers */}
            {pastOffers.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  History
                </h2>
                <div className="space-y-3">
                  {pastOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onClick={() => navigate(`/operator/offers/${offer.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <BottomNav role="operator" />
    </div>
  );
};

export default OffersList;
