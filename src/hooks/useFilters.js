// src/hooks/useFilters.js
// Hook for managing filtering and sorting

import { useState, useMemo } from 'react';

/**
 * Custom hook that provides filtering and sorting functionality
 * @param {Array} files - Array of file objects to filter and sort
 * @returns {Object} Filter controls and processed files
 */
export function useFilters(files) {
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'size', 'person'
  const [filterByPerson, setFilterByPerson] = useState('all');
  const [filterByType, setFilterByType] = useState('all');
  
  // Get unique persons for filter dropdown
  const availablePersons = useMemo(() => {
    const persons = [...new Set(files.map(file => file.person))];
    return persons.filter(person => person !== 'Unknown').sort();
  }, [files]);
  
  // Get unique file types for filter dropdown
  const availableTypes = useMemo(() => {
    const types = [...new Set(files.map(file => file.type))];
    return types.sort();
  }, [files]);
  
  // Apply filters and sorting
  const processedFiles = useMemo(() => {
    let filtered = [...files];
    
    // Apply person filter
    if (filterByPerson !== 'all') {
      filtered = filtered.filter(file => file.person === filterByPerson);
    }
    
    // Apply type filter  
    if (filterByType !== 'all') {
      filtered = filtered.filter(file => file.type === filterByType);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
          
        case 'date':
          // Sort by date, handling 'Unknown' dates
          if (a.date === 'Unknown' && b.date === 'Unknown') return 0;
          if (a.date === 'Unknown') return 1;
          if (b.date === 'Unknown') return -1;
          return new Date(b.date) - new Date(a.date); // Newest first
          
        case 'size':
          // Sort by size in bytes
          return b.sizeBytes - a.sizeBytes; // Largest first
          
        case 'person':
          return a.person.localeCompare(b.person);
          
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [files, sortBy, filterByPerson, filterByType]);
  
  // Calculate filter statistics
  const filterStats = useMemo(() => {
    const stats = {
      total: files.length,
      filtered: processedFiles.length,
      personCounts: {},
      typeCounts: {}
    };
    
    // Count documents by person
    availablePersons.forEach(person => {
      stats.personCounts[person] = files.filter(file => file.person === person).length;
    });
    
    // Count documents by type
    availableTypes.forEach(type => {
      stats.typeCounts[type] = files.filter(file => file.type === type).length;
    });
    
    return stats;
  }, [files, processedFiles, availablePersons, availableTypes]);
  
  // Reset all filters
  const resetFilters = () => {
    setSortBy('name');
    setFilterByPerson('all');
    setFilterByType('all');
  };
  
  return {
    // Current filter values
    sortBy,
    filterByPerson, 
    filterByType,
    
    // Filter setters
    setSortBy,
    setFilterByPerson,
    setFilterByType,
    resetFilters,
    
    // Available options
    availablePersons,
    availableTypes,
    
    // Processed data
    filteredFiles: processedFiles,
    filterStats,
    
    // Status
    hasActiveFilters: filterByPerson !== 'all' || filterByType !== 'all' || sortBy !== 'name'
  };
}
