import Link from 'next/link';
import { NotificationCenterCard } from '../../components/notification-center-card';
import { getCurrentAuth, getDefaultHomePath, type AppRole } from '../../lib/auth';
import { getNotificationCenterData } from '../../lib/notifications';
import { signOutUser } from '../(auth)/login/actions';

const roleLabels: Record<AppRole, string> = {
  driver: 'Driver',
  operator: 'Operator',
  planner: 'Planner',
};

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await getCurrentAuth();
  const notificationCenter = profile ? await getNotificationCenterData(profile.id) : null;
  const nav = profile
    ? [{ href: getDefaultHomePath(profile.role), label: roleLabels[profile.role] }]
    : [{ href: '/login', label: 'Login' }];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="stack" style={{ gap: 24 }}>
          <div>
            <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>GlowHaul</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>Campaign OS</div>
          </div>

          <nav className="stack" style={{ gap: 10 }}>
            {nav.map((item) => (
              <Link className="button-secondary" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          {profile ? (
            <div className="card">
              <div className="stack" style={{ gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{profile.full_name ?? profile.email}</div>
                  <div className="fine">
                    {roleLabels[profile.role]}{profile.organization?.name ? ` • ${profile.organization.name}` : ''}
                  </div>
                </div>
                <form action={signOutUser}>
                  <button className="button-secondary" type="submit">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {notificationCenter ? <NotificationCenterCard data={notificationCenter} /> : null}

          <div className="card">
            <div className="stack" style={{ gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Visual direction</div>
              <div className="fine">
                Based on the QuantumOps-style dark logistics aesthetic, with room to evaluate motion and
                Lottie usage after the first stable shell. Planner is the buyer-side role for campaign sourcing.
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="content">
        <div className="mobile-stack">{children}</div>
      </div>
    </div>
  );
}
