import { LogOut, HeartHandshake, Stethoscope, Sparkles } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

interface Props {
  role: 'caregiver' | 'healthcare';
}

const ROLE_META = {
  caregiver: {
    icon: HeartHandshake,
    title: 'Caregiver Dashboard',
    message:
      "You're signed in. The caregiver dashboard — monitoring, reminders, and family memories — is being rebuilt and will land here soon.",
  },
  healthcare: {
    icon: Stethoscope,
    title: 'Healthcare Dashboard',
    message:
      "You're signed in. The clinical dashboard — patient roster, cognitive trend reports — is being rebuilt and will land here soon.",
  },
};

/** Placeholder landing spot for the two roles not being worked on right now — real login, empty content. */
export function EmptyDashboard({ role }: Props) {
  const { user, logout } = useAuth();
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  return (
    <div className="empty-dash">
      <div className="empty-dash__topbar">
        <div className="empty-dash__brand">🧠 Sahaaya</div>
        <button className="empty-dash__logout" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="empty-dash__body">
        <div className="empty-dash__card animate-scale-in">
          <div className="empty-dash__icon">
            <Icon size={40} />
          </div>
          <div className="empty-dash__badge">
            <Sparkles size={13} /> Coming soon
          </div>
          <h1 className="empty-dash__title">{meta.title}</h1>
          <p className="empty-dash__welcome">Welcome, {user?.name ?? 'there'}.</p>
          <p className="empty-dash__message">{meta.message}</p>
        </div>
      </div>
    </div>
  );
}
