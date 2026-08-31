import { Pill, Calendar, User, Activity, Utensils } from 'lucide-react';
import type { PatientProfile, Reminder } from '../../types';
import { EmptyState, NotYetAvailable } from './States';

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'badge--info',
  completed: 'badge--success',
  skipped: 'badge--danger',
  delayed: 'badge--warning',
};

function ReminderList({ reminders, emptyLabel }: { reminders: Reminder[]; emptyLabel: string }) {
  if (reminders.length === 0) return <EmptyState title={emptyLabel} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reminders.map((r) => (
        <div
          key={r.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: 'var(--bg-page)',
            borderRadius: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {r.time}
              {r.date ? ` · ${r.date}` : ' · Daily'}
              {r.adherenceRate !== undefined ? ` · ${Math.round(r.adherenceRate)}% adherence` : ''}
            </div>
          </div>
          <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge--neutral'}`}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}

export function CareInformationPanel({ patient, reminders }: { patient: PatientProfile; reminders: Reminder[] }) {
  const onboarding = patient.preferences?.onboarding;
  const health = onboarding?.health;
  const routine = onboarding?.routine;
  const medicineReminders = reminders.filter((r) => r.type === 'medicine');
  const appointmentReminders = reminders.filter((r) => r.type === 'appointment');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: '#FFF8F0',
          border: '1px solid #FFD08A',
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        Care information below is entered by the patient's caregiver during setup, not sourced from a clinical record.
      </div>

      <div className="card" style={{ borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <User size={16} color="var(--color-primary)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Assigned Caregiver</h3>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{patient.caregiverName}</p>
      </div>

      <div className="card" style={{ borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Pill size={16} color="var(--color-primary)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Medicines</h3>
        </div>
        {health?.medicines && health.medicines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: medicineReminders.length ? 16 : 0 }}>
            {health.medicines.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{m.time}</span>
              </div>
            ))}
          </div>
        )}
        {medicineReminders.length > 0 ? (
          <>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8 }}>Reminder Adherence</h4>
            <ReminderList reminders={medicineReminders} emptyLabel="No medicine reminders" />
          </>
        ) : (
          !health?.medicines?.length && <EmptyState title="No medicine information recorded" />
        )}
      </div>

      <div className="card" style={{ borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Calendar size={16} color="var(--color-primary)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Appointments</h3>
        </div>
        <ReminderList reminders={appointmentReminders} emptyLabel="No appointments recorded" />
      </div>

      <div className="card" style={{ borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Activity size={16} color="var(--color-primary)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Mobility &amp; Diet Notes</h3>
        </div>
        {health?.mobilityIssues || health?.diet ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            {health.mobilityIssues && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Mobility</div>
                <p style={{ color: 'var(--text-secondary)' }}>{health.mobilityIssues}</p>
              </div>
            )}
            {health.diet && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Utensils size={13} /> Diet
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>{health.diet}</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState title="No mobility or diet notes recorded" />
        )}
      </div>

      {routine && (routine.wakeTime || routine.sleepTime || routine.rituals) && (
        <div className="card" style={{ borderRadius: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Daily Routine</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, fontSize: 13 }}>
            {[
              { label: 'Wake', value: routine.wakeTime },
              { label: 'Breakfast', value: routine.breakfastTime },
              { label: 'Lunch', value: routine.lunchTime },
              { label: 'Dinner', value: routine.dinnerTime },
              { label: 'Sleep', value: routine.sleepTime },
            ]
              .filter((r) => r.value)
              .map((r) => (
                <div key={r.label} style={{ background: 'var(--bg-page)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700 }}>{r.value}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{r.label}</div>
                </div>
              ))}
          </div>
          {routine.rituals && (
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 12 }}>{routine.rituals}</p>
          )}
        </div>
      )}

      <div className="card" style={{ borderRadius: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Care Notes, Goals &amp; Interventions</h3>
        <NotYetAvailable label="Structured care notes, goals, and interventions" />
      </div>
    </div>
  );
}
