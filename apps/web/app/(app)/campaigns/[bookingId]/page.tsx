import { notFound } from 'next/navigation';
import { getCampaignRecapData } from '../../../../lib/campaign-recap';

export const dynamic = 'force-dynamic';

type CampaignRecapPageProps = {
  params: Promise<{ bookingId: string }>;
};

export default async function CampaignRecapPage({ params }: CampaignRecapPageProps) {
  const { bookingId } = await params;
  const recap = await getCampaignRecapData(bookingId);

  if (!recap) {
    notFound();
  }

  return (
    <div className="stack" data-testid="campaign-recap-page">
      <section className="surface" style={{ padding: 28 }}>
        <div className="section-header">
          <div>
            <div className="fine">Campaign recap artifact</div>
            <h1 data-testid="campaign-recap-title" style={{ margin: '8px 0 0', fontSize: 42 }}>
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

        <div className="pill" data-testid="campaign-recap-callout" style={{ marginTop: 24 }}>
          {recap.shareReadyCallout}
        </div>

        <div className="card-grid" data-testid="campaign-recap-overview" style={{ marginTop: 24 }}>
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

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <a className="button-secondary" data-testid="campaign-recap-back-link" href={recap.backHref}>
            Back to workspace
          </a>
        </div>
      </section>

      <div className="card-grid">
        <section className="card" data-testid="campaign-recap-summary">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Closeout summary</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Share-ready route context for operators, planners, and assigned drivers.
              </div>
            </div>
            <span className="fine">Role: {recap.viewerRole}</span>
          </div>

          <div className="stack" style={{ marginTop: 18 }}>
            <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
              <span className="fine">Campaign status</span>
              <span style={{ fontWeight: 700 }}>{recap.campaignSummary}</span>
            </div>
            {recap.internalNote ? (
              <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
                <span className="fine">Campaign notes</span>
                <span>{recap.internalNote}</span>
              </div>
            ) : null}
            {recap.issueSummary ? (
              <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
                <span className="fine">Issue history</span>
                <span>{recap.issueSummary}</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="card" data-testid="campaign-recap-proof-list">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Proof log</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Uploaded proof assets and review outcomes tied to this campaign.
              </div>
            </div>
            <span className="fine">
              {recap.proofItems.length} asset{recap.proofItems.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="stack" style={{ marginTop: 18 }}>
            {recap.proofItems.length > 0 ? recap.proofItems.map((proof) => (
              <div className="pill" data-testid={`campaign-recap-proof-${proof.id}`} key={proof.id} style={{ alignItems: 'flex-start', display: 'grid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontWeight: 700 }}>{proof.fileName}</span>
                  <span className={`badge ${proof.tone}`}>{proof.statusLabel}</span>
                </div>
                <div className="fine">{proof.driverLabel} • {proof.capturedAtLabel}</div>
                {proof.reviewedAtLabel ? <div className="fine">Reviewed {proof.reviewedAtLabel}</div> : null}
                {proof.reviewNotes ? <div className="fine">Review note: {proof.reviewNotes}</div> : null}
                <a className="fine" data-testid={`campaign-recap-proof-link-${proof.id}`} href={proof.assetHref}>
                  Open proof asset
                </a>
              </div>
            )) : (
              <div className="fine">No proof assets are attached to this campaign yet.</div>
            )}
          </div>
        </section>
      </div>

      <section className="card" data-testid="campaign-recap-timeline">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0 }}>Timeline</h2>
            <div className="fine" style={{ marginTop: 6 }}>
              Booking, execution, issue, and proof milestones in one place.
            </div>
          </div>
          <span className="fine">Artifact trail</span>
        </div>

        <div className="stack" style={{ marginTop: 18 }}>
          {recap.timeline.length > 0 ? recap.timeline.map((item) => (
            <div className="pill" data-testid={`campaign-recap-timeline-${item.id}`} key={item.id} style={{ alignItems: 'flex-start', display: 'grid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontWeight: 700 }}>{item.label}</span>
                <span className={`badge ${item.tone}`}>{item.timeLabel}</span>
              </div>
              <div className="fine">{item.detail}</div>
            </div>
          )) : (
            <div className="fine" data-testid="campaign-recap-timeline-empty">
              No timeline events recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
