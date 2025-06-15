// Tavily Search API TypeScript定义

export interface TavilySearchOptions {
  search_depth?: 'basic' | 'advanced';
  max_results?: number;
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_images?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  images?: string[];
  results: TavilySearchResult[];
  response_time: string;
}

export interface TavilyExtractOptions {
  includeImages?: boolean;
  extractDepth?: 'basic' | 'advanced';
  format?: 'markdown' | 'text';
  timeout?: number;
}

export interface TavilyExtractResult {
  url: string;
  rawContent: string;
}

export interface TavilyExtractResponse {
  results: TavilyExtractResult[];
}

// 增强的洞察响应，包含搜索信息
export interface SearchMetadata {
  searchPerformed: boolean;
  searchQuery?: string;
  lastUpdated?: string;
  sources?: Array<{
    title: string;
    url: string;
    relevance: string;
  }>;
}

export interface EnhancedInsightResponse {
  definition: string;
  culturalContext: string;
  confidence: number;
  language: string;
  timestamp: number;
  searchMetadata: SearchMetadata;
} 