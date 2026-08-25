import { useApp } from '../../../store/AppContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { ElderlyNav } from '../../../components/ElderlyNav/ElderlyNav';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ElderlyMyDay() {
  const { dailyActivities } = useApp();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const now = new Date();

  const toMins = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="elderly-layout" style={{ paddingBottom: 90 }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
        padding: '20px 20px 32px',
        color: 'white',
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 99, padding: '8px 12px', color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          {lang === 'as' ? t('myday.title') : 'My Day'}
        </h1>
        <p style={{ opacity: 0.85, fontSize: 16, marginTop: 4 }}>
          {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div style={{ padding: '24px 24px 16px', marginTop: -16 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
          <div className="timeline">
            {dailyActivities.map((activity) => {
              const actMins = toMins(activity.scheduledTime);
              const isPast = actMins < nowMins;
              const isCurrent = Math.abs(actMins - nowMins) < 30;
              const isCompleted = activity.status === 'completed';

              return (
                <div key={activity.id} className="timeline-item">
                  <div className={`timeline-item__dot ${isCompleted ? 'timeline-item__dot--completed' : isCurrent ? 'timeline-item__dot--current' : ''}`} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 52, flexShrink: 0 }}>
                      <div className="timeline-item__time">{activity.scheduledTime}</div>
                    </div>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px',
                      background: isCompleted ? 'var(--color-success-light)' :
                        isCurrent ? 'rgba(46,125,139,0.06)' : 'var(--bg-page)',
                      borderRadius: 14,
                      border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    }}>
                      <span style={{ fontSize: 28 }}>{activity.emoji}</span>
                      <div>
                        <div style={{
                          fontSize: 16, fontWeight: 600,
                          color: isCompleted ? '#2E7D32' : isCurrent ? 'var(--color-primary)' : 'var(--text-primary)',
                        }}>
                          {activity.activity}
                          {isCurrent && !isCompleted && <span style={{ fontSize: 12, background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: 99, marginLeft: 8, fontWeight: 700 }}>NOW</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {isCompleted ? '✓ Completed' : isPast ? 'Missed' : 'Upcoming'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <ElderlyNav />
    </div>
  );
}
