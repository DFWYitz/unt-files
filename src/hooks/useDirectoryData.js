// src/hooks/useDirectoryData.js
import { useState, useEffect } from 'react';
import { parseDirectoryListing } from '../utils/directoryParser.js';

/**
 * Custom hook for fetching and managing directory listing data
 * Handles loading states, error handling, and data transformation
 */
export function useDirectoryData() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Configuration - try multiple CORS proxies for reliability
  const BASE_URL = 'https://www.rasmusen.org/special/jackson/';
  const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/'
];
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Attempts to fetch using multiple CORS proxy services
   */
  const fetchWithFallback = async () => {
    let lastError = null;
    
    for (const proxy of CORS_PROXIES) {
      try {
        const proxiedUrl = proxy + encodeURIComponent(BASE_URL);
        console.log(`Trying proxy: ${proxy}`);
        
        const response = await fetch(proxiedUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const htmlContent = await response.text();
        
        if (!htmlContent || htmlContent.trim().length === 0) {
          throw new Error('Empty response from server');
        }

        console.log(`Success with proxy: ${proxy}`);
        return htmlContent;
        
      } catch (err) {
        console.warn(`Proxy ${proxy} failed:`, err.message);
        lastError = err;
        continue; // Try next proxy
      }
    }
    
    // If all proxies fail, throw the last error
    throw lastError || new Error('All CORS proxies failed');
  };

  /**
   * Fetches the directory listing from the server
   */
  const fetchDirectory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching directory listing...');

      const htmlContent = await fetchWithFallback();

      console.log('Raw HTML received, length:', htmlContent.length);
      console.log('First 200 chars:', htmlContent.substring(0, 200));

      // Parse the HTML directory listing
      const parsedFiles = parseDirectoryListing(htmlContent, BASE_URL);
      
      console.log('Parsed files count:', parsedFiles.length);
      console.log('Sample files:', parsedFiles.slice(0, 3));

      if (parsedFiles.length === 0) {
        console.warn('No files found in directory listing');
        setError('No files found in the directory listing. The page structure may have changed.');
        return;
      }

      setFiles(parsedFiles);
      setLastFetch(new Date());
      console.log('Directory data loaded successfully');
      
    } catch (err) {
      console.error('Error fetching directory:', err);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to load files from server';
      
      if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
        userMessage = 'Unable to access the file server. This may be due to network restrictions.';
      } else if (err.message.includes('HTTP')) {
        userMessage = `Server error: ${err.message}`;
      } else if (err.message.includes('Empty response')) {
        userMessage = 'The server returned an empty response. Please try again later.';
      } else {
        userMessage = `Connection error: ${err.message}`;
      }
      
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Checks if cached data is still valid
   */
  const isCacheValid = () => {
    if (!lastFetch) return false;
    const now = new Date();
    return (now.getTime() - lastFetch.getTime()) < CACHE_DURATION;
  };

  /**
   * Refreshes the directory data, bypassing cache
   */
  const refreshData = () => {
    console.log('Refreshing directory data...');
    setLastFetch(null); // Clear cache
    fetchDirectory();
  };

  // Effect to fetch data on mount and handle caching
  useEffect(() => {
    // Only fetch if we don't have valid cached data
    if (!isCacheValid() || files.length === 0) {
      fetchDirectory();
    }
  }, []); // Empty dependency array - only run on mount

  /**
   * Filters files based on search criteria
   */
  const filterFiles = (searchTerm = '', personFilter = 'all', typeFilter = 'all') => {
    return files.filter(file => {
      // Text search across multiple fields
      const searchMatch = !searchTerm || 
        file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));

      // Person filter
      const personMatch = personFilter === 'all' || file.person === personFilter;

      // Type filter
      const typeMatch = typeFilter === 'all' || file.type === typeFilter;

      return searchMatch && personMatch && typeMatch;
    });
  };

  /**
   * Gets unique values for filter options
   */
  const getFilterOptions = () => {
    const persons = [...new Set(files.map(f => f.person))]
      .filter(p => p !== 'Unknown')
      .sort();
    const types = [...new Set(files.map(f => f.type))]
      .sort();
    
    return { persons, types };
  };

  /**
   * Sorts files by specified criteria
   */
  const sortFiles = (filesToSort, sortBy = 'name', sortOrder = 'asc') => {
    const sorted = [...filesToSort].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date === 'Unknown' ? 0 : a.date);
          bVal = new Date(b.date === 'Unknown' ? 0 : b.date);
          break;
        case 'size':
          aVal = a.sizeBytes || 0;
          bVal = b.sizeBytes || 0;
          break;
        case 'person':
          aVal = a.person.toLowerCase();
          bVal = b.person.toLowerCase();
          break;
        case 'type':
          aVal = a.type.toLowerCase();
          bVal = b.type.toLowerCase();
          break;
        case 'name':
        default:
          aVal = a.displayName.toLowerCase();
          bVal = b.displayName.toLowerCase();
          break;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  return {
    files,
    loading,
    error,
    lastFetch,
    refreshData,
    filterFiles,
    sortFiles,
    getFilterOptions,
    isCacheValid
  };
}