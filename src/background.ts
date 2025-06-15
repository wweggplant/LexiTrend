// LexiTrend Background Service Worker
console.log('LexiTrend Background Service Worker loaded');

import { StorageService } from './services/storage';
// No longer need to import the SDK
// import { tavily } from '@tavily/core'; 

// Manually define the request type here as a workaround for broken imports
interface TavilySearchRequest {
  type: 'TAVILY_SEARCH';
  payload: {
    query: string;
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
  };
}

// Initialize services on startup
const storageService = StorageService.getInstance();

// Handle installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('First time installation detected. Setting default values.');
    // Set default settings on installation
    storageService.updateSettings({
      language: 'en',
      cacheEnabled: true,
      maxCacheSize: 1000,
      cacheTTL: 3600
    });
  }
});

// Central message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // --- Synchronous Handling for User-Gesture-Required APIs ---
  if (request.type === 'ANALYZE_KEYWORD' && sender.tab?.id) {
    // This API must be called immediately in the user gesture context.
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  // --- Asynchronous Handling for all other logic ---
  const handleMessage = async () => {
    console.log('Message received in background:', request);
    switch (request.type) {
      case 'OPEN_SIDE_PANEL': {
        // This case is now effectively handled by the synchronous block above,
        // but we can keep it for other potential uses.
        if (sender.tab?.id) {
          await chrome.sidePanel.open({ tabId: sender.tab.id });
          return { success: true };
        }
        return { success: false, error: 'No active tab found.' };
      }

      case 'VALIDATE_TAVILY_KEY': {
        const { apiKey } = request.payload;
        if (!apiKey) {
          return { isValid: false, error: 'API key is missing.' };
        }
        try {
          // Use a low-cost query to validate the key.
          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: 'test',
              search_depth: 'basic',
              max_results: 1,
            }),
          });

          if (response.status === 401) {
             return { isValid: false, error: 'The provided Tavily API key is invalid or has expired.' };
          }

          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Tavily API validation failed (${response.status}): ${errorBody.detail || response.statusText}`);
          }

          return { isValid: true };

        } catch (error) {
          console.error('Tavily key validation error in background:', error);
          const message = error instanceof Error ? error.message : 'An unknown error occurred during validation.';
          return { isValid: false, error: message };
        }
      }

      case 'TAVILY_SEARCH': {
        const { payload } = request as TavilySearchRequest;
        try {
          const apiKey = await storageService.getTavilyApiKey();
          if (!apiKey) {
            throw new Error('Tavily API key not found. Please set it in the extension settings.');
          }

          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: payload.query,
              search_depth: payload.searchDepth,
              max_results: payload.maxResults,
              include_domains: payload.includeDomains,
              exclude_domains: payload.excludeDomains,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Tavily API error (${response.status}): ${errorBody.detail || response.statusText}`);
          }

          const data = await response.json();
          return { data };

        } catch (error) {
          console.error('Tavily search error in background:', error);
          const err = error instanceof Error ? { message: error.message, name: error.name } : { message: 'An unknown error occurred.' };
          return { error: err };
        }
      }

      case 'ANALYZE_KEYWORD': {
        // The panel is already being opened by the synchronous handler above.
        // Here, we just handle the data part.
        if (sender.tab?.id) {
          const { keyword } = request.payload;
          await chrome.storage.local.set({ 'analyzingKeyword': keyword });
          return { success: true };
        }
        return { success: false, error: 'No valid tab ID.' };
      }

      default: {
        console.warn('Unknown message type received:', request.type);
        const requestType = typeof request.type === 'string' ? request.type : JSON.stringify(request.type);
        return { success: false, error: `Unknown message type: ${requestType}` };
      }
    }
  };

  handleMessage().then(sendResponse);
  
  // Return true to indicate you wish to send a response asynchronously
  return true;
});

// Set the side panel to open on action click by default.
// This is a good default behavior for when the user clicks the extension icon.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set side panel behavior:', error)); 