// src/hooks/useSearch.js
// Hook for managing search functionality

import { useState, useMemo } from 'react';

/**
 * Custom hook that provides search functionality for file data
 * @param {Array} files - Array of file objects to search
 * @returns {Object} { searchTerm, setSearchTerm, filteredFiles, searchStats }
 */
export function useSearch(files) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Memoized search results - only recalculate when files or searchTerm change
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        filteredFiles: files,
        matchCount: files.length,
        hasActiveSearch: false
      };
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    // Search across multiple fields
    const matches = files.filter(file => {
      // Search in display name
      if (file.displayName.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search in filename
      if (file.filename.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search in person name
      if (file.person.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search in keywords array
      if (file.keywords.some(keyword => keyword.includes(term))) {
        return true;
      }
      
      // Search in file type
      if (file.type.toLowerCase().includes(term)) {
        return true;
      }
      
      return false;
    });
    
    return {
      filteredFiles: matches,
      matchCount: matches.length,
      hasActiveSearch: true
    };
  }, [files, searchTerm]);
  
  return {
    searchTerm,
    setSearchTerm,
    filteredFiles: searchResults.filteredFiles,
    matchCount: searchResults.matchCount,
    hasActiveSearch: searchResults.hasActiveSearch,
    totalFiles: files.length
  };
}
