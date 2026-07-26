import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { runAudit, type AuditApiResponse } from './api';
import Footer from './Footer';

const sampleUrls = [
  'https://example.com',
  'https://www.wikipedia.org',
  'https://developer.mozilla.org'
];

export default function App() {
  const [url, setUrl] = useState(sampleUrls[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditApiResponse | null>(null);
  const [history, setHistory] = useState<AuditApiResponse[]>([]);

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
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Page Pulse</p>
          <h1>Production-grade URL audits with guardrails built in.</h1>
          <p className="lede">
            Validate URLs, cache repeat audits, rate limit abusive clients, and keep the whole path observable with
            request IDs and structured logs.
          </p>

          <form className="audit-form" onSubmit={handleSubmit}>
            <label htmlFor="url">Audit URL</label>
            <div className="input-row">
              <input
                id="url"
                name="url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                autoComplete="url"
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Auditing...' : 'Run audit'}
              </button>
            </div>
            <div className="sample-row" aria-label="Sample URLs">
              {sampleUrls.map((sampleUrl) => (
                <button key={sampleUrl} type="button" className="sample-chip" onClick={() => setUrl(sampleUrl)}>
                  {sampleUrl.replace('https://', '')}
                </button>
              ))}
            </div>
          </form>

          {error ? <p className="error-banner">{error}</p> : null}
        </div>

        <aside className="hero-panel">
          <div className="stat-card">
            <span>Status</span>
            <strong>{result ? scoreLabel : 'Awaiting first audit'}</strong>
          </div>
          <div className="stat-card">
            <span>Last request ID</span>
            <strong>{result?.requestId ?? 'Not generated yet'}</strong>
          </div>
          <div className="stat-card">
            <span>Controls</span>
            <strong>Validation, timeout, cache, rate limit</strong>
          </div>
        </aside>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <p>Latest audit</p>
            {result ? <span className={result.data.cached ? 'badge cached' : 'badge'}>{result.data.cached ? 'cached' : 'fresh'}</span> : null}
          </div>

          {result ? (
            <div className="result-grid">
              <div>
                <span>Score</span>
                <strong>{result.data.score}/100</strong>
              </div>
              <div>
                <span>Status code</span>
                <strong>{result.data.statusCode}</strong>
              </div>
              <div>
                <span>Response time</span>
                <strong>{result.data.responseTimeMs} ms</strong>
              </div>
              <div>
                <span>Title</span>
                <strong>{result.data.title ?? 'Missing'}</strong>
              </div>
              <div>
                <span>Description</span>
                <strong>{result.data.metaDescription ?? 'Missing'}</strong>
              </div>
              <div>
                <span>Issues</span>
                <strong>{result.data.issues.length ? result.data.issues.join(', ') : 'No critical issues detected'}</strong>
              </div>
            </div>
          ) : (
            <p className="empty-state">Run an audit to see caching, error handling, and URL health details here.</p>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <p>Recent runs</p>
            <span className="subtle">Most recent first</span>
          </div>

          <div className="history-list">
            {history.length ? (
              history.map((entry) => (
                <div key={entry.requestId} className="history-item">
                  <div>
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
        </article>
      </section>

      <section className="control-strip">
        <div>
          <h2>What production looks like</h2>
          <p>Every audit is validated, logged with a request ID, rate-limited per client, and protected by a Redis cache window.</p>
        </div>
        <div className="control-badges">
          <span>Structured JSON errors</span>
          <span>Redis cache TTL</span>
          <span>Semaphore-backed concurrency limit</span>
          <span>Jest coverage</span>
        </div>
      </section>

      <Footer />
    </main>
  );
}
