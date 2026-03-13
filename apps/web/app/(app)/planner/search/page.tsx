import { Constants } from '../../../../../../packages/supabase/types/database';
import { LiveSyncBadge } from '../../../../components/live-sync-badge';
import {
  getPlannerMarketplaceData,
  type PlannerAvailabilityFilter,
  type PlannerMarketplaceFilters,
  type PlannerSortOption,
} from '../../../../lib/dashboard-data';
import { mapProviderConfig } from '../../../../lib/maps/provider';
import { submitPlannerOffer } from './actions';

export const dynamic = 'force-dynamic';

type PlannerSearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeRegion(value: string | undefined): PlannerMarketplaceFilters['region'] {
  if (!value || value === 'all') {
    return 'all';
  }

  return Constants.public.Enums.region_code.includes(value as (typeof Constants.public.Enums.region_code)[number])
    ? (value as PlannerMarketplaceFilters['region'])
    : 'all';
}

function normalizeAvailability(value: string | undefined): PlannerAvailabilityFilter {
  if (value === 'all' || value === 'booked' || value === 'open') {
    return value;
  }

  return 'open';
}

function normalizeSort(value: string | undefined): PlannerSortOption {
  if (value === 'price_high' || value === 'price_low' || value === 'soonest') {
    return value;
  }

  return 'soonest';
}

function buildReturnPath(filters: PlannerMarketplaceFilters) {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set('query', filters.query);
  }

  if (filters.region !== 'all') {
    params.set('region', filters.region);
  }

  if (filters.availability !== 'open') {
    params.set('availability', filters.availability);
  }

  if (filters.sort !== 'soonest') {
    params.set('sort', filters.sort);
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `/planner/search?${queryString}` : '/planner/search';
}

export default async function PlannerSearchPage({ searchParams }: PlannerSearchPageProps) {
  const params = (await searchParams) ?? {};
  const filters: PlannerMarketplaceFilters = {
    availability: normalizeAvailability(readMessage(params.availability)),
    query: (readMessage(params.query) ?? '').trim(),
    region: normalizeRegion(readMessage(params.region)),
    sort: normalizeSort(readMessage(params.sort)),
  };
  const data = await getPlannerMarketplaceData(filters);
  const notice = readMessage(params.notice);
  const error = readMessage(params.error);
  const returnPath = buildReturnPath(filters);

  return (
    <div className="stack">
      <section className="surface" style={{ padding: 28 }}>
        <div className="section-header">
          <div>
            <div className="fine">Planner marketplace</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 42 }}>{data.title}</h1>
            <div className="fine" style={{ marginTop: 10 }}>
              {data.sourceLabel}
            </div>
          </div>
          <div className="stack" style={{ alignItems: 'flex-end', gap: 10 }}>
            <LiveSyncBadge channelKey="planner" tables={['slots', 'offers', 'bookings', 'proof_assets']} />
            <span className="badge success">{data.badgeLabel}</span>
          </div>
        </div>

        <form className="stack" method="get" style={{ marginTop: 24 }}>
          <div className="card-grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) repeat(3, minmax(0, 1fr))' }}>
            <label className="form-field">
              <span className="fine">Search</span>
              <input
                className="input"
                defaultValue={data.filterState.query}
                name="query"
                placeholder="Region, notes, truck name, vehicle code"
                type="text"
              />
            </label>

            <label className="form-field">
              <span className="fine">Region</span>
              <select className="input" defaultValue={data.filterState.region} name="region">
                <option value="all">All regions</option>
                {data.regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="fine">Availability</span>
              <select className="input" defaultValue={data.filterState.availability} name="availability">
                <option value="open">Open inventory</option>
                <option value="booked">Booked only</option>
                <option value="all">All statuses</option>
              </select>
            </label>

            <label className="form-field">
              <span className="fine">Sort</span>
              <select className="input" defaultValue={data.filterState.sort} name="sort">
                <option value="soonest">Soonest start</option>
                <option value="price_high">Highest price</option>
                <option value="price_low">Lowest price</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="button-secondary" data-testid="planner-apply-filters-submit" type="submit">
              Apply filters
            </button>
            <a className="button-secondary" href="/planner/search">
              Reset
            </a>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {data.filterPills.map((pill) => (
              <span className="pill" key={pill.label}>
                {pill.label}: {pill.value}
              </span>
            ))}
          </div>

          {notice ? <div className="badge success">{decodeURIComponent(notice)}</div> : null}
          {error ? <div className="badge warning">{decodeURIComponent(error)}</div> : null}
        </form>

        <div className="kpi-grid" style={{ marginTop: 24 }}>
          {data.trackerSummary.map((item) => (
            <div className="card" key={item.label}>
              <div className="fine">{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 10 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="card-grid">
        <section className="card" data-testid="planner-map-card">
          <div className="section-header">
            <h2 style={{ margin: 0 }}>Map</h2>
            <span className="fine">Provider abstracted</span>
          </div>
          <div
            className="surface"
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              marginTop: 18,
              minHeight: 280,
              padding: 20,
            }}
          >
            <div className="stack" data-testid="planner-map-provider-label" style={{ gap: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Map provider: MapLibre-ready</div>
              <div className="fine">
                Active provider: {mapProviderConfig.provider} using a free-first style URL.
              </div>
            </div>
          </div>
        </section>

        <section className="card" data-testid="planner-submitted-offers">
          <div className="section-header">
            <h2 style={{ margin: 0 }}>My offers</h2>
            <span className="fine">Offer, dispatch, and proof visibility</span>
          </div>
          <div className="stack" data-testid="planner-submitted-offers-list" style={{ marginTop: 18 }}>
            {data.submittedOffers.length > 0 ? data.submittedOffers.map((offer) => (
              <div className="pill" data-testid={`planner-submitted-offer-${offer.id}`} key={offer.id} style={{ alignItems: 'flex-start', display: 'grid' }}>
                <div style={{ fontWeight: 700 }}>{offer.slotTitle}</div>
                <div className="fine">{offer.amountLabel} • {offer.statusLabel} • {offer.updatedLabel}</div>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${offer.campaignStageTone}`}>{offer.campaignStageLabel}</span>
                </div>
                {offer.bookingLabel ? <div className="fine">{offer.bookingLabel}</div> : null}
                {offer.executionLabel ? <div className="fine">Execution: {offer.executionLabel}</div> : null}
                {offer.proofLabel ? (
                  <div className="fine">
                    Proof:
                    <span className={`badge ${offer.proofTone ?? 'warning'}`} style={{ marginLeft: 8 }}>
                      {offer.proofLabel}
                    </span>
                  </div>
                ) : null}
                <div className="fine">{offer.nextAction}</div>
                {offer.issueNote ? (
                  <div className="fine">
                    Issue:
                    <span style={{ marginLeft: 6 }}>{offer.issueNote}</span>
                    {offer.issueUpdatedLabel ? ` • ${offer.issueUpdatedLabel}` : ''}
                  </div>
                ) : null}
                {offer.message ? <div className="fine">{offer.message}</div> : null}
                {offer.operatorNote ? <div className="fine">Operator note: {offer.operatorNote}</div> : null}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {offer.timeline.map((item) => (
                    <span className="pill" key={`${offer.id}-${item}`}>{item}</span>
                  ))}
                </div>
              </div>
            )) : (
              <div className="fine">No offers have been submitted yet.</div>
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0 }}>Marketplace inventory</h2>
            <span className="fine">Filter, sort, and submit planner-side offers directly from the marketplace.</span>
          </div>
          <span className="fine">List view</span>
        </div>

        <div className="stack" style={{ marginTop: 18 }}>
          {data.availableSlots.length > 0 ? data.availableSlots.map((slot) => (
            <div className="surface" key={slot.id} style={{ padding: 18 }}>
              <div className="section-header">
                <div>
                  <div style={{ fontWeight: 700 }}>{slot.title}</div>
                  <div className="fine">{slot.detail}</div>
                </div>
                <span className={`badge ${slot.statusTone}`}>{slot.statusLabel}</span>
              </div>

              {slot.message ? <div className="fine" style={{ marginTop: 10 }}>{slot.message}</div> : null}
              {slot.submittedOfferStatus ? (
                <div className="fine" style={{ marginTop: 10 }}>Your latest offer status: {slot.submittedOfferStatus}</div>
              ) : null}
              {slot.bookingLabel ? <div className="fine" style={{ marginTop: 10 }}>{slot.bookingLabel}</div> : null}
              {slot.executionLabel ? <div className="fine" style={{ marginTop: 10 }}>Execution: {slot.executionLabel}</div> : null}
              {slot.proofLabel ? (
                <div className="fine" style={{ marginTop: 10 }}>
                  Proof:
                  <span className={`badge ${slot.proofTone ?? 'warning'}`} style={{ marginLeft: 8 }}>
                    {slot.proofLabel}
                  </span>
                </div>
              ) : null}
              {slot.operatorNote ? <div className="fine" style={{ marginTop: 10 }}>Operator note: {slot.operatorNote}</div> : null}

              {slot.isActionLocked ? (
                <div className="fine" style={{ marginTop: 14 }}>
                  {slot.status === 'booked'
                    ? 'This slot is already booked.'
                    : 'You already have an active offer on this slot.'}
                </div>
              ) : (
                <form action={submitPlannerOffer} className="stack" style={{ marginTop: 14 }}>
                  <input name="slotId" type="hidden" value={slot.id} />
                  <input name="returnTo" type="hidden" value={returnPath} />
                  <label className="form-field">
                    <span className="fine">Offer amount (USD)</span>
                    <input
                      className="input"
                      defaultValue={slot.rateDollars}
                      min="1"
                      name="amountDollars"
                      step="1"
                      type="number"
                    />
                  </label>
                  <label className="form-field">
                    <span className="fine">Offer note</span>
                    <textarea
                      className="input"
                      defaultValue="Ready to lock this route for a live LED truck campaign."
                      name="message"
                      rows={3}
                    />
                  </label>
                  <button className="button-secondary" data-testid="planner-submit-offer-submit" type="submit">
                    Submit offer
                  </button>
                </form>
              )}
            </div>
          )) : (
            <div className="fine">No inventory matches the current filters.</div>
          )}
        </div>
      </section>
    </div>
  );
}
