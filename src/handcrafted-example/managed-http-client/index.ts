import XHRClientWrapper from '../xhr-client-wrapper';

export default class ManagedHTTPClient {
  http: XHRClientWrapper;
  timeoutMs: number;

  constructor({ http, timeoutMs }: { http: XHRClientWrapper; timeoutMs: number }) {
    this.http = http;
    this.timeoutMs = timeoutMs;
  }

  async get(url: string): Promise<unknown> {
    return await Promise.race([this.timeoutPromise(), this.http.get(url)]);
  }

  private async timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          `The requested operation timed out following the application's SLO of ${this.timeoutMs}.`
        );
      }, this.timeoutMs);
    });
  }
}
