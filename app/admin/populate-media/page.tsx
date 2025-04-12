'use client';

import { useState } from 'react';

export default function PopulateMediaPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [count, setCount] = useState<{
    movies: number;
    tvShows: number;
    books: number;
  } | null>(null);

  const handlePopulate = async () => {
    setLoading(true);
    setMessage('Populating media database...');
    
    try {
      const response = await fetch('/api/populate-media', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to populate media database');
      }
      
      const data = await response.json();
      setCount(data.count);
      setMessage('Media database populated successfully!');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Populate Media Database</h1>
        <button
          onClick={handlePopulate}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Populating...' : 'Populate Media Database'}
        </button>
        {message && (
          <p className={`mt-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
        {count && (
          <div className="mt-4">
            <h2 className="font-semibold">Added Items:</h2>
            <ul className="list-disc list-inside">
              <li>{count.movies} movies</li>
              <li>{count.tvShows} TV shows</li>
              <li>{count.books} books</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 