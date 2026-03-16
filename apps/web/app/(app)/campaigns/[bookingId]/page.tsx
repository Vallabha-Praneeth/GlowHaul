import { notFound } from 'next/navigation';
import { CampaignRecapActions } from '../../../../components/campaign-recap-actions';
import { CampaignRecapPrintScope } from '../../../../components/campaign-recap-print-scope';
import { getCampaignRecapData } from '../../../../lib/campaign-recap';
import { manageCampaignPublicShareAction, updateCampaignCloseoutAction } from './actions';

export const dynamic = 'force-dynamic';

type CampaignRecapPageProps = {
  params: Promise<{ bookingId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function safeDecode(value: string | undefined) {
  if (!value) {
    return value;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readMessage(value: string | string[] | undefined) {
  return safeDecode(Array.isArray(value) ? value[0] : value);
}

export default async function CampaignRecapPage({ params, searchParams }: CampaignRecapPageProps) {
  const { bookingId } = await params;
  const recap = await getCampaignRecapData(bookingId);
  const resolvedSearchParams = (await searchParams) ?? {};
  const notice = readMessage(resolvedSearchParams.notice);
  const error = readMessage(resolvedSearchParams.error);

  if (!recap) {
    notFound();
  }

  return (
    <div className="stack campaign-recap-sheet" data-testid="campaign-recap-page">
      <CampaignRecapPrintScope />
      <section className="surface campaign-recap-hero" style={{ padding: 28 }}>
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

        {notice ? <div className="badge success" style={{ marginTop: 18 }}>{notice}</div> : null}
        {error ? <div className="badge warning" style={{ marginTop: 18 }}>{error}</div> : null}

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
            <div className="fine">Closeout</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>{recap.closeoutLabel}</div>
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

        <div style={{ marginTop: 16 }}>
          <CampaignRecapActions
            campaignName={recap.campaignName}
            publicShareUrl={recap.canManageCloseout ? recap.publicShare?.url ?? null : null}
          />
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
            <span className={`badge ${recap.closeoutTone}`}>{recap.closeoutLabel}</span>
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
            {recap.closeoutNote ? (
              <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
                <span className="fine">Client-facing closeout note</span>
                <span>{recap.closeoutNote}</span>
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

        <section className="card" data-testid="campaign-recap-share-manager">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Delivery controls</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Close the campaign cleanly and manage public recap distribution.
              </div>
            </div>
            <span className="fine">Operator / planner</span>
          </div>

          {recap.canManageCloseout ? (
            <div className="stack" style={{ marginTop: 18 }}>
              {recap.canMarkClientReady || recap.canMarkClosed ? (
                <form action={updateCampaignCloseoutAction} className="stack">
                  <input name="bookingId" type="hidden" value={bookingId} />
                  <label className="form-field">
                    <span className="fine">Closeout note</span>
                    <textarea
                      className="input"
                      data-testid="closeout-note"
                      defaultValue={recap.closeoutNote ?? ''}
                      name="note"
                      placeholder="Optional note to carry into client-ready and public recap views"
                      rows={4}
                    />
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {recap.canMarkClientReady ? (
                      <button className="button-secondary" data-testid="campaign-recap-mark-client-ready" name="intent" type="submit" value="mark_client_ready">
                        Mark client-ready
                      </button>
                    ) : null}
                    {recap.canMarkClosed ? (
                      <button className="button-secondary" data-testid="campaign-recap-mark-closed" name="intent" type="submit" value="mark_closed">
                        Mark closed
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : (
                <div className="fine">
                  Closeout transitions are already complete for this campaign. Review the public link state below if you need to refresh or revoke sharing.
                </div>
              )}

              <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
                <span className="fine">Public recap link</span>
                {recap.publicShare ? (
                  <>
                    <a className="fine" data-testid="campaign-recap-public-link" href={recap.publicShare.url} rel="noreferrer" target="_blank">
                      {recap.publicShare.url}
                    </a>
                    <span className="fine">Expires {recap.publicShare.expiresAtLabel}</span>
                  </>
                ) : (
                  <span className="fine">No public recap link is active yet.</span>
                )}
              </div>

              {recap.canCreatePublicShare ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <form action={manageCampaignPublicShareAction}>
                    <input name="bookingId" type="hidden" value={bookingId} />
                    <input name="intent" type="hidden" value="create" />
                    <button className="button-secondary" data-testid="campaign-recap-create-public-share" type="submit">
                      {recap.publicShare ? 'Refresh public recap link' : 'Create public recap link'}
                    </button>
                  </form>
                  {recap.publicShare ? (
                    <form action={manageCampaignPublicShareAction}>
                      <input name="bookingId" type="hidden" value={bookingId} />
                      <input name="intent" type="hidden" value="revoke" />
                      <button className="button-secondary" data-testid="campaign-recap-revoke-public-share" type="submit">
                        Revoke public link
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : (
                <div className="fine">
                  Public recap links unlock after the campaign is marked client-ready.
                </div>
              )}
            </div>
          ) : (
            <div className="fine" style={{ marginTop: 18 }}>
              Drivers can view this recap, but only operators and planners can manage closeout or public sharing.
            </div>
          )}
        </section>
      </div>

      <div className="card-grid">
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

        <section className="card">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Participants</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Primary operating and planning orgs linked to this campaign.
              </div>
            </div>
            <span className="fine">Workspace roles</span>
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
              <span className="fine">Operator</span>
              <span style={{ fontWeight: 700 }}>{recap.operatorLabel}</span>
            </div>
            <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
              <span className="fine">Planner</span>
              <span style={{ fontWeight: 700 }}>{recap.plannerLabel}</span>
            </div>
            <div className="pill" style={{ alignItems: 'flex-start', display: 'grid' }}>
              <span className="fine">Viewer role</span>
              <span style={{ fontWeight: 700 }}>{recap.viewerRole}</span>
            </div>
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
