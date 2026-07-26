export interface AuditApiResponse {
  requestId: string;
  data: {
    url: string;
    finalUrl: string;
    statusCode: number;
    ok: boolean;
    responseTimeMs: number;
    contentType: string | null;
    title: string | null;
    metaDescription: string | null;
    links: number;
    headings: {
      h1: number;
      h2: number;
    };
    issues: string[];
    score: number;
    fetchedAt: string;
    cached: boolean;
  };
}

export async function runAudit(url: string): Promise<AuditApiResponse> {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ url })
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || 'Audit failed.';
    throw new Error(message);
  }

  return payload as AuditApiResponse;
}
