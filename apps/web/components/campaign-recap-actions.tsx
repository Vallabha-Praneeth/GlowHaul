'use client';

import { useEffect, useRef, useState } from 'react';

type CampaignRecapActionsProps = {
  campaignName: string;
};

export function CampaignRecapActions({ campaignName }: CampaignRecapActionsProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }

    noticeTimeoutRef.current = setTimeout(() => {
      setNotice(null);
      noticeTimeoutRef.current = null;
    }, 4_000);

    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
        noticeTimeoutRef.current = null;
      }
    };
  }, [notice]);

  function buildSecureSharePayload() {
    return [
      `GlowHaul secure recap for ${campaignName}`,
      window.location.href,
      'Recipient must sign in to GlowHaul to view this recap.',
    ].join('\n');
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(buildSecureSharePayload());
      setNotice('Secure link copied. Recipient must sign in to GlowHaul.');
    } catch {
      setNotice('Copy failed on this browser.');
    }
  }

  async function openNativeShare() {
    if (!navigator.share) {
      setNotice('Native share is unavailable on this browser.');
      return;
    }

    try {
      await navigator.share({
        text: `${campaignName} recap. Recipient must sign in to GlowHaul to view this link.`,
        title: `${campaignName} recap`,
        url: window.location.href,
      });
      setNotice('Share sheet opened for a secure GlowHaul link.');
    } catch {
      setNotice(null);
    }
  }

  function printRecap() {
    window.print();
  }

  return (
    <div className="campaign-recap-actions stack" data-testid="campaign-recap-actions" style={{ gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <button
          className="button-secondary"
          data-testid="campaign-recap-print-button"
          onClick={printRecap}
          type="button"
        >
          Print / Save PDF
        </button>
        <button
          className="button-secondary"
          data-testid="campaign-recap-copy-link-button"
          onClick={() => void copyShareLink()}
          type="button"
        >
          Copy secure link
        </button>
        <button
          className="button-secondary"
          data-testid="campaign-recap-native-share-button"
          onClick={() => void openNativeShare()}
          type="button"
        >
          Share secure link
        </button>
      </div>
      <div className="fine" data-testid="campaign-recap-share-policy">
        Secure links require GlowHaul sign-in. Use Print / Save PDF for client-safe distribution.
      </div>
      {notice ? (
        <div className="fine" data-testid="campaign-recap-actions-notice">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
