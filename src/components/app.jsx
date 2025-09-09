// src/components/App.jsx
import React, { useState, useMemo } from 'react';
import { useDirectoryData } from '../hooks/useDirectoryData';

function App() {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [personFilter, setPersonFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Get data from custom hook
  const {
    files,
    loading,
    error,
    lastFetch,
    refreshData,
    filterFiles,
    sortFiles,
    getFilterOptions
  } = useDirectoryData();

  // Get filter options
  const { persons, types } = getFilterOptions();

  // Filter and sort files
  const displayFiles = useMemo(() => {
    const filtered = filterFiles(searchTerm, personFilter, typeFilter);
    return sortFiles(filtered, sortBy, sortOrder);
  }, [files, searchTerm, personFilter, typeFilter, sortBy, sortOrder, filterFiles, sortFiles]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setPersonFilter('all');
    setTypeFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  // Get file type icon
  const getFileIcon = (type) => {
    const icons = {
      document: '📄',
      video: '🎥',
      archive: '📦',
      webpage: '🌐',
      folder: '📁'
    };
    return icons[type] || '📄';
  };

  // Format file size for display
  const formatFileSize = (size) => {
    if (size === 'Directory' || size === 'Unknown') return size;
    return size;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (dateString === 'Unknown') return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="jackson-archive-app">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header className="app-header">
        <h1>UNT Legal Files Archive</h1>
        <p>Browse and search legal documents and files from the University of North Texas case</p>
        {loading && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Loading files from server...
          </div>
        )}
      </header>

      {/* Main content */}
      <main id="main-content" className="app-main">
        {/* Controls section - only show when not loading */}
        {!loading && (
          <section className="controls-section">
            {/* Search bar */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search files by name, person, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search files"
                />
                {searchTerm && (
                  <button
                    className="search-clear-btn"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="search-stats">
                Showing {displayFiles.length} of {files.length} files
              </div>
            </div>

            {/* Filter controls */}
            <div className="filter-controls">
              <div className="filter-row">
                {/* Person filter */}
                <div className="filter-group">
                  <label htmlFor="person-filter" className="filter-label">
                    Filter by Person:
                  </label>
                  <select
                    id="person-filter"
                    className="filter-select"
                    value={personFilter}
                    onChange={(e) => setPersonFilter(e.target.value)}
                  >
                    <option value="all">All People ({persons.length + (files.some(f => f.person === 'Unknown') ? 1 : 0)} total)</option>
                    {persons.map(person => (
                      <option key={person} value={person}>
                        {person} ({files.filter(f => f.person === person).length})
                      </option>
                    ))}
                    {files.some(f => f.person === 'Unknown') && (
                      <option value="Unknown">
                        Unknown ({files.filter(f => f.person === 'Unknown').length})
                      </option>
                    )}
                  </select>
                </div>

                {/* Type filter */}
                <div className="filter-group">
                  <label htmlFor="type-filter" className="filter-label">
                    Filter by Type:
                  </label>
                  <select
                    id="type-filter"
                    className="filter-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types ({types.length} total)</option>
                    {types.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} ({files.filter(f => f.type === type).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort options */}
                <div className="filter-group">
                  <label htmlFor="sort-by" className="filter-label">
                    Sort by:
                  </label>
                  <select
                    id="sort-by"
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Name</option>
                    <option value="person">Person</option>
                    <option value="type">Type</option>
                    <option value="date">Date</option>
                    <option value="size">Size</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="sort-order" className="filter-label">
                    Order:
                  </label>
                  <select
                    id="sort-order"
                    className="filter-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>

                {/* Reset button */}
                <button
                  className="reset-filters-btn"
                  onClick={resetFilters}
                  title="Reset all filters and search"
                >
                  Reset All
                </button>
              </div>

              {/* Active filters summary */}
              {(searchTerm || personFilter !== 'all' || typeFilter !== 'all') && (
                <div className="filter-summary">
                  Active filters: 
                  {searchTerm && ` Search: "${searchTerm}"`}
                  {personFilter !== 'all' && ` • Person: ${personFilter}`}
                  {typeFilter !== 'all' && ` • Type: ${typeFilter}`}
                </div>
              )}
            </div>
          </section>
        )}

        {/* File list section */}
        <section className="file-list">
          {/* Loading state */}
          {loading && (
            <div className="file-list-loading">
              <div className="loading-spinner" aria-hidden="true"></div>
              <p>Connecting to file server...</p>
              <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
                This may take a few moments while we fetch the directory listing
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="file-list-error">
              <h3>Unable to Load Files</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={refreshData}>
                Try Again
              </button>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
                If this problem persists, the file server may be temporarily unavailable.
              </p>
            </div>
          )}

          {/* Success state with file count */}
          {!loading && !error && files.length > 0 && (
            <div className="file-count">
              <strong>{displayFiles.length}</strong> {displayFiles.length === 1 ? 'file' : 'files'} found
              {displayFiles.length !== files.length && (
                <span> (filtered from {files.length} total)</span>
              )}
              {lastFetch && (
                <span> • Last updated: {lastFetch.toLocaleString()}</span>
              )}
            </div>
          )}

          {/* Empty search results */}
          {!loading && !error && displayFiles.length === 0 && files.length > 0 && (
            <div className="file-list-empty">
              <p>No files match your current search and filter criteria.</p>
              <button className="retry-btn" onClick={resetFilters}>
                Clear All Filters
              </button>
            </div>
          )}

          {/* No files found at all */}
          {!loading && !error && files.length === 0 && (
            <div className="file-list-empty">
              <p>No files were found in the directory.</p>
              <button className="reload-btn" onClick={refreshData}>
                Reload Directory
              </button>
            </div>
          )}

          {/* File items */}
          {!loading && displayFiles.length > 0 && (
            <div className="file-items">
              {displayFiles.map(file => (
                <div key={file.id} className="file-item">
                  <div className="file-main">
                    <div className="file-icon" aria-hidden="true">
                      {getFileIcon(file.type)}
                    </div>
                    
                    <div className="file-details">
                      <div className="file-title">
                        <a
                          href={file.url}
                          className="file-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Open ${file.displayName} in new tab - ${file.filename}`}
                        >
                          {file.displayName}
                        </a>
                      </div>
                      
                      <div className="file-meta">
                        <span className="file-person">{file.person}</span>
                        <span className="file-separator">•</span>
                        <span>{file.type.charAt(0).toUpperCase() + file.type.slice(1)}</span>
                        <span className="file-separator">•</span>
                        <span>{formatFileSize(file.size)}</span>
                        <span className="file-separator">•</span>
                        <span>{formatDate(file.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          UNT Legal Files Archive
          {!loading && files.length > 0 && (
            <>
              • {files.length} files indexed
              • <button 
                className="retry-btn" 
                onClick={refreshData}
                style={{ marginLeft: '5px', padding: '5px 10px', fontSize: '12px' }}
                title="Refresh the file list from server"
              >
                Refresh
              </button>
            </>
          )}
        </p>
        {lastFetch && !loading && (
          <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
            Data fetched from: rasmusen.org/special/jackson/
          </p>
        )}
      </footer>
    </div>
  );
}

export default App;