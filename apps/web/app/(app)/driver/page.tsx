import type { Database } from '../../../../../packages/supabase/types/database';
import { LiveSyncBadge } from '../../../components/live-sync-badge';
import { getDriverWorkspaceData } from '../../../lib/dashboard-data';
import { updateDriverRunStatus, uploadDriverProof } from './actions';

export const dynamic = 'force-dynamic';

type DriverRunStatus = Database['public']['Enums']['run_status'];
type DriverPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getRunTone(status: DriverRunStatus) {
  if (status === 'completed' || status === 'live') {
    return 'success';
  }

  return 'warning';
}

function getNextRunAction(status: DriverRunStatus) {
  switch (status) {
    case 'assigned':
      return {
        description: 'Confirm you are rolling to the launch window.',
        label: 'Mark en route',
        value: 'en_route' as const,
      };
    case 'en_route':
      return {
        description: 'Confirm the LED truck is live on route.',
        label: 'Mark live',
        value: 'live' as const,
      };
    case 'live':
      return {
        description: 'Close the run after the route and proof capture are done.',
        label: 'Complete run',
        value: 'completed' as const,
      };
    case 'issue':
      return {
        description: 'Resume the route once the issue has been handled.',
        label: 'Resume en route',
        value: 'en_route' as const,
      };
    default:
      return null;
  }
}

export default async function DriverPage({ searchParams }: DriverPageProps) {
  const data = await getDriverWorkspaceData();
  const params = (await searchParams) ?? {};
  const notice = readMessage(params.notice);
  const error = readMessage(params.error);

  return (
    <div className="stack">
      <section className="surface" style={{ padding: 28 }}>
        <div className="section-header">
          <div>
            <div className="fine">Driver workspace</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 42 }}>{data.title}</h1>
            <div className="fine" style={{ marginTop: 10 }}>
              {data.sourceLabel}
            </div>
          </div>
          <div className="stack" style={{ alignItems: 'flex-end', gap: 10 }}>
            <LiveSyncBadge channelKey="driver" tables={['runs', 'proof_assets', 'bookings']} />
            <span className={`badge ${data.badgeTone}`}>{data.badgeLabel}</span>
          </div>
        </div>

        {notice ? <div className="badge success" style={{ marginTop: 18 }}>{decodeURIComponent(notice)}</div> : null}
        {error ? <div className="badge warning" style={{ marginTop: 18 }}>{decodeURIComponent(error)}</div> : null}

        <div className="card-grid" style={{ marginTop: 24 }}>
          <section className="card">
            <h2 style={{ marginTop: 0 }}>Assigned runs</h2>
            <div className="stack">
              {data.assignedRuns.length > 0 ? data.assignedRuns.map((run) => {
                const nextAction = getNextRunAction(run.runStatus);

                return (
                  <div className="surface" data-testid={`driver-run-${run.id}`} key={run.id} style={{ padding: 18 }}>
                    <div className="section-header">
                      <div>
                        <div style={{ fontWeight: 700 }}>{run.title}</div>
                        <div className="fine" style={{ marginTop: 6 }}>{run.detail}</div>
                      </div>
                      <div className="stack" style={{ alignItems: 'flex-end', gap: 8 }}>
                        <span className={`badge ${getRunTone(run.runStatus)}`}>{run.statusLabel}</span>
                        <span className={`badge ${run.latestProofStatusLabel === 'Approved' ? 'success' : 'warning'}`}>
                          {run.latestProofStatusLabel}
                        </span>
                      </div>
                    </div>
                    <div className="fine" style={{ marginTop: 6 }}>
                      {run.bookingStatusLabel} • {run.proofCountLabel}
                    </div>
                    <div className="fine" style={{ marginTop: 6 }}>
                      {run.proofRequired ? 'Proof required before completion.' : 'Proof optional for this run.'}
                    </div>
                    <div className={`badge ${run.proofActionTone}`} style={{ marginTop: 10 }}>
                      {run.proofActionCallout}
                    </div>
                    {run.latestProofReviewNotes ? (
                      <div className="fine" style={{ marginTop: 6 }}>Review note: {run.latestProofReviewNotes}</div>
                    ) : null}

                    {nextAction ? (
                      <form action={updateDriverRunStatus} className="stack" style={{ marginTop: 14 }}>
                        <input name="runId" type="hidden" value={run.id} />
                        <input name="nextStatus" type="hidden" value={nextAction.value} />
                        <div className="pill" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{nextAction.description}</span>
                          <button
                            className="button-secondary"
                            data-testid={`driver-action-${nextAction.value}-${run.id}`}
                            type="submit"
                          >
                            {nextAction.label}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="pill" style={{ marginTop: 14 }}>
                        This run is complete. Upload or review proof from the ledger below if needed.
                      </div>
                    )}

                    {run.runStatus === 'live' && run.proofRequired && run.proofCount === 0 ? (
                      <div className="badge warning" style={{ marginTop: 12 }}>
                        Upload at least one proof file before completing this run.
                      </div>
                    ) : null}

                    <form action={uploadDriverProof} className="stack" style={{ marginTop: 14 }}>
                      <input name="runId" type="hidden" value={run.id} />
                      <label className="form-field">
                        <span className="fine">Proof file</span>
                        <input
                          accept="image/*,video/*,application/pdf"
                          className="input"
                          data-testid={`driver-proof-file-input-${run.id}`}
                          name="proofFile"
                          type="file"
                        />
                      </label>
                      <button
                        className="button-secondary"
                        data-testid={`driver-proof-upload-button-${run.id}`}
                        type="submit"
                      >
                        Upload proof
                      </button>
                    </form>
                  </div>
                );
              }) : (
                <div className="fine">No assigned runs are currently available for this driver.</div>
              )}
            </div>
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0 }}>Proof ledger</h2>
            <p className="fine">{data.proofCallout}</p>
            <div className="stack" style={{ marginTop: 16 }}>
              {data.proofUploads.length > 0 ? data.proofUploads.map((proof) => (
                <div className="pill" key={proof.id} style={{ alignItems: 'flex-start', display: 'grid' }}>
                <div style={{ fontWeight: 700 }}>{proof.fileName}</div>
                  <div className="fine">{proof.runTitle}</div>
                  <div className="fine">
                    <span className={`badge ${proof.tone}`} style={{ marginRight: 8 }}>{proof.statusLabel}</span>
                    {proof.capturedAtLabel}
                  </div>
                  <div className="fine">{proof.nextAction}</div>
                  {proof.reviewedAtLabel ? <div className="fine">Reviewed {proof.reviewedAtLabel}</div> : null}
                  {proof.reviewNotes ? <div className="fine">Operator note: {proof.reviewNotes}</div> : null}
                  {proof.assetUrl ? (
                    <a
                      className="fine"
                      data-testid={`driver-proof-open-file-${proof.id}`}
                      href={proof.assetUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open proof file
                    </a>
                  ) : null}
                </div>
              )) : (
                <div className="fine">No proof assets have been uploaded yet.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
