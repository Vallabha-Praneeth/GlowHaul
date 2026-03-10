'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '../lib/supabase/browser';

type RealtimeTable = 'bookings' | 'offers' | 'proof_assets' | 'runs' | 'slots';
type SyncState = 'connecting' | 'live' | 'offline';

type LiveSyncBadgeProps = {
  channelKey: string;
  tables: RealtimeTable[];
};

export function LiveSyncBadge({ channelKey, tables }: LiveSyncBadgeProps) {
  const router = useRouter();
  const refreshTimeoutRef = useRef<number | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const tablesKey = tables.join(',');

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      setSyncState('offline');
      return undefined;
    }

    setSyncState('connecting');
    const channel = supabase.channel(`live-sync:${channelKey}:${tablesKey}`);
    const queueRefresh = () => {
      setSyncState('live');

      if (refreshTimeoutRef.current !== null) {
        return;
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null;
        startTransition(() => {
          router.refresh();
        });
      }, 250);
    };
    const pollingInterval = window.setInterval(() => {
      queueRefresh();
    }, 3_000);

    tables.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, queueRefresh);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setSyncState('live');
        return;
      }

      if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
        setSyncState('offline');
        return;
      }

      setSyncState('connecting');
    });

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      window.clearInterval(pollingInterval);
      void supabase.removeChannel(channel);
    };
  }, [channelKey, tables, tablesKey, router]);

  const tone = syncState === 'live' ? 'success' : 'warning';
  const label =
    syncState === 'live'
      ? 'Live updates on'
      : syncState === 'connecting'
        ? 'Connecting live updates'
        : 'Live updates unavailable';

  return (
    <span className={`badge ${tone}`} data-testid="live-sync-badge">
      {label}
    </span>
  );
}
