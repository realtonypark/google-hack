'use client';

import { useState } from 'react';

export default function InitPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInitialize = async () => {
    setLoading(true);
    setMessage('Initializing database...');
    
    try {
      const response = await fetch('/api/init', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize database');
      }
      
      const data = await response.json();
      setMessage('Database initialized successfully!');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Initialize Database</h1>
        <button
          onClick={handleInitialize}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Initializing...' : 'Initialize Database'}
        </button>
        {message && (
          <p className={`mt-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
} 