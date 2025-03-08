import { useState } from 'react';

export default function UsernameModal({ isOpen, onSubmit }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.length > 15) {
      setError('Username must be 15 characters or less');
      return;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError('Username can only contain letters and numbers (no spaces or special characters)');
      return;
    }
    
    // Clear any error and submit the username
    setError('');
    onSubmit(username);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-lg shadow-xl w-full max-w-md">
        <p className="text-sm text-gray-500 mb-4">
          Choose a nickname to join this chat room
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <input
              type="text"
              className="p-2 border border-gray-500 rounded w-full focus:outline-none"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-error text-sm mt-2 animate__animated animate__fadeIn">{error}</p>
            )}
          </div>
          
          <div className="mt-6">
            <button 
              type="submit" 
              className="btn btn-primary w-full"
            >
              Join Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
