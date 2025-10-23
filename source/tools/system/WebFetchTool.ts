/**
 * WebFetch Tool - Fetch data from URLs
 * Executes only in automation sandbox
 */

export interface WebFetchParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface WebFetchResult {
  success: boolean;
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, string>;
  error?: string;
}

export class WebFetchTool {
  async execute(params: WebFetchParams): Promise<WebFetchResult> {
    try {
      const method = params.method || 'GET';
      const timeout = params.timeout || 30000;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...params.headers,
      };

      const options: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (params.body && method !== 'GET') {
        options.body = typeof params.body === 'string'
          ? params.body
          : JSON.stringify(params.body);
      }

      const response = await fetch(params.url, options);
      clearTimeout(timeoutId);

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.text();
      }

      // Extract headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: `Request timeout after ${params.timeout}ms`,
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }
}
