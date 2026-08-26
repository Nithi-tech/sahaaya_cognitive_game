import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Bell, BookOpen, AlertTriangle,
  Users, TrendingUp, LogOut, Repeat, Menu, X, BrainCircuit,
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
  const location = useLocation();
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // A route change from tapping a nav link should close the mobile drawer —
  // otherwise it stays open, covering the page it just navigated to.
  useEffect(() => setMobileOpen(false), [location.pathname]);

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

  const portalLabel = role === 'caregiver' ? 'Caregiver Portal' : 'Healthcare Portal';

  const sidebarContent = (
    <>
      <div className="sidebar__brand">
        <BrainCircuit size={28} color="var(--color-primary)" style={{ marginBottom: 4 }} />
        <div className="sidebar__brand-name">Sahaaya</div>
        <div className="sidebar__brand-tagline">{portalLabel}</div>
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
    </>
  );

  return (
    <>
      {/* Mobile-only top bar — the sidebar itself is hidden below the
          desktop/tablet breakpoint (see index.css), so without this a
          caregiver or clinician opening the app on a phone would have no
          way to navigate at all beyond the one page they landed on. */}
      <div className="mobile-topbar">
        <button
          className="mobile-topbar__menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="mobile-topbar__brand">Sahaaya · {portalLabel}</span>
      </div>

      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <button
          className="sidebar__close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>
    </>
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
