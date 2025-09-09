// src/hooks/useUrlState.js
// Hook for managing URL state for bookmarking

import { useState, useEffect } from 'react';

/**
 * Custom hook that syncs component state with URL parameters for bookmarking
 * @returns {Object} URL state management functions
 */
export function useUrlState() {
  const [urlParams, setUrlParams] = useState({
    search: '',
    sort: 'name',
    person: 'all',
    type: 'all'
  });
  
  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlParams({
      search: params.get('search') || '',
      sort: params.get('sort') || 'name', 
      person: params.get('person') || 'all',
      type: params.get('type') || 'all'
    });
  }, []);
  
  // Function to update URL without causing page reload
  const updateUrl = (newParams) => {
    const url = new URL(window.location);
    const searchParams = new URLSearchParams();
    
    // Only add non-default parameters to keep URLs clean
    if (newParams.search) {
      searchParams.set('search', newParams.search);
    }
    if (newParams.sort && newParams.sort !== 'name') {
      searchParams.set('sort', newParams.sort);  
    }
    if (newParams.person && newParams.person !== 'all') {
      searchParams.set('person', newParams.person);
    }
    if (newParams.type && newParams.type !== 'all') {
      searchParams.set('type', newParams.type);
    }
    
    url.search = searchParams.toString();
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
    
    setUrlParams(newParams);
  };
  
  return {
    urlParams,
    updateUrl
  };
}