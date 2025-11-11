import * as dotenv from 'dotenv';

dotenv.config();

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class JinaApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'JinaApiError';
  }
}

export class JinaApiClient {
  private apiKey: string | undefined;
  private timeout: number = 60000; // 60 seconds default (for Reader API with rendering)

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.JINA_API_KEY;
  }

  async fetch<T>(
    url: string,
    options?: RequestInit & { timeout?: number }
  ): Promise<T> {
    const timeout = options?.timeout || this.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = new Headers(options?.headers || {});

      // Add Authorization header if API key is available
      if (this.apiKey) {
        headers.set('Authorization', `Bearer ${this.apiKey}`);
      }

      // Request JSON format by default
      headers.set('Accept', 'application/json');

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      // Handle error statuses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData: any = null;

        try {
          if (contentType?.includes('application/json')) {
            errorData = await response.json();
          } else {
            errorData = await response.text();
          }
        } catch (e) {
          // Ignore parse errors
        }

        throw new JinaApiError(
          response.status,
          this.getErrorCode(response.status),
          this.getErrorMessage(response.status, errorData),
          errorData
        );
      }

      // Parse response
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        return (await response.json()) as T;
      } else if (contentType?.includes('text')) {
        return (await response.text()) as T;
      } else if (contentType?.includes('image')) {
        return (await response.arrayBuffer()) as T;
      } else {
        return (await response.text()) as T;
      }
    } catch (error) {
      if (error instanceof JinaApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new JinaApiError(
          0,
          'NETWORK_ERROR',
          `Network error: ${error.message}`
        );
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new JinaApiError(
          408,
          'REQUEST_TIMEOUT',
          `Request timeout after ${timeout}ms`
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 402:
        return 'PAYMENT_REQUIRED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return `HTTP_${status}`;
    }
  }

  private getErrorMessage(status: number, errorData: any): string {
    switch (status) {
      case 401:
        return 'Unauthorized: Invalid or missing API key. Check your JINA_API_KEY.';
      case 402:
        return 'Payment Required: API quota exceeded. Check your Jina.AI account usage.';
      case 429:
        const retryAfter = errorData?.retry_after || 'unknown';
        return `Rate Limited: Too many requests. Retry after ${retryAfter}s`;
      case 500:
        return 'Server Error: Jina service internal error.';
      case 503:
        return 'Service Unavailable: Jina service is temporarily down.';
      default:
        return `HTTP ${status}: ${errorData?.message || 'Unknown error'}`;
    }
  }
}

// Utility function for formatted error logging
export function logApiError(error: JinaApiError): string {
  return `
❌ API Error:
   Status: ${error.status}
   Code: ${error.code}
   Message: ${error.message}
   ${error.details ? `Details: ${JSON.stringify(error.details, null, 2)}` : ''}
  `.trim();
}
