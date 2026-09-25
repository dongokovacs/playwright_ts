import type { APIRequestContext, APIResponse } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { APILogger } from '../core/logger';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestSnapshot = {
  path: string;
  params: Record<string, string | number>;
  headers: Record<string, string>;
  body: unknown;
  authDisabled: boolean;
};

// Chainable HTTP client the endpoint clients build on. Each request method
// snapshots path/params/headers/body and resets them *before* sending, so
// state can't leak into the next call — not even when the status assertion
// throws. (It used to reset after the assertion; a failed clearAuth() call
// then left auth disabled for the fixture teardown's delete, which 401'd
// silently and leaked the article.)
export class ApiClient {
  private requestPath = '';
  private queryParams: Record<string, string | number> = {};
  private extraHeaders: Record<string, string> = {};
  private requestBody: unknown;
  private authDisabled = false;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
    private readonly logger: APILogger,
    private readonly authToken?: string,
  ) {}

  path(path: string): this {
    this.requestPath = path;
    return this;
  }

  params(params: Record<string, string | number>): this {
    this.queryParams = params;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.extraHeaders = headers;
    return this;
  }

  body(body: unknown): this {
    this.requestBody = body;
    return this;
  }

  clearAuth(): this {
    this.authDisabled = true;
    return this;
  }

  async getRequest<T = unknown>(expectedStatus: number): Promise<T> {
    return this.send('GET', expectedStatus) as Promise<T>;
  }

  async postRequest<T = unknown>(expectedStatus: number): Promise<T> {
    return this.send('POST', expectedStatus) as Promise<T>;
  }

  async putRequest<T = unknown>(expectedStatus: number): Promise<T> {
    return this.send('PUT', expectedStatus) as Promise<T>;
  }

  async deleteRequest(expectedStatus: number): Promise<void> {
    await this.send('DELETE', expectedStatus);
  }

  private async send(method: HttpMethod, expectedStatus: number): Promise<unknown> {
    const snapshot = this.takeSnapshot();

    return test.step(`${method} ${snapshot.path}`, async () => {
      const url = this.buildUrl(snapshot);
      const headers = this.buildHeaders(snapshot);
      const hasBody = method === 'POST' || method === 'PUT';
      this.logger.logRequest(method, url, headers, hasBody ? snapshot.body : undefined);

      const response = await this.request.fetch(url, {
        method,
        headers,
        ...(hasBody ? { data: snapshot.body } : {}),
      });
      const json = await this.parseBody(response);
      this.logger.logResponse(response.status(), json);
      expect(response.status(), this.logger.getRecentLogs()).toBe(expectedStatus);

      return json;
    });
  }

  private takeSnapshot(): RequestSnapshot {
    const snapshot: RequestSnapshot = {
      path: this.requestPath,
      params: this.queryParams,
      headers: this.extraHeaders,
      body: this.requestBody,
      authDisabled: this.authDisabled,
    };
    this.requestPath = '';
    this.queryParams = {};
    this.extraHeaders = {};
    this.requestBody = undefined;
    this.authDisabled = false;
    return snapshot;
  }

  private buildUrl(snapshot: RequestSnapshot): string {
    const url = new URL(this.baseUrl + snapshot.path);
    for (const [key, value] of Object.entries(snapshot.params)) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private buildHeaders(snapshot: RequestSnapshot): Record<string, string> {
    const headers: Record<string, string> = { ...snapshot.headers };
    if (!snapshot.authDisabled && this.authToken) {
      headers.Authorization = this.authToken;
    }
    return headers;
  }

  private async parseBody(response: APIResponse): Promise<unknown> {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
