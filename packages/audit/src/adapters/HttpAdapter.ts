import { AuditAdapter, AuditEvent } from '../types';

export interface HttpClient {
  post(url: string, data: any, headers?: Record<string, string>): Promise<any>;
}

export interface HttpAdapterConfig {
  client?: HttpClient;
  endpoint: string;
  headers?: Record<string, string>;
  mapEvent?: (event: AuditEvent) => any;
  onError?: (error: Error, event: AuditEvent) => void;
}

export class HttpAdapter implements AuditAdapter {
  private client: HttpClient;
  private endpoint: string;
  private headers: Record<string, string>;
  private mapEvent: (event: AuditEvent) => any;
  private onError?: (error: Error, event: AuditEvent) => void;

  constructor(config: HttpAdapterConfig) {
    this.client = config.client || this.defaultHttpClient();
    this.endpoint = config.endpoint;
    this.headers = config.headers || { 'Content-Type': 'application/json' };
    this.mapEvent = config.mapEvent || this.defaultMapEvent;
    this.onError = config.onError;
  }

  async log(event: AuditEvent): Promise<void> {
    try {
      const payload = this.mapEvent(event);
      await this.client.post(this.endpoint, payload, this.headers);
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error, event);
      } else {
        console.error('[HttpAdapter] Failed to send audit log:', error);
      }
    }
  }

  private defaultHttpClient(): HttpClient {
    return {
      post: async (url: string, data: any, headers?: Record<string, string>) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers || {},
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
    };
  }

  private defaultMapEvent(event: AuditEvent): any {
    return {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };
  }
}
