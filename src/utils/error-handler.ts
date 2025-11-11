import { JinaApiError } from './api-client.js';

export interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Handle API errors and convert to MCP tool response format
 */
export function handleApiError(error: unknown): ToolResponse {
  if (error instanceof JinaApiError) {
    let message = '';

    switch (error.status) {
      case 401:
        message = `🔑 Authentication Error: Invalid or missing API key.\n\n` +
                  `Error: ${error.message}\n\n` +
                  `Make sure your Claude Desktop config has:\n` +
                  `  "headers": {"Authorization": "Bearer YOUR_JINA_API_KEY"}`;
        break;

      case 402:
        message = `💳 Quota Error: API quota exceeded.\n\n` +
                  `${error.message}\n\n` +
                  `Check your Jina.AI account usage at https://jina.ai/api`;
        break;

      case 408:
        message = `⏱️ Request Timeout: The page is taking too long to respond.\n\n` +
                  `${error.message}\n\n` +
                  `Possible causes:\n` +
                  `• The website has heavy JavaScript\n` +
                  `• The server is overloaded\n` +
                  `• Network connection is slow\n\n` +
                  `Suggestion: Try again later or use a different URL.`;
        break;

      case 429:
        message = `⏱️ Rate Limit: Too many requests.\n\n` +
                  `${error.message}\n\n` +
                  `Limit: 500 RPM for API key holders`;
        break;

      case 500:
      case 502:
      case 503:
        message = `🚨 Server Error: Jina service temporarily unavailable.\n\n` +
                  `Status: ${error.status}\n` +
                  `${error.message}`;
        break;

      case 0:
        // Network error (status 0)
        if (error.code === 'NETWORK_ERROR') {
          message = `🌐 Network Error: Unable to reach the server.\n\n` +
                    `${error.message}\n\n` +
                    `Check your internet connection or try again later.`;
        } else {
          message = `❌ API Error:\n` +
                    `Code: ${error.code}\n` +
                    `${error.message}`;
        }
        break;

      default:
        message = `❌ API Error:\n` +
                  `Status: ${error.status}\n` +
                  `Code: ${error.code}\n` +
                  `${error.message}`;
    }

    return {
      content: [{ type: 'text', text: message }],
      isError: true,
    };
  }

  // Generic error
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: 'text', text: `❌ Error: ${errorMessage}` }],
    isError: true,
  };
}

/**
 * Format error for logging
 */
export function logError(error: unknown): string {
  if (error instanceof JinaApiError) {
    return `[${error.code} ${error.status}] ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
