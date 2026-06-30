type RequestLogEntry = {
  type: 'request';
  timestamp: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
};

type ResponseLogEntry = {
  type: 'response';
  timestamp: string;
  status: number;
  body?: unknown;
};

type LogEntry = RequestLogEntry | ResponseLogEntry;

const MAX_ENTRIES = 10;

// Keeps the last N request/response pairs for a test, so a failing
// assertion can show what the API actually said instead of just "expected X
// got Y". Used by the custom expect matchers.
export class APILogger {
  private readonly recentLogs: LogEntry[] = [];

  logRequest(method: string, url: string, headers?: Record<string, string>, body?: unknown): void {
    this.push({ type: 'request', timestamp: new Date().toISOString(), method, url, headers, body });
  }

  logResponse(status: number, body?: unknown): void {
    this.push({ type: 'response', timestamp: new Date().toISOString(), status, body });
  }

  getRecentLogs(): string {
    return this.recentLogs
      .map((entry) =>
        entry.type === 'request'
          ? `[${entry.timestamp}] Request: ${entry.method} ${entry.url}\n${JSON.stringify(
              { headers: entry.headers, body: entry.body },
              null,
              2,
            )}`
          : `[${entry.timestamp}] Response: ${entry.status}\n${JSON.stringify(entry.body, null, 2)}`,
      )
      .join('\n---\n');
  }

  private push(entry: LogEntry): void {
    this.recentLogs.push(entry);
    if (this.recentLogs.length > MAX_ENTRIES) {
      this.recentLogs.shift();
    }
  }
}
