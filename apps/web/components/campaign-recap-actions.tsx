'use client';

import { useState } from 'react';

type CampaignRecapActionsProps = {
  campaignName: string;
};

export function CampaignRecapActions({ campaignName }: CampaignRecapActionsProps) {
  const [notice, setNotice] = useState<string | null>(null);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice('Share link copied.');
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
        text: `Campaign recap for ${campaignName}`,
        title: `${campaignName} recap`,
        url: window.location.href,
      });
      setNotice('Share sheet opened.');
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
          Copy share link
        </button>
        <button
          className="button-secondary"
          data-testid="campaign-recap-native-share-button"
          onClick={() => void openNativeShare()}
          type="button"
        >
          Share
        </button>
      </div>
      {notice ? (
        <div className="fine" data-testid="campaign-recap-actions-notice">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
