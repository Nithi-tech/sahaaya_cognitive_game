import { useState, useRef, useEffect } from 'react';
import type { WeeklyNarrativeSummary } from '../../types';
import { redeemWeeklyCoins } from '../../services/momentJoy/momentJoyService';
import { X, Download, Share2, Clock, Heart, Award, Check, Gift, Sparkles, Coins } from 'lucide-react';

interface Props {
  summary: WeeklyNarrativeSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklyNarrativeReportModal({ summary, isOpen, onClose }: Props) {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [currentSummary, setCurrentSummary] = useState<WeeklyNarrativeSummary | null>(summary);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Redemption state
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [rewardNote, setRewardNote] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  useEffect(() => {
    setCurrentSummary(summary);
    setShowRedeemInput(false);
    setRewardNote('');
    setRedeemSuccess(false);
  }, [summary]);

  if (!isOpen || !currentSummary) return null;

  const handleRedeemCoins = () => {
    if (!currentSummary) return;
    const note = rewardNote.trim() || 'Family Special Treat';
    const { newState } = redeemWeeklyCoins(
      currentSummary.patientId,
      note,
      currentSummary.periodStart,
      currentSummary.periodEnd
    );

    setCurrentSummary((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        coinsEarnedThisWeek: 0,
        totalAllTimeCoins: newState.totalAllTimeCoins,
        coinRedemptionHistory: newState.history,
      };
    });

    setRedeemSuccess(true);
    setShowRedeemInput(false);
    setRewardNote('');
  };

  const handleExportPdf = async () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
      const cleanName = currentSummary.patientName.replace(/\s+/g, '-').toLowerCase();
      pdf.save(`sahaaya-weekly-summary-${cleanName}-${currentSummary.periodEnd}.pdf`);
    } catch (err) {
      console.warn('[WeeklyNarrative] PDF export fallback to print:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Weekly Summary for ${currentSummary.patientName}`,
          text: currentSummary.narrativeText,
        });
        return;
      } catch {
        /* ignore share abort */
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(currentSummary.narrativeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📜</span>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Weekly Family Narrative Summary
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleShare}
              title="Share or copy narrative"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#FFFFFF', border: '1px solid #CBD5E1',
                padding: '6px 12px', borderRadius: 8, fontSize: 12.5,
                fontWeight: 700, color: '#334155', cursor: 'pointer',
              }}
            >
              {copied ? <Check size={14} color="#16A34A" /> : <Share2 size={14} />}
              {copied ? 'Copied' : 'Share'}
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                border: 'none', padding: '6px 14px', borderRadius: 8,
                fontSize: 12.5, fontWeight: 800, color: '#FFFFFF',
                cursor: isExporting ? 'not-allowed' : 'pointer',
              }}
            >
              <Download size={14} />
              {isExporting ? 'Generating PDF…' : 'Export PDF'}
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: '#64748B',
                cursor: 'pointer', padding: 4, display: 'flex',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Container */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div
            ref={reportRef}
            style={{
              background: '#FFFFFF',
              padding: '24px 20px',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              borderBottom: '2px solid #F1F5F9', paddingBottom: 16, marginBottom: 20,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>🌸</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    Sahaaya
                  </span>
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, background: '#E0F2FE',
                    color: '#0369A1', padding: '2px 8px', borderRadius: 99,
                  }}>
                    MOMENTJOY REPORT
                  </span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px' }}>
                  {currentSummary.patientName}'s Weekly Journey
                </h1>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                  Period: {currentSummary.periodStart} to {currentSummary.periodEnd}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>GENERATED LOCALLY</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 2 }}>
                  {new Date(currentSummary.generatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* 5 Metric Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: 10,
              marginBottom: 20,
            }}>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0284C7' }}>{currentSummary.totalActivitiesCompleted}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#0369A1', marginTop: 2 }}>ACTIVITIES</div>
              </div>
              <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#DB2777' }}>{currentSummary.averageAccuracy}%</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9D174D', marginTop: 2 }}>ACCURACY</div>
              </div>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#16A34A' }}>{currentSummary.medicineAdherencePercent}%</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#15803D', marginTop: 2 }}>MEDICINE</div>
              </div>
              <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#CA8A04' }}>{currentSummary.routineCompletionPercent}%</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#854D0E', marginTop: 2 }}>ROUTINES</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)', border: '1.5px solid #FDE047', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#A16207', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span>🪙</span> {currentSummary.coinsEarnedThisWeek}
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#854D0E', marginTop: 2 }}>WEEKLY COINS</div>
              </div>
            </div>

            {/* Weekly Coin Rewards & Family Treat Redemption Card */}
            <div style={{
              background: 'linear-gradient(135deg, #FFFDF5 0%, #FEFCE8 100%)',
              border: '1.5px solid #FDE047',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: '#FDE047', color: '#854D0E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Coins size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#854D0E' }}>
                      Weekly Joy Coins: {currentSummary.coinsEarnedThisWeek} Coins Earned
                    </h3>
                    <p style={{ fontSize: 12, color: '#A16207', margin: '2px 0 0' }}>
                      All-time accumulated: {currentSummary.totalAllTimeCoins} coins
                    </p>
                  </div>
                </div>

                {currentSummary.coinsEarnedThisWeek > 0 && !showRedeemInput && (
                  <button
                    onClick={() => setShowRedeemInput(true)}
                    style={{
                      background: '#EAB308',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3)',
                    }}
                  >
                    <Gift size={14} /> Redeem for Reward
                  </button>
                )}
              </div>

              {redeemSuccess && (
                <div style={{
                  background: '#DCFCE7', border: '1px solid #86EFAC',
                  color: '#15803D', borderRadius: 10, padding: '8px 12px',
                  fontSize: 12.5, fontWeight: 700, marginTop: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Sparkles size={14} /> Coins marked as redeemed! History updated for the family treat.
                </div>
              )}

              {showRedeemInput && (
                <div style={{
                  marginTop: 12, padding: '12px 14px', background: '#FFFFFF',
                  borderRadius: 12, border: '1px solid #FCD34D',
                }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#78350F', marginBottom: 6 }}>
                    Enter Family Reward or Treat for {currentSummary.patientName}:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={rewardNote}
                      onChange={(e) => setRewardNote(e.target.value)}
                      placeholder="e.g. Favorite mango dessert, evening tea with grandchildren"
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        border: '1.5px solid #CBD5E1', fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleRedeemCoins}
                      style={{
                        background: '#16A34A', color: 'white', border: 'none',
                        borderRadius: 8, padding: '0 14px', fontWeight: 800,
                        fontSize: 12.5, cursor: 'pointer',
                      }}
                    >
                      Confirm Treat
                    </button>
                    <button
                      onClick={() => setShowRedeemInput(false)}
                      style={{
                        background: '#F1F5F9', color: '#475569', border: 'none',
                        borderRadius: 8, padding: '0 10px', fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Past Redemptions History */}
              {currentSummary.coinRedemptionHistory.length > 0 && (
                <div style={{ marginTop: 12, borderTop: '1px solid #FEF08A', paddingTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E', marginBottom: 6 }}>
                    Past Family Rewards:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {currentSummary.coinRedemptionHistory.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        style={{
                          fontSize: 12,
                          color: '#78350F',
                          background: '#FFFFFF',
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #FEF08A',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>🎁 {r.rewardNote} ({r.coinsEarned} coins)</span>
                        <span style={{ fontSize: 11, opacity: 0.8 }}>{new Date(r.redeemedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Circadian Peak Timing Box */}
            <div style={{
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              border: '1.5px solid #FDE68A',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Clock size={16} color="#D97706" />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#92400E' }}>
                  Circadian Vitality Window: {currentSummary.circadianPeak.timeOfDay} ({currentSummary.circadianPeak.timeRange})
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#78350F', margin: 0, lineHeight: 1.4 }}>
                {currentSummary.circadianPeak.description}
              </p>
            </div>

            {/* Engagement Highlights */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={16} color="#0284C7" /> Weekly Highlights
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentSummary.engagementHighlights.map((hl, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 13,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Narrative Letter */}
            <div style={{
              background: '#FAF5FF',
              border: '1.5px solid #E9D5FF',
              borderRadius: 16,
              padding: '16px 18px',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#6B21A8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={16} fill="#9333EA" color="#9333EA" /> Family Narrative
              </h3>
              <p style={{
                fontSize: 13.5,
                color: '#4C1D95',
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: 'pre-line',
                fontFamily: 'inherit',
              }}>
                {currentSummary.narrativeText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
