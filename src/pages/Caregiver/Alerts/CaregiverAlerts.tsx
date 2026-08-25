import { useApp } from '../../../store/AppContext';
import { CaregiverSidebar } from '../../../components/Sidebar/Sidebar';
import { CheckCircle } from 'lucide-react';

export default function CaregiverAlerts() {
  const { alerts, resolveAlert } = useApp();

  const unresolved = alerts.filter(a => !a.resolved);
  const resolved = alerts.filter(a => a.resolved);

  const severityConfig = {
    high: { color: 'var(--color-danger)', bg: 'var(--color-danger-light)', icon: '🔴', label: 'High' },
    medium: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)', icon: '🟡', label: 'Medium' },
    low: { color: 'var(--color-success)', bg: 'var(--color-success-light)', icon: '🟢', label: 'Low' },
  };

  const AlertCard = ({ alert }: { alert: typeof alerts[0] }) => {
    const conf = severityConfig[alert.severity];
    return (
      <div style={{
        background: conf.bg, borderRadius: 16, padding: '20px',
        borderLeft: `4px solid ${conf.color}`,
        opacity: alert.resolved ? 0.6 : 1,
        marginBottom: 14,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span>{conf.icon}</span>
              <span className={`badge ${
                alert.severity === 'high' ? 'badge--danger' :
                alert.severity === 'medium' ? 'badge--warning' : 'badge--success'
              }`}>{conf.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>
                {new Date(alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{alert.message}</p>
            {alert.detail && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                {alert.detail}
              </p>
            )}
            {alert.action && !alert.resolved && (
              <div style={{
                background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '10px 12px',
                fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, backdropFilter: 'blur(4px)',
              }}>
                <span style={{ fontWeight: 700, color: conf.color }}>Recommended Action: </span>
                {alert.action}
              </div>
            )}
          </div>
          {!alert.resolved && (
            <button
              onClick={() => resolveAlert(alert.id)}
              className="btn btn--success btn--sm"
              style={{ gap: 4, flexShrink: 0 }}
            >
              <CheckCircle size={14} /> Resolve
            </button>
          )}
          {alert.resolved && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <CheckCircle size={14} /> Resolved
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      <CaregiverSidebar />
      <main className="dashboard-content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Alert Center</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Activity and engagement alerts for Maya Devi · Not medical advisories
          </p>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="card" style={{ borderRadius: 16, flex: 1, textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-danger)' }}>{unresolved.filter(a => a.severity === 'high').length}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 4 }}>High Priority</div>
          </div>
          <div className="card" style={{ borderRadius: 16, flex: 1, textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-warning)' }}>{unresolved.filter(a => a.severity === 'medium').length}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 4 }}>Medium Priority</div>
          </div>
          <div className="card" style={{ borderRadius: 16, flex: 1, textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success)' }}>{unresolved.filter(a => a.severity === 'low').length}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 4 }}>Low Priority</div>
          </div>
          <div className="card" style={{ borderRadius: 16, flex: 1, textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-tertiary)' }}>{resolved.length}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 4 }}>Resolved</div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div style={{
          background: '#FFF8F0', border: '1px solid #FFD08A', borderRadius: 12,
          padding: '12px 16px', marginBottom: 24, fontSize: 12, color: 'var(--text-secondary)',
        }}>
          ⚠️ These alerts reflect activity patterns and missed reminders. They are observational only and <strong>not medical diagnoses or clinical advisories</strong>.
        </div>

        {unresolved.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Active Alerts ({unresolved.length})</h2>
            {unresolved.map(a => <AlertCard key={a.id} alert={a} />)}
          </div>
        )}

        {resolved.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-tertiary)' }}>
              Resolved ({resolved.length})
            </h2>
            {resolved.map(a => <AlertCard key={a.id} alert={a} />)}
          </div>
        )}

        {alerts.length === 0 && (
          <div className="card" style={{ borderRadius: 20, textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Active Alerts</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Maya Devi's activity patterns look good!</p>
          </div>
        )}
      </main>
    </div>
  );
}
