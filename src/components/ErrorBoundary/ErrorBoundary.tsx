import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#F8FAFC',
          textAlign: 'center',
          fontFamily: 'inherit',
        }}>
          <div style={{
            maxWidth: 440,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            padding: '32px 24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
            border: '2px solid #E2E8F0',
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🌸</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Let's Refresh
            </h2>
            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.5, marginBottom: 16 }}>
              Something took a quick pause. Tap below to continue playing your games!
            </p>
            {this.state.error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                padding: '8px 12px',
                fontSize: 12,
                color: '#DC2626',
                marginBottom: 20,
                textAlign: 'left',
                wordBreak: 'break-all',
              }}>
                <strong>Details:</strong> {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                height: 54,
                borderRadius: 999,
                fontSize: 17,
                fontWeight: 800,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(2, 132, 199, 0.3)',
              }}
            >
              🔄 Refresh &amp; Continue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
