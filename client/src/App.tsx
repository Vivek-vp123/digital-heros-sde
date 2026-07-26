import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { runAudit, type AuditApiResponse } from './api';
import Footer from './Footer';

const sampleUrls = [
  'https://example.com',
  'https://www.wikipedia.org',
  'https://developer.mozilla.org'
];

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sitescan-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
}

export default function App() {
  const [url, setUrl] = useState(sampleUrls[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditApiResponse | null>(null);
  const [history, setHistory] = useState<AuditApiResponse[]>([]);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sitescan-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    document.documentElement.classList.add('theme-transitioning');
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 450);
  }, []);

  const scoreLabel = useMemo(() => {
    if (!result) return 'Ready';
    if (result.data.score >= 85) return 'Healthy';
    if (result.data.score >= 60) return 'Needs work';
    return 'At risk';
  }, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = await runAudit(url.trim());
      setResult(payload);
      setHistory((current) => [payload, ...current].slice(0, 4));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Audit failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ===== Top Navigation ===== */}
      <header className="top-nav">
        <nav className="top-nav-inner">
          <div className="nav-brand">
            <span className="material-symbols-outlined">security</span>
            <span className="nav-brand-name">SiteScan Pro</span>
          </div>

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#api">API</a>
            <a href="#metrics">Uptime</a>
            <a href="#results" className="active">Results</a>
          </div>

          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className="material-symbols-outlined">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <button className="mobile-menu-btn" aria-label="Menu">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </nav>
      </header>

      <main style={{ paddingTop: '64px' }}>
        {/* ===== Hero Section ===== */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-content">
                <div className="status-pill">
                  <span className="status-dot" />
                  <span>System Status: Optimal</span>
                </div>

                <h1 className="hero-title">
                  Enterprise <span className="highlight">URL Auditing</span> for Production Systems.
                </h1>

                <p className="hero-subtitle">
                  A precision instrument for developers. Monitor, validate, and audit high-traffic
                  endpoints with sub-millisecond overhead and mathematical resilience.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="audit-input-wrapper">
                    <div className="input-container">
                      <span className="material-symbols-outlined">link</span>
                      <input
                        id="url"
                        name="url"
                        type="url"
                        className="audit-input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.yourdomain.com/v1"
                        autoComplete="url"
                      />
                    </div>
                    <button type="submit" className="audit-submit-btn" disabled={loading}>
                      <span>{loading ? 'Auditing…' : 'Quick Audit'}</span>
                      <span className="material-symbols-outlined">bolt</span>
                    </button>
                  </div>

                  <div className="sample-row" aria-label="Sample URLs">
                    {sampleUrls.map((sampleUrl) => (
                      <button
                        key={sampleUrl}
                        type="button"
                        className="sample-chip"
                        onClick={() => setUrl(sampleUrl)}
                      >
                        {sampleUrl.replace('https://', '')}
                      </button>
                    ))}
                  </div>
                </form>

                <p className="audit-hint">
                  <span className="material-symbols-outlined">info</span>
                  Free one-time audit. No API key required for preview.
                </p>

                {error ? <p className="error-banner">{error}</p> : null}
              </div>

              <div className="hero-visual">
                <div className="hero-visual-inner">
                  <span className="material-symbols-outlined hero-visual-icon">security</span>
                  <div className="hero-atmo-1" />
                  <div className="hero-atmo-2" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Stats Grid ===== */}
        <section className="stats-section" id="metrics">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">150ms</div>
                <div className="stat-label">Avg Response</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">2.4M+</div>
                <div className="stat-label">Audits/Day</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0%</div>
                <div className="stat-label">Data Loss</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Features Bento Grid ===== */}
        <section className="features-section" id="features">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Technical Precision</h2>
              <p className="section-subtitle">
                Architected for systems where failure is not an option. SiteScan Pro integrates at the
                network layer to provide deep visibility.
              </p>
            </div>

            <div className="bento-grid">
              {/* Production Resilience - Wide */}
              <div className="bento-card span-8">
                <div className="bento-card-inner">
                  <div>
                    <div className="bento-card-icon primary">
                      <span className="material-symbols-outlined">verified_user</span>
                    </div>
                    <h3>Production Resilience</h3>
                    <p className="body-text">
                      Hardened input validation and configurable request timeouts ensure that your audit
                      process never becomes a bottleneck or a security risk.
                    </p>
                    <ul className="feature-checklist">
                      <li>
                        <span className="material-symbols-outlined">check_circle</span>
                        JWT-based Authentication
                      </li>
                      <li>
                        <span className="material-symbols-outlined">check_circle</span>
                        Auto-retry Logic
                      </li>
                      <li>
                        <span className="material-symbols-outlined">check_circle</span>
                        Payload Sanitization
                      </li>
                      <li>
                        <span className="material-symbols-outlined">check_circle</span>
                        Global Failover
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Rate Limiting - Narrow */}
              <div className="bento-card span-4">
                <div className="bento-card-icon tertiary">
                  <span className="material-symbols-outlined">speed</span>
                </div>
                <h3>Rate Limiting</h3>
                <p>
                  Granular per-client logic allowing you to define burst limits and sliding window
                  quotas for different user tiers.
                </p>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" />
                </div>
                <div className="progress-meta">
                  <span className="label">Quota</span>
                  <span className="value">6,500 / 10,000 req</span>
                </div>
              </div>

              {/* Intelligent Caching - Narrow */}
              <div className="bento-card span-4">
                <div className="bento-card-icon secondary">
                  <span className="material-symbols-outlined">memory</span>
                </div>
                <h3>Intelligent Caching</h3>
                <p>
                  Configurable TTL windows and edge caching reduce redundant requests and lower
                  infrastructure costs significantly.
                </p>
              </div>

              {/* Real-time Visualization - Wide */}
              <div className="bento-card span-8">
                <div className="bento-card-inner" style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flexGrow: 1 }}>
                    <h3>Real-time Visualization</h3>
                    <div className="audit-preview-list">
                      <div className="audit-preview-card passed">
                        <span className="card-label">SSL Certificate Validity</span>
                        <span className="status-badge">PASSED</span>
                      </div>
                      <div className="audit-preview-card warning">
                        <span className="card-label">Header Policy: X-Frame</span>
                        <span className="status-badge">WARNING</span>
                      </div>
                      <div className="audit-preview-card failed">
                        <span className="card-label">Subresource Integrity</span>
                        <span className="status-badge">FAILED</span>
                      </div>
                    </div>
                  </div>
                  <div className="bento-visual">
                    <span className="material-symbols-outlined">monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== API / Developer Section ===== */}
        <section className="api-section" id="api">
          <div className="container">
            <div className="api-grid">
              <div>
                <div className="api-badge-row">
                  <span className="api-badge">Live API</span>
                  <span className="api-ci-badge">
                    <span className="material-symbols-outlined">integration_instructions</span>
                    CI/CD Ready
                  </span>
                </div>
                <h2 className="api-title">Built for Developers, by Developers</h2>
                <p className="api-description">
                  Our API is designed for predictability. Strict versioning, robust error handling, and
                  comprehensive JSON responses make integration a matter of minutes, not days.
                </p>
                <div className="api-steps">
                  <div className="api-step">
                    <div className="api-step-num">1</div>
                    <p>POST your URL to /v1/audit/async</p>
                  </div>
                  <div className="api-step">
                    <div className="api-step-num">2</div>
                    <p>Listen for a webhook or poll for the scan_id</p>
                  </div>
                  <div className="api-step">
                    <div className="api-step-num">3</div>
                    <p>Ingest deep-scan metrics directly into your Prometheus instance</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="code-window">
                  <div className="code-window-header">
                    <div className="code-window-dots">
                      <span /><span /><span />
                    </div>
                    <span className="code-window-title">response.json</span>
                  </div>
                  <div className="code-window-body">
                    <pre>{`{
  `}<span className="json-key">"audit_id"</span>{`: `}<span className="json-string">"scn_8392XzL9"</span>{`,
  `}<span className="json-key">"timestamp"</span>{`: `}<span className="json-string">"2024-11-20T14:22:01Z"</span>{`,
  `}<span className="json-key">"target"</span>{`: `}<span className="json-string">"https://prod.service.internal"</span>{`,
  `}<span className="json-key">"metrics"</span>{`: {
    `}<span className="json-key">"dns_latency"</span>{`: `}<span className="json-number">12</span>{`,
    `}<span className="json-key">"ttfb"</span>{`: `}<span className="json-number">84</span>{`,
    `}<span className="json-key">"tls_handshake"</span>{`: `}<span className="json-number">22</span>{`
  },
  `}<span className="json-key">"status"</span>{`: `}<span className="json-string">"complete"</span>{`,
  `}<span className="json-key">"resilience_score"</span>{`: `}<span className="json-number">0.98</span>{`
}`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Audit Results ===== */}
        <section className="results-section" id="results">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Audit Dashboard</h2>
              <p className="section-subtitle">
                Run an audit above to see live results. Status: <strong>{scoreLabel}</strong>
                {result?.requestId && <> · Request ID: <code>{result.requestId}</code></>}
              </p>
            </div>

            <div className="results-grid">
              {/* Latest Audit Panel */}
              <div className="result-panel">
                <div className="panel-header">
                  <span className="panel-title">Latest audit</span>
                  {result ? (
                    <span className={result.data.cached ? 'badge cached' : 'badge'}>
                      {result.data.cached ? 'cached' : 'fresh'}
                    </span>
                  ) : null}
                </div>

                {result ? (
                  <div className="result-data-grid">
                    <div className="result-data-item">
                      <span className="label">Score</span>
                      <strong className="value">{result.data.score}/100</strong>
                    </div>
                    <div className="result-data-item">
                      <span className="label">Status code</span>
                      <strong className="value">{result.data.statusCode}</strong>
                    </div>
                    <div className="result-data-item">
                      <span className="label">Response time</span>
                      <strong className="value">{result.data.responseTimeMs} ms</strong>
                    </div>
                    <div className="result-data-item">
                      <span className="label">Title</span>
                      <strong className="value">{result.data.title ?? 'Missing'}</strong>
                    </div>
                    <div className="result-data-item">
                      <span className="label">Description</span>
                      <strong className="value">{result.data.metaDescription ?? 'Missing'}</strong>
                    </div>
                    <div className="result-data-item">
                      <span className="label">Issues</span>
                      <strong className="value">
                        {result.data.issues.length
                          ? result.data.issues.join(', ')
                          : 'No critical issues detected'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">
                    Run an audit to see caching, error handling, and URL health details here.
                  </p>
                )}
              </div>

              {/* History Panel */}
              <div className="result-panel">
                <div className="panel-header">
                  <span className="panel-title">Recent runs</span>
                  <span className="panel-subtitle">Most recent first</span>
                </div>

                <div className="history-list">
                  {history.length ? (
                    history.map((entry) => (
                      <div key={entry.requestId} className="history-item">
                        <div className="history-item-url">
                          <strong>{entry.data.url}</strong>
                          <span>{entry.data.finalUrl}</span>
                        </div>
                        <div className="history-meta">
                          <span>{entry.data.score}/100</span>
                          <span>{entry.data.cached ? 'cached' : 'fresh'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">Your last four audits will appear here.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA Section ===== */}
        <section className="cta-section">
          <div className="container">
            <h2 className="cta-title">Ready to secure your endpoints?</h2>
            <p className="cta-subtitle">
              Join 2,000+ engineering teams monitoring their critical infrastructure with SiteScan Pro.
            </p>
            <div className="cta-buttons">
              <button className="btn-primary">Get Started Free</button>
              <button className="btn-outline">Talk to Engineering</button>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer (original text preserved) ===== */}
      <div className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="material-symbols-outlined">security</span>
            <span className="footer-brand-name">SiteScan Pro</span>
          </div>
          <Footer />
          <div className="footer-links">
            <a href="#metrics">Status</a>
            <a href="#api">API</a>
            <a href="#features">Features</a>
          </div>
        </div>
      </div>

      {/* ===== Mobile Bottom Navigation ===== */}
      <div className="mobile-nav">
        <div className="mobile-nav-inner">
          <a href="#" className="mobile-nav-item active">
            <span className="material-symbols-outlined">home</span>
            <span>Home</span>
          </a>
          <a href="#features" className="mobile-nav-item">
            <span className="material-symbols-outlined">analytics</span>
            <span>Audit</span>
          </a>
          <a href="#api" className="mobile-nav-item">
            <span className="material-symbols-outlined">code</span>
            <span>API</span>
          </a>
          <a href="#results" className="mobile-nav-item">
            <span className="material-symbols-outlined">description</span>
            <span>Results</span>
          </a>
        </div>
      </div>
    </>
  );
}
