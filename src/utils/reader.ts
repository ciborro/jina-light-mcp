import { JinaApiClient, JinaApiError } from '../utils/api-client.js';

const READER_BASE_URL = 'https://r.jina.ai';

export interface ReadUrlOptions {
  screenshot?: 'true' | 'first_screen' | false;
  timeout?: number;
  locale?: string; // Browser locale (e.g., 'en-US', 'pl-PL')
  instruction?: string; // Custom instruction for extraction
  targetSelector?: string; // CSS selector for specific element
  removeSelector?: string; // CSS selectors to remove (comma-separated)
  waitForSelector?: string; // CSS selector to wait for before extraction
  retainImages?: 'all' | 'none' | 'markdown'; // How to handle images (default: 'markdown')
  retainLinks?: 'all' | 'none' | 'markdown'; // How to handle links (default: 'markdown')
  withImagesSummary?: boolean; // Include images summary
  withLinksSummary?: boolean; // Include links summary
  proxy?: string; // Proxy server URL
  userAgent?: string; // Custom User-Agent string
  jsonSchema?: string; // JSON schema for structured output
}

export interface PublicationDate {
  date: string;
  accuracy: string;
}

export interface ReaderData {
  title?: string;
  content: string;
  url?: string;
  description?: string;
  publishedTime?: string;
  metadata?: Record<string, any>;
  external?: Record<string, any>;
  warning?: string;
  usage?: Record<string, any>;
}

export interface JinaApiResponse<T> {
  code: number;
  status: number;
  data: T;
  meta?: Record<string, any>;
}

export async function readUrl(
  url: string,
  apiKey?: string,
  options?: ReadUrlOptions
): Promise<string> {
  const client = new JinaApiClient(apiKey);

  try {
    let endpoint = `${READER_BASE_URL}/${encodeURIComponent(url)}`;

    // Build query parameters
    const params: string[] = [];

    // Add screenshot parameter if requested
    if (options?.screenshot) {
      const screenshotValue = typeof options.screenshot === 'string' ? options.screenshot : 'true';
      params.push(`screenshot=${screenshotValue}`);
    }

    if (options?.locale) params.push(`locale=${encodeURIComponent(options.locale)}`);
    if (options?.instruction) params.push(`instruction=${encodeURIComponent(options.instruction)}`);
    if (options?.targetSelector) params.push(`targetSelector=${encodeURIComponent(options.targetSelector)}`);
    if (options?.removeSelector) params.push(`removeSelector=${encodeURIComponent(options.removeSelector)}`);
    if (options?.waitForSelector) params.push(`waitForSelector=${encodeURIComponent(options.waitForSelector)}`);
    if (options?.retainImages) params.push(`retainImages=${options.retainImages}`);
    if (options?.retainLinks) params.push(`retainLinks=${options.retainLinks}`);
    if (options?.withImagesSummary) params.push(`withImagesSummary=${options.withImagesSummary}`);
    if (options?.withLinksSummary) params.push(`withLinksSummary=${options.withLinksSummary}`);
    if (options?.proxy) params.push(`proxy=${encodeURIComponent(options.proxy)}`);
    if (options?.userAgent) params.push(`userAgent=${encodeURIComponent(options.userAgent)}`);
    if (options?.jsonSchema) params.push(`jsonSchema=${encodeURIComponent(options.jsonSchema)}`);

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }

    console.log(`📖 Reading URL: ${url}`);
    const response = await client.fetch<JinaApiResponse<ReaderData>>(endpoint, { timeout: options?.timeout });

    const content = response.data.content;
    console.log(`✅ Successfully read URL (${content.length} characters)`);
    return content;
  } catch (error) {
    if (error instanceof JinaApiError) {
      throw error;
    }
    throw new Error(`Failed to read URL: ${error}`);
  }
}

export async function captureScreenshot(
  url: string,
  apiKey?: string,
  fullPage: boolean = false
): Promise<Buffer> {
  const client = new JinaApiClient(apiKey);

  try {
    const screenshotType = fullPage ? 'true' : 'first_screen';
    const endpoint = `${READER_BASE_URL}/${encodeURIComponent(url)}?screenshot=${screenshotType}`;

    console.log(`📸 Capturing screenshot: ${url} (${fullPage ? 'full page' : 'first screen'})`);
    const imageData = await client.fetch<ArrayBuffer>(endpoint, { timeout: 60000 });

    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(imageData as ArrayBuffer);
    console.log(`✅ Successfully captured screenshot (${buffer.length} bytes)`);

    return buffer;
  } catch (error) {
    if (error instanceof JinaApiError) {
      throw error;
    }
    throw new Error(`Failed to capture screenshot: ${error}`);
  }
}

/**
 * Extract publication date from the markdown content returned by Reader API
 * The API includes metadata in the format:
 * Title: ...
 * URL: ...
 * Publish date: YYYY-MM-DD
 */
export async function guessDatetime(
  url: string,
  apiKey?: string
): Promise<PublicationDate> {
  const client = new JinaApiClient(apiKey);

  try {
    const endpoint = `${READER_BASE_URL}/${encodeURIComponent(url)}`;

    console.log(`📅 Detecting publication date: ${url}`);
    const response = await client.fetch<JinaApiResponse<ReaderData>>(endpoint, { timeout: 60000 });

    // First, try to use publishedTime from API response
    if (response.data.publishedTime) {
      console.log(`✅ Found publication date from API: ${response.data.publishedTime}`);
      return {
        date: response.data.publishedTime,
        accuracy: 'high',
      };
    }

    // Fallback: try to extract from content
    const dateMatch = response.data.content.match(/Publish date:\s*(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const date = dateMatch[1];
      console.log(`✅ Found publication date in content: ${date}`);
      return {
        date,
        accuracy: 'medium',
      };
    }

    console.log(`⚠️  No publication date found`);
    return {
      date: new Date().toISOString().split('T')[0],
      accuracy: 'unknown',
    };
  } catch (error) {
    if (error instanceof JinaApiError) {
      throw error;
    }
    throw new Error(`Failed to guess datetime: ${error}`);
  }
}

export interface ParallelReadResult {
  url: string;
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Read multiple URLs in parallel with a maximum concurrency limit
 */
export async function parallelReadUrl(
  urls: string[],
  apiKey?: string,
  maxParallel: number = 5,
  options?: ReadUrlOptions
): Promise<ParallelReadResult[]> {
  console.log(`\n🔄 Reading ${urls.length} URLs in parallel (max ${maxParallel} concurrent)`);

  const results: ParallelReadResult[] = [];
  const queue = [...urls];
  const inProgress = new Set<Promise<ParallelReadResult>>();

  while (queue.length > 0 || inProgress.size > 0) {
    // Add new tasks while under the limit
    while (inProgress.size < maxParallel && queue.length > 0) {
      const url = queue.shift()!;
      const promise = (async () => {
        try {
          const content = await readUrl(url, apiKey, options);
          return { url, content, success: true };
        } catch (error) {
          return {
            url,
            content: '',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })();

      inProgress.add(promise);

      // Remove from set when done
      promise.finally(() => inProgress.delete(promise));
    }

    // Wait for at least one to complete
    if (inProgress.size > 0) {
      const result = await Promise.race(inProgress);
      results.push(result);
    }
  }

  console.log(`✅ Completed reading ${results.length} URLs`);
  return results;
}
