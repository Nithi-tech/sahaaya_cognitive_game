import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Bell, BookOpen, AlertTriangle,
  Users, TrendingUp, LogOut, Repeat
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../constants/demoAccounts';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  to: string;
}

interface SidebarProps {
  items: SidebarItem[];
  role: 'caregiver' | 'healthcare';
}

export function Sidebar({ items, role }: SidebarProps) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchRole = async (email: string) => {
    setSwitching(email);
    try {
      await login(email, DEMO_PASSWORD);
      navigate('/');
    } catch {
      setSwitching(null);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div style={{ fontSize: 28, marginBottom: 4 }}>🧠</div>
        <div className="sidebar__brand-name">Sahaaya</div>
        <div className="sidebar__brand-tagline">
          {role === 'caregiver' ? 'Caregiver Portal' : 'Healthcare Portal'}
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar__nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 8 }}>
          Logged in as
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>{user?.name}</div>

        {showRoleSwitch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {DEMO_ACCOUNTS.filter((acc) => acc.email !== user?.email).map((acc) => (
              <button
                key={acc.role}
                onClick={() => handleSwitchRole(acc.email)}
                disabled={switching !== null}
                className="btn btn--outline btn--sm"
                style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
              >
                <span>{acc.emoji}</span> {switching === acc.email ? 'Switching…' : acc.sub}
              </button>
            ))}
          </div>
        )}

        <button
          className="btn btn--outline btn--sm"
          onClick={() => setShowRoleSwitch((v) => !v)}
          style={{ width: '100%', gap: 6, marginBottom: 8 }}
        >
          <Repeat size={14} /> Switch Role
        </button>
        <button className="btn btn--ghost btn--sm" onClick={handleLogout} style={{ width: '100%', gap: 6, color: 'var(--text-secondary)' }}>
          <LogOut size={14} /> Log Out
        </button>
      </div>
    </aside>
  );
}

export function CaregiverSidebar() {
  return (
    <Sidebar
      role="caregiver"
      items={[
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', to: '/' },
        { icon: <Activity size={18} />, label: 'Cognitive Activity', to: '/activity' },
        { icon: <Bell size={18} />, label: 'Reminders', to: '/reminders' },
        { icon: <BookOpen size={18} />, label: 'Memory', to: '/memory' },
        { icon: <AlertTriangle size={18} />, label: 'Alerts', to: '/alerts' },
      ]}
    />
  );
}

export function HCWSidebar() {
  return (
    <Sidebar
      role="healthcare"
      items={[
        { icon: <Users size={18} />, label: 'Patients', to: '/' },
        { icon: <TrendingUp size={18} />, label: 'Trends & Reports', to: '/reports' },
      ]}
    />
  );
}
