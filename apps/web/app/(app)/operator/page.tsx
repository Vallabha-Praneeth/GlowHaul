import { Constants } from '../../../../../packages/supabase/types/database';
import { LiveSyncBadge } from '../../../components/live-sync-badge';
import { getOperatorDashboardData } from '../../../lib/dashboard-data';
import {
  acceptPlannerOffer,
  createSlotInventory,
  rejectPlannerOffer,
  reviewDriverProof,
  updateCampaignExecution,
  updateSlotInventory,
} from './actions';

export const dynamic = 'force-dynamic';

type OperatorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getDefaultDateTimeInput(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export default async function OperatorPage({ searchParams }: OperatorPageProps) {
  const data = await getOperatorDashboardData();
  const params = (await searchParams) ?? {};
  const notice = readMessage(params.notice);
  const error = readMessage(params.error);
  const defaultTruckId = data.truckOptions[0]?.id ?? '';

  return (
    <div className="stack">
      <section className="surface" style={{ padding: 28 }}>
        <div className="section-header">
          <div>
            <div className="fine">Operator dashboard</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 42 }}>{data.title}</h1>
            <div className="fine" style={{ marginTop: 10 }}>
              {data.sourceLabel}
            </div>
          </div>
          <div className="stack" style={{ alignItems: 'flex-end', gap: 10 }}>
            <LiveSyncBadge channelKey="operator" tables={['slots', 'offers', 'bookings', 'runs', 'proof_assets']} />
            <span className={`badge ${data.badgeTone}`}>{data.badgeLabel}</span>
          </div>
        </div>

        <div className="kpi-grid" style={{ marginTop: 24 }}>
          {data.kpis.map((item) => (
            <div className="card" key={item.label}>
              <div className="fine">{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 10 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {notice ? <div className="badge success" style={{ marginTop: 18 }}>{decodeURIComponent(notice)}</div> : null}
        {error ? <div className="badge warning" style={{ marginTop: 18 }}>{decodeURIComponent(error)}</div> : null}
      </section>

      <div className="card-grid">
        <section className="card">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Create slot inventory</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Build a new sellable LED truck window. Time fields are entered in UTC for this local-first workflow.
              </div>
            </div>
            <span className="badge warning">Write path live</span>
          </div>

          {data.truckOptions.length > 0 ? (
            <form action={createSlotInventory} className="stack" data-testid="operator-create-slot-form" style={{ marginTop: 18 }}>
              <label className="form-field">
                <span className="fine">Truck</span>
                <select className="input" defaultValue={defaultTruckId} name="truckId">
                  {data.truckOptions.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      {truck.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="card-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <label className="form-field">
                  <span className="fine">Region</span>
                  <select className="input" defaultValue="DFW" name="region">
                    {Constants.public.Enums.region_code.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="fine">Status</span>
                  <select className="input" defaultValue="available" name="status">
                    {(['draft', 'available', 'offered', 'booked', 'cancelled'] as const).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="card-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <label className="form-field">
                  <span className="fine">Start (UTC)</span>
                  <input className="input" defaultValue={getDefaultDateTimeInput(24)} name="startAt" type="datetime-local" />
                </label>

                <label className="form-field">
                  <span className="fine">End (UTC)</span>
                  <input className="input" defaultValue={getDefaultDateTimeInput(28)} name="endAt" type="datetime-local" />
                </label>
              </div>

              <label className="form-field">
                <span className="fine">Rate (USD)</span>
                <input className="input" defaultValue="2600" min="1" name="rateDollars" step="1" type="number" />
              </label>

              <label className="form-field">
                <span className="fine">Campaign notes</span>
                <textarea className="input" defaultValue="Prime evening commute route" name="campaignNotes" rows={4} />
              </label>

              <button className="button-primary" data-testid="operator-create-slot-submit" type="submit">
                Create slot
              </button>
            </form>
          ) : (
            <div className="fine" style={{ marginTop: 18 }}>
              No operator trucks are available yet. Seed or create fleet inventory before creating slots.
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Incoming offers</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Accept or reject planner offers with an operator note that will flow back into the marketplace.
              </div>
            </div>
            <span className="fine">Operator triage</span>
          </div>

          <div className="stack" style={{ marginTop: 18 }}>
            {data.incomingOffers.length > 0 ? data.incomingOffers.map((offer) => (
              <div className="surface" key={offer.id} style={{ padding: 18 }}>
                <div className="section-header">
                  <div>
                    <div style={{ fontWeight: 700 }}>{offer.slotTitle}</div>
                    <div className="fine">{offer.slotDetail}</div>
                    <div className="fine" style={{ marginTop: 6 }}>
                      {offer.plannerLabel} • {offer.amountLabel} • {offer.createdLabel}
                    </div>
                  </div>
                  <span className={`badge ${offer.canAccept ? 'warning' : 'success'}`}>{offer.statusLabel}</span>
                </div>
                {offer.message ? <div className="fine" style={{ marginTop: 10 }}>{offer.message}</div> : null}
                {offer.operatorNote ? (
                  <div className="fine" style={{ marginTop: 10 }}>Operator note: {offer.operatorNote}</div>
                ) : null}

                {offer.canAccept ? (
                  <div className="card-grid" style={{ marginTop: 14 }}>
                    <form action={acceptPlannerOffer} className="stack">
                      <input name="offerId" type="hidden" value={offer.id} />
                      <label className="form-field">
                        <span className="fine">Campaign name</span>
                        <input
                          className="input"
                          defaultValue="GlowHaul Campaign Booking"
                          name="campaignName"
                          type="text"
                        />
                      </label>
                      <label className="form-field">
                        <span className="fine">Operator note</span>
                        <textarea
                          className="input"
                          defaultValue="Booked for the strongest route and timing window."
                          name="operatorNote"
                          rows={3}
                        />
                      </label>
                      <button className="button-secondary" data-testid="operator-accept-offer-submit" type="submit">
                        Accept and book slot
                      </button>
                    </form>

                    <form action={rejectPlannerOffer} className="stack">
                      <input name="offerId" type="hidden" value={offer.id} />
                      <label className="form-field">
                        <span className="fine">Rejection note</span>
                        <textarea
                          className="input"
                          defaultValue="Timing conflict with another route. Try a later window or higher amount."
                          name="operatorNote"
                          rows={3}
                        />
                      </label>
                      <button className="button-secondary" data-testid="operator-reject-offer-submit" type="submit">
                        Reject offer
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            )) : (
              <div className="fine">No planner offers are waiting on operator action right now.</div>
            )}
          </div>
        </section>
      </div>

      <div className="card-grid">
        <section className="card">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Active campaigns</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Assign drivers, schedule runs, and move campaigns from confirmed to live without leaving the dashboard.
              </div>
            </div>
            <span className="fine">Dispatch + execution</span>
          </div>

          <div className="stack" style={{ marginTop: 18 }}>
            {data.activeBookings.length > 0 ? data.activeBookings.map((booking) => (
              <form action={updateCampaignExecution} className="surface stack" key={booking.bookingId} style={{ padding: 18 }}>
                <input name="bookingId" type="hidden" value={booking.bookingId} />
                <div className="section-header">
                  <div>
                    <div style={{ fontWeight: 700 }}>{booking.campaignName}</div>
                    <div className="fine">{booking.slotTitle}</div>
                    <div className="fine" style={{ marginTop: 6 }}>
                      {booking.plannerLabel} • {booking.scheduleLabel}
                    </div>
                  </div>
                  <div className="stack" style={{ alignItems: 'flex-end', gap: 8 }}>
                    <span className={`badge ${booking.bookingStatus === 'confirmed' ? 'warning' : 'success'}`}>
                      {booking.bookingStatus}
                    </span>
                    <div className="fine">{booking.driverLabel}</div>
                    <div className="fine">{booking.proofCountLabel} • {booking.latestProofStatusLabel}</div>
                  </div>
                </div>

                <div className="card-grid">
                  <label className="form-field">
                    <span className="fine">Assigned driver</span>
                    <select className="input" defaultValue={booking.driverId} name="driverId">
                      <option disabled value="">
                        Select driver
                      </option>
                      {data.driverOptions.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="fine">Booking status</span>
                    <select className="input" defaultValue={booking.bookingStatus} name="bookingStatus">
                      {Constants.public.Enums.booking_status.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="fine">Run status</span>
                    <select className="input" defaultValue={booking.runStatus ?? 'assigned'} name="runStatus">
                      {Constants.public.Enums.run_status.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="card-grid">
                  <label className="form-field">
                    <span className="fine">Dispatch start (UTC)</span>
                    <input className="input" defaultValue={booking.dispatchStartAtInput} name="startAt" type="datetime-local" />
                  </label>

                  <label className="form-field">
                    <span className="fine">Dispatch end (UTC)</span>
                    <input className="input" defaultValue={booking.dispatchEndAtInput} name="endAt" type="datetime-local" />
                  </label>
                </div>

                <label className="form-field">
                  <span className="fine">Proof requirement</span>
                  <div className="pill" style={{ justifyContent: 'space-between' }}>
                    <span>{booking.proofRequired ? 'Driver proof required for completion' : 'Proof optional for this run'}</span>
                    <input defaultChecked={booking.proofRequired} name="proofRequired" type="checkbox" />
                  </div>
                </label>

                <label className="form-field">
                  <span className="fine">Internal note</span>
                  <textarea
                    className="input"
                    defaultValue={booking.internalNote}
                    name="internalNote"
                    rows={3}
                  />
                </label>

                <button className="button-secondary" data-testid="operator-update-campaign-submit" type="submit">
                  Save dispatch plan
                </button>
              </form>
            )) : (
              <div className="fine">No confirmed campaigns are active yet.</div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>Proof review queue</h2>
              <div className="fine" style={{ marginTop: 6 }}>
                Driver uploads land here for approval or rejection with review notes.
              </div>
            </div>
            <span className="fine">Review lifecycle</span>
          </div>

          <div className="stack" style={{ marginTop: 18 }}>
            {data.proofReviews.length > 0 ? data.proofReviews.map((proof) => (
              <form action={reviewDriverProof} className="surface stack" key={proof.id} style={{ padding: 18 }}>
                <input name="proofAssetId" type="hidden" value={proof.id} />
                <div className="section-header">
                  <div>
                    <div style={{ fontWeight: 700 }}>{proof.fileName}</div>
                    <div className="fine">{proof.runTitle}</div>
                    <div className="fine" style={{ marginTop: 6 }}>
                      {proof.driverLabel} • {proof.uploadedAtLabel}
                    </div>
                  </div>
                  <span className={`badge ${proof.canReview ? 'warning' : 'success'}`}>{proof.statusLabel}</span>
                </div>

                <label className="form-field">
                  <span className="fine">Review note</span>
                  <textarea
                    className="input"
                    defaultValue={proof.reviewNotes}
                    name="reviewNotes"
                    rows={3}
                  />
                </label>

                {proof.canReview ? (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="button-secondary" data-testid="operator-approve-proof-submit" name="status" type="submit" value="approved">
                      Approve proof
                    </button>
                    <button className="button-secondary" data-testid="operator-reject-proof-submit" name="status" type="submit" value="rejected">
                      Reject proof
                    </button>
                  </div>
                ) : (
                  <div className="fine">Review already completed for this upload.</div>
                )}
              </form>
            )) : (
              <div className="fine">No proof uploads are waiting for operator review right now.</div>
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0 }}>Inventory editor</h2>
            <div className="fine" style={{ marginTop: 6 }}>
              Edit live slot details, availability, and rate without leaving the dashboard.
            </div>
          </div>
          <span className="fine">Tracked inventory</span>
        </div>

        <div className="stack" style={{ marginTop: 18 }}>
          {data.inventorySlots.length > 0 ? data.inventorySlots.map((slot) => (
            <form action={updateSlotInventory} className="surface" key={slot.id} style={{ padding: 18 }}>
              <input name="slotId" type="hidden" value={slot.id} />
              <div className="section-header">
                <div>
                  <div style={{ fontWeight: 700 }}>{slot.truckLabel}</div>
                  <div className="fine">{slot.summary}</div>
                  {slot.campaignNotes ? <div className="fine" style={{ marginTop: 6 }}>{slot.campaignNotes}</div> : null}
                </div>
                <span className={`badge ${slot.status === 'booked' ? 'success' : 'warning'}`}>{slot.status}</span>
              </div>

              <div className="card-grid" style={{ marginTop: 16 }}>
                <label className="form-field">
                  <span className="fine">Truck</span>
                  <select className="input" defaultValue={slot.truckId} name="truckId">
                    {data.truckOptions.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="fine">Region</span>
                  <select className="input" defaultValue={slot.region} name="region">
                    {Constants.public.Enums.region_code.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="card-grid" style={{ marginTop: 16 }}>
                <label className="form-field">
                  <span className="fine">Start (UTC)</span>
                  <input className="input" defaultValue={slot.startAtInput} name="startAt" type="datetime-local" />
                </label>

                <label className="form-field">
                  <span className="fine">End (UTC)</span>
                  <input className="input" defaultValue={slot.endAtInput} name="endAt" type="datetime-local" />
                </label>
              </div>

              <div className="card-grid" style={{ marginTop: 16 }}>
                <label className="form-field">
                  <span className="fine">Rate (USD)</span>
                  <input className="input" defaultValue={slot.rateDollars} min="1" name="rateDollars" step="1" type="number" />
                </label>

                <label className="form-field">
                  <span className="fine">Status</span>
                  <select className="input" defaultValue={slot.status} name="status">
                    {(['draft', 'available', 'offered', 'booked', 'cancelled'] as const).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="form-field" style={{ marginTop: 16 }}>
                <span className="fine">Campaign notes</span>
                <textarea className="input" defaultValue={slot.campaignNotes} name="campaignNotes" rows={4} />
              </label>

              <button className="button-secondary" style={{ marginTop: 16 }} type="submit">
                Save slot changes
              </button>
            </form>
          )) : (
            <div className="fine">No slot inventory is available to edit yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
