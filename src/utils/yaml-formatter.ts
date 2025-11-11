import * as YAML from 'yaml';

/**
 * Format data as YAML for better readability
 */
export function formatYaml(data: any): string {
  try {
    return YAML.stringify(data, null, {
      indent: 2,
    });
  } catch (error) {
    // Fallback to JSON if YAML fails
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Format a single search result as YAML
 */
export function formatSearchResults(
  results: any[],
  query: string,
  timeMs: number
): string {
  const formatted = {
    query,
    result_count: results.length,
    time_taken_ms: timeMs,
    results: results.slice(0, 10).map((r, i) => ({
      rank: i + 1,
      title: r.title,
      url: r.url,
      description: r.description || '(no description)',
      publish_date: r.publish_date || '(no date)',
    })),
  };

  return formatYaml(formatted);
}

/**
 * Format arxiv results
 */
export function formatArxivResults(results: any[], timeMs: number): string {
  const formatted = {
    result_count: results.length,
    time_taken_ms: timeMs,
    papers: results.slice(0, 10).map((r, i) => ({
      rank: i + 1,
      title: r.title,
      url: r.url,
      authors: r.authors || [],
      published_date: r.published_date || '(no date)',
      abstract: r.abstract ? r.abstract.substring(0, 200) + '...' : '(no abstract)',
    })),
  };

  return formatYaml(formatted);
}

/**
 * Format image search results
 */
export function formatImageResults(results: any[], timeMs: number): string {
  const formatted = {
    result_count: results.length,
    time_taken_ms: timeMs,
    images: results.slice(0, 20).map((r, i) => ({
      rank: i + 1,
      url: r.url,
      title: r.title || '(no title)',
    })),
  };

  return formatYaml(formatted);
}

/**
 * Format parallel read results
 */
export function formatParallelReadResults(
  results: any[],
  timeMs: number
): string {
  const formatted = {
    total_urls: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    time_taken_ms: timeMs,
    results: results.map((r, i) => ({
      rank: i + 1,
      url: r.url,
      status: r.success ? 'success' : 'failed',
      character_count: r.success ? r.content?.length : 0,
      error: !r.success ? r.error : undefined,
    })),
  };

  return formatYaml(formatted);
}
