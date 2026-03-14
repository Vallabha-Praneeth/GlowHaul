import { notFound } from 'next/navigation';
import { CampaignRecapPrintScope } from '../../../../components/campaign-recap-print-scope';
import { getPublicCampaignRecapData } from '../../../../lib/campaign-recap';

export const dynamic = 'force-dynamic';

type PublicCampaignRecapPageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function PublicCampaignRecapPage({ params }: PublicCampaignRecapPageProps) {
  const { shareToken } = await params;
  const recap = await getPublicCampaignRecapData(shareToken);

  if (!recap) {
    notFound();
  }

  return (
    <div className="stack campaign-recap-sheet" data-testid="public-campaign-recap-page" style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px 64px' }}>
      <CampaignRecapPrintScope />

      <section className="surface campaign-recap-hero" style={{ padding: 28 }}>
        <div className="section-header">
          <div>
            <div className="fine">Public campaign recap</div>
            <h1 data-testid="public-campaign-recap-title" style={{ margin: '8px 0 0', fontSize: 42 }}>
              {recap.campaignName}
            </h1>
            <div className="fine" style={{ marginTop: 10 }}>
              {recap.campaignSummary}
            </div>
          </div>
          <div className="stack" style={{ alignItems: 'flex-end', gap: 10 }}>
            <span className={`badge ${recap.stageTone}`}>{recap.stageLabel}</span>
            <span className="fine">Updated {recap.lastUpdatedLabel}</span>
          </div>
        </div>

        <div className="pill" data-testid="public-campaign-recap-callout" style={{ marginTop: 24 }}>
          {recap.shareReadyCallout}
        </div>

        <div className="card-grid" style={{ marginTop: 24 }}>
          <div className="card">
            <div className="fine">Route</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{recap.routeSummary}</div>
          </div>
          <div className="card">
            <div className="fine">Proof</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{recap.proofSummary}</div>
          </div>
          <div className="card">
            <div className="fine">Operator</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{recap.operatorLabel}</div>
          </div>
          <div className="card">
            <div className="fine">Planner</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{recap.plannerLabel}</div>
          </div>
        </div>
        <div className="fine" style={{ marginTop: 16 }}>
          Use your browser print dialog to save or forward this approved recap artifact.
        </div>
      </section>

      <div className="card-grid">
        <section className="card">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Closeout summary</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Client-safe recap context from the completed campaign.
              </div>
            </div>
            <span className="fine">Delivery view</span>
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            {recap.closeoutNote ? (
              <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
                <span className="fine">Campaign notes</span>
                <span>{recap.closeoutNote}</span>
              </div>
            ) : (
              <div className="fine">No additional campaign note was provided for this recap.</div>
            )}
          </div>
        </section>

        <section className="card" data-testid="public-campaign-recap-proof-list">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Approved proof</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Only approved proof assets are exposed on the public recap.
              </div>
            </div>
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            {recap.proofItems.length > 0 ? recap.proofItems.map((proof) => (
              <div className="pill" data-testid={`public-campaign-recap-proof-${proof.id}`} key={proof.id} style={{ alignItems: 'flex-start', display: 'grid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontWeight: 700 }}>{proof.fileName}</span>
                  <span className={`badge ${proof.tone}`}>{proof.statusLabel}</span>
                </div>
                <div className="fine">{proof.driverLabel} • {proof.capturedAtLabel}</div>
                <a className="fine" href={proof.assetHref}>
                  Open proof asset
                </a>
              </div>
            )) : (
              <div className="fine">Approved proof has not been published yet.</div>
            )}
          </div>
        </section>
      </div>

      <section className="card" data-testid="public-campaign-recap-timeline">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0 }}>Timeline</h2>
            <div className="fine" style={{ marginTop: 6 }}>
              Delivery milestones for this campaign.
            </div>
          </div>
          <span className="fine">Public artifact trail</span>
        </div>
        <div className="stack" style={{ marginTop: 18 }}>
          {recap.timeline.map((item) => (
            <div className="pill" key={item.id} style={{ alignItems: 'flex-start', display: 'grid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontWeight: 700 }}>{item.label}</span>
                <span className={`badge ${item.tone}`}>{item.timeLabel}</span>
              </div>
              <div className="fine">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
