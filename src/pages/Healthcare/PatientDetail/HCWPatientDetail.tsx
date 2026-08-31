import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Brain, Eye, Search, Layers, Repeat, Activity, Download, Users, Clock } from 'lucide-react';
import { HCWSidebar } from '../../../components/Sidebar/Sidebar';
import { TrendChart, DomainRadarChart } from '../../../components/Charts/Charts';
import { PatientHeader } from '../../../components/HealthcareDashboard/PatientHeader';
import { StatCard } from '../../../components/HealthcareDashboard/StatCard';
import { DomainStatCard } from '../../../components/HealthcareDashboard/DomainStatCard';
import { DateRangeControl } from '../../../components/HealthcareDashboard/DateRangeControl';
import { GameAnalyticsTable } from '../../../components/HealthcareDashboard/GameAnalyticsTable';
import { GameDetailPanel } from '../../../components/HealthcareDashboard/GameDetailPanel';
import { ActivityHeatmap } from '../../../components/HealthcareDashboard/ActivityHeatmap';
import { Timeline, buildTimelineEvents } from '../../../components/HealthcareDashboard/Timeline';
import { AlertsList } from '../../../components/HealthcareDashboard/AlertsList';
import { RecommendationsList } from '../../../components/HealthcareDashboard/RecommendationsList';
import { BaselineComparison } from '../../../components/HealthcareDashboard/BaselineComparison';
import { CareInformationPanel } from '../../../components/HealthcareDashboard/CareInformationPanel';
import { SkeletonRow, ErrorState, EmptyState } from '../../../components/HealthcareDashboard/States';
import { usePatientDashboardData } from '../../../hooks/usePatientDashboardData';
import { buildTrendData } from '../../../utils/trends';
import { average, computeBaseline, computeDomainAggregate, periodOverPeriod, trendDirection } from '../../../utils/analytics';
import { buildHeatmap, computeEngagementSummary } from '../../../utils/engagement';
import { buildGameStats } from '../../../utils/gameAnalytics';
import { GAME_REGISTRY } from '../../../games/registry';
import { generateRecommendations } from '../../../utils/recommendations';
import { daysBetween, presetToDays, type RangePreset } from '../../../utils/dateRange';
import { exportToCsv } from '../../../utils/csvExport';
import { api } from '../../../api/client';
import type { CognitiveDomain } from '../../../types';

const DOMAINS: CognitiveDomain[] = ['memory', 'attention', 'recognition', 'pattern', 'routine'];
const DOMAIN_COLORS: Record<CognitiveDomain, string> = {
  memory: '#E91E63',
  attention: '#2196F3',
  recognition: '#FF9800',
  pattern: '#9C27B0',
  routine: '#4CAF50',
};
const DOMAIN_LABELS: Record<CognitiveDomain, string> = {
  memory: 'Memory',
  attention: 'Attention',
  recognition: 'Recognition',
  pattern: 'Pattern',
  routine: 'Routine',
};
const DOMAIN_ICONS: Record<CognitiveDomain, typeof Brain> = {
  memory: Brain,
  attention: Eye,
  recognition: Search,
  pattern: Layers,
  routine: Repeat,
};

type TabKey = 'overview' | 'cognitive' | 'activities' | 'engagement' | 'alerts' | 'care';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'cognitive', label: 'Cognitive Analytics' },
  { key: 'activities', label: 'Activities & Games' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'alerts', label: 'Alerts & Insights' },
  { key: 'care', label: 'Care Information' },
];

function todayIso() {
  return new Date().toISOString().split('T')[0];
}
function daysAgoIso(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function pluralDays(n: number): string {
  return `${n} day${n === 1 ? '' : 's'}`;
}

function domainMeaning(trend: ReturnType<typeof trendDirection>, count: number): string {
  if (count === 0) return 'No sessions recorded yet.';
  if (trend === 'insufficient_data') return 'Not enough sessions yet for a trend.';
  if (trend === 'improving') return 'Trending upward recently.';
  if (trend === 'declining') return 'Trending down — may need attention.';
  return 'Steady over recent sessions.';
}

export default function HCWPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabKey) || 'overview';

  const [rangePreset, setRangePreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState(daysAgoIso(30));
  const [customTo, setCustomTo] = useState(todayIso());
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const days = rangePreset === 'custom' ? daysBetween(customFrom, customTo) : presetToDays(rangePreset);
  const { state, data, error, reload } = usePatientDashboardData(id, days);

  const setTab = (tab: TabKey) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    next.set('tab', tab);
    return next;
  }, { replace: true });

  const sessions = useMemo(() => data?.sessions ?? [], [data]);
  const overallSeed = data?.profile?.overallEngagement ?? 70;

  const trendData = useMemo(() => buildTrendData(sessions, days, overallSeed), [sessions, days, overallSeed]);
  const overallSeries = trendData.map((t) => t.overall);
  const overallTrend = trendDirection(overallSeries);

  const domainAggregates = useMemo(() => DOMAINS.map((d) => computeDomainAggregate(sessions, d)), [sessions]);

  const gameStats = useMemo(() => buildGameStats(sessions), [sessions]);
  const selectedGame = selectedGameId ? gameStats.find((g) => g.gameId === selectedGameId) ?? null : null;

  const engagementSummary = useMemo(() => computeEngagementSummary(sessions, days), [sessions, days]);
  const heatmapDays = useMemo(() => buildHeatmap(sessions, days), [sessions, days]);

  const timelineEvents = useMemo(
    () => (data ? buildTimelineEvents(sessions, data.alerts, data.memories) : []),
    [sessions, data],
  );

  const recommendations = useMemo(
    () => generateRecommendations(domainAggregates, engagementSummary),
    [domainAggregates, engagementSummary],
  );

  const baseline = computeBaseline(overallSeries);
  const half = Math.floor(overallSeries.length / 2);
  const periodCompare = periodOverPeriod(overallSeries.slice(half), overallSeries.slice(0, half));
  const personalAverage = average(overallSeries);

  const unresolvedAlerts = data?.alerts.filter((a) => !a.resolved) ?? [];
  const lastSessionAt = sessions.length ? sessions.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0].timestamp : null;
  const avgResponseTime = average(sessions.map((s) => s.responseTime));

  const handleResolveAlert = async (alertId: string) => {
    if (!id) return;
    await api.patch(`/alerts/${id}/${alertId}/resolve`);
    reload();
  };

  const handleExportSessions = () => {
    exportToCsv(
      `sahaaya-sessions-${id}.csv`,
      sessions.map((s) => ({
        date: s.timestamp,
        game: s.gameType,
        domain: s.domain,
        difficulty: s.difficulty,
        score: s.score,
        accuracy: s.accuracy,
        responseTime: s.responseTime,
        mistakes: s.mistakes,
        completed: s.completed,
      })),
    );
  };

  return (
    <div className="dashboard-layout">
      <HCWSidebar />
      <main className="dashboard-content">
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => navigate('/')}
          style={{ gap: 6, color: 'var(--text-secondary)', marginBottom: 12, paddingLeft: 0 }}
        >
          <ArrowLeft size={16} /> All Patients
        </button>

        {state === 'loading' && <SkeletonRow count={3} height={100} />}
        {state === 'error' && <ErrorState message={error ?? "Couldn't load this patient."} onRetry={reload} />}

        {state === 'success' && data && (
          <>
            <PatientHeader
              patient={data.patient}
              overallScore={data.profile?.overallEngagement ?? null}
              overallTrend={overallTrend}
              lastSessionAt={lastSessionAt}
              unresolvedAlertCount={unresolvedAlerts.length}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <div className="tabs" role="tablist" aria-label="Dashboard sections">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={activeTab === t.key}
                      className={`tab ${activeTab === t.key ? 'active' : ''}`}
                      onClick={() => setTab(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <DateRangeControl
                preset={rangePreset}
                customFrom={customFrom}
                customTo={customTo}
                onPresetChange={setRangePreset}
                onCustomChange={(from, to) => {
                  setCustomFrom(from);
                  setCustomTo(to);
                }}
              />
            </div>

            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="stat-grid">
                  <StatCard
                    label="Overall Score"
                    value={String(data.profile?.overallEngagement ?? '—')}
                    icon={<Activity size={18} />}
                    color="var(--color-primary)"
                    bg="rgba(46,125,139,0.08)"
                    direction={overallTrend}
                    meaning={domainMeaning(overallTrend, sessions.length)}
                  />
                  {domainAggregates.map((agg) => {
                    const Icon = DOMAIN_ICONS[agg.domain];
                    return (
                      <StatCard
                        key={agg.domain}
                        label={DOMAIN_LABELS[agg.domain]}
                        value={agg.current !== null ? String(agg.current) : '—'}
                        icon={<Icon size={18} />}
                        color={DOMAIN_COLORS[agg.domain]}
                        bg={`${DOMAIN_COLORS[agg.domain]}18`}
                        direction={agg.trend}
                        meaning={domainMeaning(agg.trend, agg.count)}
                      />
                    );
                  })}
                  <StatCard
                    label="Engagement"
                    value={`${engagementSummary.totalSessions} sessions`}
                    icon={<Users size={18} />}
                    color="var(--color-info)"
                    bg="var(--color-info-light)"
                    comparisonLabel={`${engagementSummary.activeDaysInRange}/${engagementSummary.possibleDaysInRange} active days`}
                    meaning={
                      engagementSummary.consistencyPercent !== null
                        ? `${Math.round(engagementSummary.consistencyPercent)}% consistency over this period`
                        : 'Not enough data yet'
                    }
                  />
                </div>

                {unresolvedAlerts.length > 0 && (
                  <div className="card" style={{ borderRadius: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700 }}>Active Alerts ({unresolvedAlerts.length})</h3>
                      <button className="btn btn--outline btn--sm" onClick={() => setTab('alerts')}>
                        View All
                      </button>
                    </div>
                    <AlertsList alerts={unresolvedAlerts} showResolved={false} onResolve={handleResolveAlert} />
                  </div>
                )}

                <div className="card" style={{ borderRadius: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Overall Trend</h3>
                  <TrendChart data={trendData} xKey="date" lines={[{ key: 'overall', color: 'var(--color-primary)', label: 'Overall' }]} height={160} />
                </div>

                <div className="card" style={{ borderRadius: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Activity</h3>
                    <button className="btn btn--outline btn--sm" onClick={() => setTab('engagement')}>
                      View All
                    </button>
                  </div>
                  <Timeline events={timelineEvents} limit={5} />
                </div>
              </div>
            )}

            {activeTab === 'cognitive' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <TrendChart
                  data={trendData}
                  xKey="date"
                  title={`Cognitive Trend — Last ${days} Days`}
                  lines={DOMAINS.map((d) => ({ key: d, color: DOMAIN_COLORS[d], label: DOMAIN_LABELS[d] }))}
                  height={320}
                />
                <div className="dashboard-two-col" style={{ gap: 20 }}>
                  <DomainRadarChart
                    title="Domain Profile"
                    color="var(--color-primary)"
                    data={domainAggregates.filter((a) => a.count > 0).map((a) => ({ domain: DOMAIN_LABELS[a.domain], score: a.current ?? 0 }))}
                  />
                  <BaselineComparison
                    current={data.profile?.overallEngagement ?? 0}
                    baseline={baseline}
                    baselineCaption="earliest sessions"
                    previousPeriodAvg={periodCompare.previousAvg}
                    personalAverage={personalAverage}
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Domain Breakdown</h3>
                  <div className="stat-grid">
                    {domainAggregates.map((agg) => (
                      <DomainStatCard key={agg.domain} aggregate={agg} color={DOMAIN_COLORS[agg.domain]} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="stat-grid">
                  <StatCard
                    label="Games Played"
                    value={String(gameStats.length)}
                    icon={<Activity size={18} />}
                    color="var(--color-primary)"
                    bg="rgba(46,125,139,0.08)"
                    meaning={`out of ${GAME_REGISTRY.length} activities in the library`}
                  />
                  <StatCard
                    label="Total Sessions"
                    value={String(sessions.length)}
                    icon={<Users size={18} />}
                    color="var(--color-info)"
                    bg="var(--color-info-light)"
                  />
                  <StatCard
                    label="Avg. Response Time"
                    value={avgResponseTime !== null ? `${avgResponseTime.toFixed(1)}s` : '—'}
                    icon={<Clock size={18} />}
                    color="var(--color-accent)"
                    bg="rgba(232,166,58,0.12)"
                    meaning="Faster, steady response times are generally a good sign"
                  />
                </div>

                <div className="card" style={{ borderRadius: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Activity Performance</h3>
                    {sessions.length > 0 && (
                      <button className="btn btn--outline btn--sm" onClick={handleExportSessions} style={{ gap: 6 }}>
                        <Download size={14} /> Export CSV
                      </button>
                    )}
                  </div>
                  <GameAnalyticsTable stats={gameStats} selectedGameId={selectedGameId} onSelect={setSelectedGameId} />
                </div>

                {selectedGame && <GameDetailPanel game={selectedGame} allGames={gameStats} />}
              </div>
            )}

            {activeTab === 'engagement' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="stat-grid">
                  <StatCard label="Active Days" value={String(engagementSummary.activeDaysInRange)} icon={<Activity size={18} />} color="var(--color-success)" bg="var(--color-success-light)" comparisonLabel={`of ${engagementSummary.possibleDaysInRange} days`} />
                  <StatCard label="Consistency" value={engagementSummary.consistencyPercent !== null ? `${Math.round(engagementSummary.consistencyPercent)}%` : '—'} icon={<Users size={18} />} color="var(--color-info)" bg="var(--color-info-light)" />
                  <StatCard label="Current Streak" value={pluralDays(engagementSummary.currentStreak)} icon={<Repeat size={18} />} color="var(--color-primary)" bg="rgba(46,125,139,0.08)" />
                  <StatCard label="Longest Streak" value={pluralDays(engagementSummary.longestStreak)} icon={<Repeat size={18} />} color="var(--color-accent)" bg="rgba(232,166,58,0.12)" />
                  <StatCard label="Missed Days" value={String(engagementSummary.missedDaysInRange)} icon={<Clock size={18} />} color="var(--color-warning)" bg="var(--color-warning-light)" />
                </div>

                <div className="card" style={{ borderRadius: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Activity Consistency</h3>
                  <ActivityHeatmap days={heatmapDays} />
                </div>

                <div className="card" style={{ borderRadius: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Recent Activity Timeline</h3>
                  <Timeline events={timelineEvents} limit={30} />
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="dashboard-two-col" style={{ gap: 20 }}>
                <div className="card" style={{ borderRadius: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Alerts</h3>
                  <AlertsList alerts={data.alerts} onResolve={handleResolveAlert} />
                </div>
                <div className="card" style={{ borderRadius: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Recommendations</h3>
                  <RecommendationsList recommendations={recommendations} />
                </div>
              </div>
            )}

            {activeTab === 'care' && <CareInformationPanel patient={data.patient} reminders={data.reminders} />}
          </>
        )}

        {state === 'success' && !data && <EmptyState title="No patient data" />}
      </main>
    </div>
  );
}
