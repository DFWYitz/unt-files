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

  // Configuration
  const BASE_URL = 'https://www.rasmusen.org/special/jackson/';
  // Using a CORS proxy to bypass CORS restrictions
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Fetches the directory listing from the server
   * Uses CORS proxy to bypass cross-origin restrictions
   */
  const fetchDirectory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construct URL with CORS proxy
      const proxiedUrl = CORS_PROXY + encodeURIComponent(BASE_URL);
      
      console.log('Fetching directory from:', proxiedUrl);

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
        throw new Error('Received empty response from server');
      }

      console.log('Raw HTML length:', htmlContent.length);
      console.log('First 200 chars:', htmlContent.substring(0, 200));

      // Parse the HTML directory listing
      const parsedFiles = parseDirectoryListing(htmlContent, BASE_URL);
      
      console.log('Parsed files:', parsedFiles.length);
      console.log('Sample files:', parsedFiles.slice(0, 3));

      if (parsedFiles.length === 0) {
        console.warn('No files found in directory listing');
      }

      setFiles(parsedFiles);
      setLastFetch(new Date());
      
    } catch (err) {
      console.error('Error fetching directory:', err);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to load files';
      
      if (err.name === 'TimeoutError') {
        userMessage = 'Request timed out. The server may be slow or unavailable.';
      } else if (err.message.includes('Failed to fetch')) {
        userMessage = 'Network error. Please check your internet connection.';
      } else if (err.message.includes('HTTP')) {
        userMessage = `Server error: ${err.message}`;
      } else {
        userMessage = err.message;
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
   * @param {string} searchTerm - Text to search for
   * @param {string} personFilter - Person name to filter by
   * @param {string} typeFilter - File type to filter by
   * @returns {Array} Filtered file array
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
    const persons = [...new Set(files.map(f => f.person))].filter(p => p !== 'Unknown').sort();
    const types = [...new Set(files.map(f => f.type))].sort();
    
    return { persons, types };
  };

  /**
   * Sorts files by specified criteria
   * @param {Array} filesToSort - Files to sort
   * @param {string} sortBy - Sort criteria ('name', 'date', 'size', 'person', 'type')
   * @param {string} sortOrder - Sort direction ('asc', 'desc')
   * @returns {Array} Sorted file array
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