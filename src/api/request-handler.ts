import type { APIRequestContext, APIResponse } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { APILogger } from '../core/logger';

/**
 * Fluent, chainable HTTP client used by every endpoint-specific client class.
 * Each request method (.getRequest/.postRequest/...) builds the URL from the
 * accumulated path/params, asserts the expected status, logs the exchange,
 * and resets its own per-call state (path/params/headers/body) so nothing
 * leaks into the next call on the same instance.
 */
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
    return test.step(`GET ${this.requestPath}`, async () => {
      const url = this.buildUrl();
      const headers = this.buildHeaders();
      this.logger.logRequest('GET', url, headers);

      const response = await this.request.get(url, { headers });
      const json = await this.parseBody(response);
      this.logger.logResponse(response.status(), json);
      expect(response.status(), this.logger.getRecentLogs()).toBe(expectedStatus);

      this.cleanUpFields();
      return json as T;
    });
  }

  async postRequest<T = unknown>(expectedStatus: number): Promise<T> {
    return test.step(`POST ${this.requestPath}`, async () => {
      const url = this.buildUrl();
      const headers = this.buildHeaders();
      this.logger.logRequest('POST', url, headers, this.requestBody);

      const response = await this.request.post(url, { headers, data: this.requestBody });
      const json = await this.parseBody(response);
      this.logger.logResponse(response.status(), json);
      expect(response.status(), this.logger.getRecentLogs()).toBe(expectedStatus);

      this.cleanUpFields();
      return json as T;
    });
  }

  async putRequest<T = unknown>(expectedStatus: number): Promise<T> {
    return test.step(`PUT ${this.requestPath}`, async () => {
      const url = this.buildUrl();
      const headers = this.buildHeaders();
      this.logger.logRequest('PUT', url, headers, this.requestBody);

      const response = await this.request.put(url, { headers, data: this.requestBody });
      const json = await this.parseBody(response);
      this.logger.logResponse(response.status(), json);
      expect(response.status(), this.logger.getRecentLogs()).toBe(expectedStatus);

      this.cleanUpFields();
      return json as T;
    });
  }

  async deleteRequest(expectedStatus: number): Promise<void> {
    return test.step(`DELETE ${this.requestPath}`, async () => {
      const url = this.buildUrl();
      const headers = this.buildHeaders();
      this.logger.logRequest('DELETE', url, headers);

      const response = await this.request.delete(url, { headers });
      this.logger.logResponse(response.status());
      expect(response.status(), this.logger.getRecentLogs()).toBe(expectedStatus);

      this.cleanUpFields();
    });
  }

  private buildUrl(): string {
    const url = new URL(this.baseUrl + this.requestPath);
    for (const [key, value] of Object.entries(this.queryParams)) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { ...this.extraHeaders };
    if (!this.authDisabled && this.authToken) {
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

  private cleanUpFields(): void {
    this.requestPath = '';
    this.queryParams = {};
    this.extraHeaders = {};
    this.requestBody = undefined;
    this.authDisabled = false;
  }
}
