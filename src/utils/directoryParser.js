// src/utils/directoryParser.js
// This module handles parsing the HTML directory listing into structured data

/**
 * Parses Apache directory listing HTML into structured file data
 * @param {string} htmlContent - Raw HTML from directory listing
 * @param {string} baseUrl - Base URL for the directory (e.g., 'https://www.rasmusen.org/special/jackson/')
 * @returns {Array} Array of file objects with standardized properties
 */
export function parseDirectoryListing(htmlContent, baseUrl) {
  // Create a DOM parser to work with the HTML
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Find all anchor tags that represent files (they contain href attributes)
  const fileLinks = doc.querySelectorAll('pre a[href]');
  const files = [];
  
  fileLinks.forEach(link => {
    const href = link.getAttribute('href');
    const filename = link.textContent.trim();
    
    // Skip navigation links (parent directory, sorting controls)
    if (isNavigationLink(href, filename)) {
      return;
    }
    
    // Extract file metadata from the directory listing
    const fileData = extractFileMetadata(link, filename, href, baseUrl);
    
    // Only add files that we successfully parsed
    if (fileData) {
      files.push(fileData);
    }
  });
  
  return files;
}

/**
 * Determines if a link is a navigation control rather than a file
 * @param {string} href - The href attribute value
 * @param {string} filename - The display text of the link
 * @returns {boolean} True if this is a navigation link to skip
 */
function isNavigationLink(href, filename) {
  // Skip parent directory links
  if (href.includes('..') || filename.includes('Parent Directory')) {
    return true;
  }
  
  // Skip Apache sorting controls (they have query parameters like ?C=N;O=D)
  if (href.includes('?C=')) {
    return true;
  }
  
  // Skip relative paths that don't represent files
  if (href.startsWith('?') || href.startsWith('#')) {
    return true;
  }
  
  return false;
}

/**
 * Extracts metadata for a single file from the directory listing
 * @param {Element} linkElement - The anchor element
 * @param {string} filename - Display name of the file
 * @param {string} href - The href attribute
 * @param {string} baseUrl - Base directory URL
 * @returns {Object|null} File data object or null if parsing fails
 */
function extractFileMetadata(linkElement, filename, href, baseUrl) {
  try {
    // Get the full text content of the parent element (usually contains date/size info)
    const parentText = linkElement.parentElement ? linkElement.parentElement.textContent : '';
    
    // Parse the directory listing line to extract date and size
    const metadata = parseListingLine(parentText, filename);
    
    // Build the complete URL
    const fullUrl = new URL(href, baseUrl).toString();
    
    // Determine file type from extension and characteristics
    const fileType = determineFileType(filename, href);
    
    // Extract person name from filename where possible
    const person = extractPersonFromFilename(filename);
    
    return {
      id: generateFileId(filename, href), // Unique identifier for React keys
      filename: filename,
      displayName: cleanDisplayName(filename), // Human-readable title
      url: fullUrl,
      type: fileType,
      person: person,
      date: metadata.date,
      size: metadata.size,
      sizeBytes: metadata.sizeBytes, // For sorting purposes
      keywords: generateKeywords(filename, fileType, person) // For search
    };
  } catch (error) {
    console.warn(`Failed to parse file metadata for ${filename}:`, error);
    return null;
  }
}

/**
 * Parses a single line from the directory listing to extract date and size
 * @param {string} lineText - Full text of the directory listing line
 * @param {string} filename - The filename to help locate metadata
 * @returns {Object} Object containing date, size, and sizeBytes
 */
function parseListingLine(lineText, filename) {
  // Directory listing format is typically: filename, date, size
  // We need to extract the parts after the filename
  
  // Find where the filename ends in the line
  const filenameIndex = lineText.indexOf(filename);
  if (filenameIndex === -1) {
    return { date: 'Unknown', size: 'Unknown', sizeBytes: 0 };
  }
  
  // Get the text after the filename
  const afterFilename = lineText.substring(filenameIndex + filename.length);
  
  // Extract date (format: YYYY-MM-DD HH:MM)
  const dateMatch = afterFilename.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
  const date = dateMatch ? dateMatch[1] : 'Unknown';
  
  // Extract size (format: number followed by unit like K, M, G, or just -)
  const sizeMatch = afterFilename.match(/\s+(\d+(?:\.\d+)?[KMG]?|\d+|-)\s*$/);
  let size = 'Unknown';
  let sizeBytes = 0;
  
  if (sizeMatch) {
    const sizeStr = sizeMatch[1];
    if (sizeStr === '-') {
      size = 'Directory';
      sizeBytes = 0;
    } else {
      size = sizeStr;
      sizeBytes = convertSizeToBytes(sizeStr);
    }
  }
  
  return { date, size, sizeBytes };
}

/**
 * Converts size strings like "1.2M" or "150K" to bytes for sorting
 * @param {string} sizeStr - Size string from directory listing
 * @returns {number} Size in bytes
 */
function convertSizeToBytes(sizeStr) {
  const numMatch = sizeStr.match(/^(\d+(?:\.\d+)?)/);
  if (!numMatch) return 0;
  
  const num = parseFloat(numMatch[1]);
  const unit = sizeStr.slice(-1).toUpperCase();
  
  switch (unit) {
    case 'K': return Math.floor(num * 1024);
    case 'M': return Math.floor(num * 1024 * 1024);
    case 'G': return Math.floor(num * 1024 * 1024 * 1024);
    default: return Math.floor(num); // Assume bytes if no unit
  }
}

/**
 * Determines file type from filename and characteristics
 * @param {string} filename - The filename
 * @param {string} href - The href value
 * @returns {string} File type category
 */
function determineFileType(filename, href) {
  // Folders end with / in directory listings
  if (href.endsWith('/')) {
    return 'folder';
  }
  
  // Get file extension
  const extension = filename.split('.').pop().toLowerCase();
  
  // Map extensions to types
  const typeMap = {
    'pdf': 'document',
    'txt': 'document', 
    'doc': 'document',
    'docx': 'document',
    'mp4': 'video',
    'mpg': 'video',
    'mpeg': 'video',
    'mov': 'video',
    'avi': 'video',
    'zip': 'archive',
    'rar': 'archive',
    '7z': 'archive',
    'htm': 'webpage',
    'html': 'webpage'
  };
  
  return typeMap[extension] || 'document';
}

/**
 * Extracts person name from filename using pattern recognition
 * @param {string} filename - The filename to analyze
 * @returns {string} Extracted person name or 'Unknown'
 */
function extractPersonFromFilename(filename) {
  // Remove file extension for cleaner analysis
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  
  // Known patterns and mappings
  const patterns = [
    { regex: /^TJ\d+/, name: 'Timothy Jackson' },
    { regex: /Jackson/i, name: 'Timothy Jackson' },
    { regex: /Ewell/i, name: 'Philip Ewell' },
    { regex: /Walls/i, name: 'Levi Walls' },
    { regex: /Brand/i, name: 'Benjamin Brand' },
    { regex: /Graf/i, name: 'Benjamin Graf' },
    { regex: /Gain/i, name: 'Rachel Gain' },
    { regex: /Heidlberger/i, name: 'Frank Heidlberger' },
    { regex: /Rebecca.*Schwinden/i, name: 'Rebecca Dowd Geoffroy-Schwinden' },
    { regex: /Cowley/i, name: 'Jennifer Cowley' },
    { regex: /Ishiyama/i, name: 'John Ishiyama' },
    { regex: /Slottow/i, name: 'Stephen Slottow' },
    { regex: /Chung/i, name: 'Andrew Chung' },
    { regex: /Bakulina/i, name: 'Ellen Bakulina' },
    { regex: /Kohanski/i, name: 'Peter Kohanski' },
    { regex: /Chaouat/i, name: 'Bruno Chaouat' }
  ];
  
  // Check each pattern
  for (const pattern of patterns) {
    if (pattern.regex.test(nameWithoutExt)) {
      return pattern.name;
    }
  }
  
  // If it's a folder name (underscore separated), try to extract
  if (nameWithoutExt.includes('_')) {
    const parts = nameWithoutExt.split('_');
    if (parts.length >= 2) {
      // Convert underscore format like "Rachel_Gain" to "Rachel Gain"
      return parts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ');
    }
  }
  
  return 'Unknown';
}

/**
 * Generates a unique ID for the file
 * @param {string} filename - The filename
 * @param {string} href - The href value
 * @returns {string} Unique identifier
 */
function generateFileId(filename, href) {
  // Use filename + href hash to ensure uniqueness
  const combined = filename + href;
  return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

/**
 * Cleans up filename for display purposes
 * @param {string} filename - Raw filename
 * @returns {string} Human-readable display name
 */
function cleanDisplayName(filename) {
  // Remove URL encoding
  let clean = decodeURIComponent(filename);
  
  // Remove file extension for cleaner display
  clean = clean.replace(/\.[^.]+$/, '');
  
  // Replace underscores with spaces
  clean = clean.replace(/_/g, ' ');
  
  // Clean up multiple spaces
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean;
}

/**
 * Generates searchable keywords from file information
 * @param {string} filename - The filename
 * @param {string} fileType - The file type
 * @param {string} person - The associated person
 * @returns {Array} Array of searchable keywords
 */
function generateKeywords(filename, fileType, person) {
  const keywords = [];
  
  // Add filename words
  const filenameWords = filename.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  keywords.push(...filenameWords);
  
  // Add file type
  keywords.push(fileType);
  
  // Add person name parts
  if (person !== 'Unknown') {
    const personWords = person.toLowerCase().split(/\s+/);
    keywords.push(...personWords);
  }
  
  // Add common legal/academic terms based on filename
  if (filename.toLowerCase().includes('deposition')) {
    keywords.push('testimony', 'legal', 'court');
  }
  if (filename.toLowerCase().includes('motion')) {
    keywords.push('legal', 'court', 'filing');
  }
  if (filename.toLowerCase().includes('exhibit')) {
    keywords.push('evidence', 'legal', 'court');
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}