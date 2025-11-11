/**
 * Jina.AI API Type Definitions
 */

export interface SearchResult {
  title: string;
  url: string;
  description?: string;
  publish_date?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  result_count: number;
}

export interface ArxivResult {
  title: string;
  url: string;
  authors?: string[];
  abstract?: string;
  published_date?: string;
}

export interface ArxivResponse {
  results: ArxivResult[];
  query: string;
  result_count: number;
}

export interface ImageSearchResult {
  url: string;
  title?: string;
}

export interface ImageSearchResponse {
  results: ImageSearchResult[];
  query: string;
  result_count: number;
}

export interface ExpandQueryResponse {
  expanded_queries: string[];
  original_query: string;
}

export interface PublicationDate {
  date: string;
  accuracy: string;
}

export interface PrimerInfo {
  timestamp: string;
  timezone: string;
  server_time: string;
  version: string;
}
