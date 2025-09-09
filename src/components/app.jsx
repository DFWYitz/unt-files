// src/components/App.jsx

import React from 'react';
import { useDirectoryData } from '../hooks/useDirectoryData.js';

const TEST_URL = 'https://www.rasmusen.org/special/jackson/';

export default function App() {
  const { files, loading, error } = useDirectoryData(TEST_URL);

  if (loading) return <p>Loading directory...</p>;
  if (error) return <p>Error loading files: {error.message}</p>;

  return (
    <div>
      <h1>Directory Files</h1>
      <ul>
        {files.map(file => (
          <li key={file.id}>
            <a href={file.url} target="_blank" rel="noreferrer">
              {file.displayName}
            </a> ({file.type}, {file.size})
          </li>
        ))}
      </ul>
    </div>
  );
}
