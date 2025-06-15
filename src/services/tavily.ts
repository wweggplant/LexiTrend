// src/services/tavily.ts

// The Tavily service now acts as a client to the extension's service worker.
// It is responsible for sending requests to the background script and handling responses.

import { ErrorFactory } from '../types/errors';

// Define the structure of a search request message. Exported for use in the background script.
export interface TavilySearchRequest {
  type: 'TAVILY_SEARCH';
  payload: {
    query: string;
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
  };
}

class TavilyApiService {
  /**
   * Performs a search by sending a message to the background service worker.
   * @param query The search query.
   * @returns The search results from Tavily.
   */
  async search(
    query: string,
    searchDepth: 'basic' | 'advanced' = 'advanced',
    maxResults: number = 7,
    includeDomains: string[] = [],
    excludeDomains: string[] = []
  ) {
    if (!query) {
      throw await ErrorFactory.createValidationError('Tavily search query cannot be empty.');
    }

    const request: TavilySearchRequest = {
      type: 'TAVILY_SEARCH',
      payload: {
        query,
        searchDepth,
        maxResults,
        includeDomains,
        excludeDomains,
      },
    };

    try {
      // Ensure chrome.runtime is available
      if (!chrome.runtime?.id) {
        throw new Error("Chrome runtime is not available. This service can only be run in a Chrome extension environment.");
      }
      
      const response = await chrome.runtime.sendMessage(request);
      
      if (response?.error) {
        // Re-construct the error to maintain its type if possible
        const apiError = await ErrorFactory.createApiError(
          response.error.message || 'An unknown error occurred during the Tavily search.',
          { name: response.error.name, cause: response.error.cause }
        );
        throw apiError;
      }
      
      return response?.data;
    } catch (error) {
       // Check if it's an ApiError created by our factory to avoid re-wrapping
      if (error instanceof Error && error.constructor.name === 'ApiError') {
        throw error;
      }
      // Wrap other errors (e.g., messaging errors)
      throw await ErrorFactory.createApiError(`Tavily search failed: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
      });
    }
  }
}

// Export a singleton instance of the service
export const tavilyService = new TavilyApiService();