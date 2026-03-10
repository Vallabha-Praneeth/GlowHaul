import { Mail, Phone, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentAuth, getDefaultHomePath, isLocalDemoAuthEnabled } from '../../../lib/auth';
import { env } from '../../../lib/env';
import { requestDemoSession, requestMagicLink } from './actions';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { profile } = await getCurrentAuth();

  if (profile) {
    redirect(getDefaultHomePath(profile.role));
  }

  const params = (await searchParams) ?? {};
  const success = readMessage(params.sent) === '1';
  const error = readMessage(params.error);
  const nextPath = readMessage(params.next) ?? '/operator';
  const showDemoAccess = isLocalDemoAuthEnabled();

  return (
    <main className="mobile-stack" style={{ padding: '32px 24px 48px' }}>
      <section className="surface hero-grid" style={{ padding: 32 }}>
        <div className="stack" style={{ gap: 28 }}>
          <div className="stack" style={{ gap: 12 }}>
            <span className="pill">
              <Sparkles size={16} />
              GlowHaul for Out-of-the-Box Advertising
            </span>
            <div className="stack" style={{ gap: 8 }}>
              <h1 style={{ fontSize: 56, lineHeight: 1, margin: 0 }}>Run campaigns that move.</h1>
              <p className="fine" style={{ fontSize: 18, maxWidth: 620, margin: 0 }}>
                A dark, fast operations console for LED truck campaigns across Texas. Operators manage
                fleet supply, planners source inventory, and drivers execute proof-backed runs.
              </p>
            </div>
          </div>

          <div className="kpi-grid">
            {[
              ['Live slots', '124'],
              ['Regions', '6'],
              ['Proof SLA', '98.4%'],
              ['Avg fill rate', '87%'],
            ].map(([label, value]) => (
              <div className="card" key={label}>
                <div className="fine">{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="stack" style={{ gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 28 }}>Sign in</h2>
                <p className="fine" style={{ marginTop: 8 }}>
                  Start with magic link for local speed. Phone OTP stays visible as a product placeholder.
                </p>
              </div>

              {success ? (
                <div className="badge success">Magic link sent. Check your inbox to continue.</div>
              ) : null}

              {error ? <div className="badge warning">{decodeURIComponent(error)}</div> : null}

              <form action={requestMagicLink} className="stack">
                <label className="form-field">
                  <span className="fine">Work email</span>
                  <input
                    autoComplete="email"
                    className="input"
                    defaultValue="ops@example.com"
                    name="email"
                    placeholder="team@outoftheboxadvertising.com"
                    type="email"
                  />
                </label>
                <input name="next" type="hidden" value={nextPath} />
                <button className="button-primary" data-testid="auth-magic-link-submit" type="submit">
                  <Mail size={18} style={{ marginRight: 8 }} />
                  Send magic link
                </button>
              </form>
            </div>
          </div>

          {showDemoAccess ? (
            <div className="card">
              <div className="section-header">
                <div>
                  <h3 style={{ margin: 0 }}>Local demo access</h3>
                  <p className="fine" style={{ margin: '6px 0 0' }}>
                    Development-only password sign-in for seeded demo accounts. Primary product auth remains
                    email magic link.
                  </p>
                </div>
                <span className="badge success">Local only</span>
              </div>
              <div className="stack" style={{ marginTop: 18 }}>
                {[
                  ['operator.demo@glowhaul.local', 'Continue as operator demo'],
                  ['planner.demo@glowhaul.local', 'Continue as planner demo'],
                  ['driver.demo@glowhaul.local', 'Continue as driver demo'],
                ].map(([email, label]) => (
                  <form action={requestDemoSession} key={email}>
                    <input name="email" type="hidden" value={email} />
                    <input name="password" type="hidden" value="demo-password" />
                    <input name="next" type="hidden" value={nextPath} />
                    <button className="button-secondary" type="submit">
                      {label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="section-header">
              <div>
                <h3 style={{ margin: 0 }}>Phone OTP placeholder</h3>
                <p className="fine" style={{ margin: '6px 0 0' }}>
                  Matches the planned Supabase phone flow without blocking early delivery. Current placeholder:
                  {' '}
                  {env.AUTH_PHONE_OTP_PLACEHOLDER}
                </p>
              </div>
              <span className="badge warning">Placeholder only</span>
            </div>
            <div className="stack" style={{ marginTop: 18 }}>
              <label className="form-field">
                <span className="fine">Phone</span>
                <input
                  autoComplete="tel"
                  className="input"
                  defaultValue="+1 (555) 555-0123"
                  name="phone"
                  type="tel"
                />
              </label>
              <a className="button-secondary" data-testid="auth-phone-otp-link" href="/verify">
                <Phone size={18} style={{ marginRight: 8 }} />
                Review OTP screen
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
