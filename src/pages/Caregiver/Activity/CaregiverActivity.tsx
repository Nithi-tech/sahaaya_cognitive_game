import { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { CaregiverSidebar } from '../../../components/Sidebar/Sidebar';
import { TrendChart, ScoreRing } from '../../../components/Charts/Charts';
import { buildTrendData } from '../../../utils/trends';
import { generateInsights } from '../../../engines/adaptiveDifficulty';

type Period = 'daily' | 'weekly' | 'monthly';

export default function CaregiverActivity() {
  const { currentPatient, cognitiveProfile, sessions } = useApp();
  const [period, setPeriod] = useState<Period>('weekly');

  const periodDays = period === 'daily' ? 7 : period === 'weekly' ? 14 : 30;
  const chartData = buildTrendData(sessions, periodDays, cognitiveProfile.overallEngagement);

  const insights = generateInsights(
    {
      memory: cognitiveProfile.memoryScore,
      attention: cognitiveProfile.attentionScore,
      recognition: cognitiveProfile.recognitionScore,
      pattern: cognitiveProfile.patternScore,
      routine: cognitiveProfile.routineScore,
    },
    chartData
  );

  const recentSessions = sessions.slice(-10).reverse();

  return (
    <div className="dashboard-layout">
      <CaregiverSidebar />
      <main className="dashboard-content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Cognitive Activity</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Activity performance trends for {currentPatient?.name ?? 'this patient'} · Not a medical assessment
          </p>
        </div>

        {/* Period Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="tabs">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                className={`tab ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Showing last {periodDays} days
          </span>
        </div>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <TrendChart
            data={chartData}
            xKey="date"
            title="Memory & Attention Trends"
            lines={[
              { key: 'memory', color: '#E91E63', label: 'Memory' },
              { key: 'attention', color: '#2196F3', label: 'Attention' },
            ]}
            height={220}
          />
          <TrendChart
            data={chartData}
            xKey="date"
            title="Recognition & Pattern Trends"
            lines={[
              { key: 'recognition', color: '#FF9800', label: 'Recognition' },
              { key: 'pattern', color: '#9C27B0', label: 'Pattern' },
              { key: 'routine', color: '#4CAF50', label: 'Routine' },
            ]}
            height={220}
          />
          <TrendChart
            data={chartData}
            xKey="date"
            title="Overall Engagement"
            lines={[{ key: 'overall', color: 'var(--color-primary)', label: 'Engagement' }]}
            height={180}
          />
        </div>

        {/* Current Profile */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ borderRadius: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Activity Performance Profile</h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-around', marginBottom: 20 }}>
              <ScoreRing score={cognitiveProfile.memoryScore} label="Memory" color="#E91E63" size={70} />
              <ScoreRing score={cognitiveProfile.attentionScore} label="Attention" color="#2196F3" size={70} />
              <ScoreRing score={cognitiveProfile.recognitionScore} label="Recognition" color="#FF9800" size={70} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
              <ScoreRing score={cognitiveProfile.patternScore} label="Pattern" color="#9C27B0" size={70} />
              <ScoreRing score={cognitiveProfile.routineScore} label="Routine" color="#4CAF50" size={70} />
            </div>
            <div style={{
              padding: '12px 16px', background: '#F8FAFB', borderRadius: 12,
              fontSize: 12, color: 'var(--text-tertiary)',
            }}>
              ⚠️ Scores reflect activity engagement, not medical diagnosis
            </div>
          </div>

          <div className="card" style={{ borderRadius: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Sahaaya Insights</h3>
            {insights.length > 0 ? insights.map((insight, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 12, marginBottom: 10,
                background: insight.includes('decreased') || insight.includes('missed') ? 'var(--color-warning-light)' :
                  insight.includes('consistently') || insight.includes('stable') ? 'var(--color-success-light)' : '#F0F8FA',
                border: `1px solid ${insight.includes('decreased') ? '#FFE0B2' : insight.includes('consistently') ? '#C8E6C9' : '#D4EDF2'}`,
                fontSize: 13, lineHeight: 1.5, fontWeight: 500,
              }}>
                {insight.includes('decreased') ? '🟡' : insight.includes('consistently') ? '🟢' : '🔵'} {insight}
              </div>
            )) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>No insights available yet. More sessions needed.</p>
            )}
          </div>
        </div>

        {/* Recent Sessions Table */}
        <div className="card" style={{ borderRadius: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Activity Sessions</h3>
          {recentSessions.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, padding: '12px 0' }}>
              No activity sessions yet — they'll show up here once an activity is completed.
            </p>
          ) : (
          <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Domain</th>
                <th>Difficulty</th>
                <th>Accuracy</th>
                <th>Mistakes</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.gameType.replace('_', ' ')}</td>
                  <td style={{ textTransform: 'capitalize' }}>{s.domain}</td>
                  <td>
                    <span className={`badge ${s.difficulty === 'easy' ? 'badge--success' : s.difficulty === 'medium' ? 'badge--info' : 'badge--warning'}`}>
                      {s.difficulty}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.accuracy >= 80 ? 'var(--color-success)' : s.accuracy >= 50 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                      {s.accuracy}%
                    </span>
                  </td>
                  <td style={{ color: s.mistakes > 3 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{s.mistakes}</td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                    {new Date(s.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
