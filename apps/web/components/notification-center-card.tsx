import type { NotificationCenterData } from '../lib/notifications';

type NotificationCenterCardProps = {
  markAllReadAction: () => Promise<void>;
  data: NotificationCenterData;
};

export function NotificationCenterCard({ data, markAllReadAction }: NotificationCenterCardProps) {
  return (
    <div className="card" data-testid="notification-center">
      <div className="section-header">
        <div>
          <div style={{ fontWeight: 700 }}>Notifications</div>
          <div className="fine" style={{ marginTop: 6 }}>
            Workflow events routed to this role.
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
          <span className={`badge ${data.unreadCount > 0 ? 'warning' : 'success'}`} data-testid="notification-unread-count">
            {data.unreadCount} unread
          </span>
          {data.unreadCount > 0 ? (
            <form action={markAllReadAction}>
              <button
                className="button-secondary"
                data-testid="notification-mark-all-read"
                style={{ minWidth: 'auto', padding: '8px 12px' }}
                type="submit"
              >
                Mark all read
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="stack" style={{ marginTop: 16 }}>
        {data.items.length > 0 ? data.items.map((item) => (
          <a
            className="pill notification-pill"
            data-testid={`notification-item-${item.id}`}
            href={item.actionHref}
            key={item.id}
            style={{ alignItems: 'flex-start', display: 'grid' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontWeight: 700 }}>{item.title}</span>
              <span className={`badge ${item.tone}`}>{item.kindLabel}</span>
            </div>
            <div className="fine">{item.body}</div>
            <div className="fine" style={{ display: 'flex', gap: 8 }}>
              <span>{item.createdAtLabel}</span>
              {item.isUnread ? <span className="badge warning">New</span> : null}
            </div>
          </a>
        )) : (
          <div className="fine">No workflow notifications yet.</div>
        )}
      </div>
    </div>
  );
}
