import { JinaApiClient, JinaApiError } from '../utils/api-client.js';

const SEARCH_BASE_URL = 'https://s.jina.ai/search';

export interface SearchResult {
  title: string;
  url: string;
  description?: string;
  content?: string;
  publish_date?: string;
}

export interface SearchOptions {
  count?: number;
  location?: string; // Country code (gl parameter), e.g., 'US', 'PL'
  language?: string; // Language code (hl parameter), e.g., 'en', 'pl'
  site?: string; // Filter by domain (e.g., 'github.com')
  page?: number; // Page number for pagination (default: 1)
  filetype?: string; // File type filter (e.g., 'pdf', 'doc', 'xlsx')
  intitle?: string; // Search in titles only
  timeout?: number; // Request timeout in milliseconds
  provider?: string; // Search provider ('google', 'bing', etc.)
}

export interface JinaApiResponse<T> {
  code: number;
  status: number;
  data: T;
  meta?: Record<string, any>;
}

/**
 * Perform a web search using Jina Search API
 */
export async function searchWeb(
  query: string,
  apiKey?: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const client = new JinaApiClient(apiKey);

  try {
    // Build query with optional filters
    let queryParam = query;
    if (options?.site) {
      queryParam = `site:${options.site} ${queryParam}`;
    }
    if (options?.intitle) {
      queryParam = `intitle:${options.intitle} ${queryParam}`;
    }

    let url = `${SEARCH_BASE_URL}?q=${encodeURIComponent(queryParam)}&type=web`;

    // Add optional parameters
    if (options?.count) url += `&count=${options.count}`;
    if (options?.location) url += `&gl=${options.location}`;
    if (options?.language) url += `&hl=${options.language}`;
    if (options?.page) url += `&page=${options.page}`;
    if (options?.filetype) url += `&filetype=${options.filetype}`;
    if (options?.provider) url += `&provider=${options.provider}`;

    console.log(`🔍 Web search: "${query}"`);
    console.log(`📍 URL: ${url}`);
    const response = await client.fetch<JinaApiResponse<SearchResult[]>>(url, {
      timeout: options?.timeout || 60000
    });

    // Validate API response
    if (!response.data) {
      throw new Error('API returned empty response');
    }
    if (!Array.isArray(response.data)) {
      throw new Error(`API returned invalid data type. Expected array, got ${typeof response.data}`);
    }

    console.log(`✅ Found ${response.data.length} results`);
    return response.data;
  } catch (error) {
    if (error instanceof JinaApiError) {
      throw error;
    }
    throw new Error(`Failed to search web: ${error}`);
  }
}

export interface ArxivResult extends SearchResult {
  authors?: string[];
  abstract?: string;
  published_date?: string;
}

/**
 * Search academic papers on ArXiv
 * Note: Using web search with arxiv.org site filter
 */
export async function searchArxiv(
  query: string,
  apiKey?: string,
  maxResults?: number,
  options?: Omit<SearchOptions, 'site' | 'count'>
): Promise<ArxivResult[]> {
  const client = new JinaApiClient(apiKey);

  try {
    // Use web search with arxiv.org domain filter
    let url = `${SEARCH_BASE_URL}?q=site:arxiv.org ${encodeURIComponent(query)}&type=web`;

    if (maxResults) url += `&count=${maxResults}`;
    if (options?.location) url += `&gl=${options.location}`;
    if (options?.language) url += `&hl=${options.language}`;
    if (options?.page) url += `&page=${options.page}`;
    if (options?.provider) url += `&provider=${options.provider}`;

    console.log(`📚 ArXiv search: "${query}"`);
    const response = await client.fetch<JinaApiResponse<ArxivResult[]>>(url, {
      timeout: options?.timeout || 60000
    });

    // Validate API response
    if (!response.data) {
      throw new Error('API returned empty response');
    }
    if (!Array.isArray(response.data)) {
      throw new Error(`API returned invalid data type. Expected array, got ${typeof response.data}`);
    }

    console.log(`✅ Found ${response.data.length} papers`);
    return response.data;
  } catch (error) {
    if (error instanceof JinaApiError) {
      throw error;
    }
    throw new Error(`Failed to search ArXiv: ${error}`);
  }
}

export interface ImageSearchResult extends SearchResult {
  // Inherits: title, url, description, content
}

/**
 * Search for images
 */
export async function searchImages(
  query: string,
  apiKey?: string,
  count?: number,
  options?: Omit<SearchOptions, 'count'>
): Promise<ImageSearchResult[]> {
  const client = new JinaApiClient(apiKey);

  try {
    let url = `${SEARCH_BASE_URL}?q=${encodeURIComponent(query)}&type=images`;

    if (count) url += `&count=${count}`;
    if (options?.location) url += `&gl=${options.location}`;
    if (options?.language) url += `&hl=${options.language}`;
    if (options?.page) url += `&page=${options.page}`;
    if (options?.provider) url += `&provider=${options.provider}`;

    console.log(`🖼️  Image search: "${query}"`);
    const response = await client.fetch<JinaApiResponse<ImageSearchResult[]>>(url, {
      timeout: options?.timeout || 60000
    });

    // Validate API response
    if (!response.data) {
      throw new Error('API returned empty response');
    }
    if (!Array.isArray(response.data)) {
      throw new Error(`API returned invalid data type. Expected array, got ${typeof response.data}`);
    }

    console.log(`✅ Found ${response.data.length} images`);
    return response.data;
  } catch (error) {
    if (error instanceof JinaApiError) {
      throw error;
    }
    throw new Error(`Failed to search images: ${error}`);
  }
}

/**
 * @deprecated expand_query endpoint is no longer available in Jina Search API.
 * Use searchWeb with query operators instead (e.g., site:, intitle:, filetype:)
 *
 * This function is kept for backwards compatibility but will always throw an error.
 */
export async function expandQuery(
  query: string,
  apiKey?: string
): Promise<string[]> {
  throw new Error('expand_query endpoint is no longer available in Jina Search API. Please use searchWeb with query operators instead.');
}

export interface ParallelSearchResult {
  query: string;
  results: SearchResult[];
  success: boolean;
  error?: string;
}

/**
 * Perform multiple web searches in parallel with a maximum concurrency limit
 */
export async function parallelSearchWeb(
  queries: string[],
  apiKey?: string,
  maxParallel: number = 5,
  options?: SearchOptions
): Promise<ParallelSearchResult[]> {
  console.log(`\n🔄 Performing ${queries.length} searches in parallel (max ${maxParallel} concurrent)`);

  const results: ParallelSearchResult[] = [];
  const queue = [...queries];
  const inProgress = new Set<Promise<ParallelSearchResult>>();

  while (queue.length > 0 || inProgress.size > 0) {
    // Add new tasks while under the limit
    while (inProgress.size < maxParallel && queue.length > 0) {
      const query = queue.shift()!;
      const promise = (async () => {
        try {
          const results = await searchWeb(query, apiKey, options);
          return { query, results, success: true };
        } catch (error) {
          return {
            query,
            results: [],
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

  console.log(`✅ Completed ${results.length} searches`);
  return results;
}
