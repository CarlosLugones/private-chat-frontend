import React, { useState, useEffect } from 'react';

export default function ImagePreviewModal({ imageData, onSend, onCancel }) {
  const [caption, setCaption] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (imageData && !isOpen) {
      setIsOpen(true);
      setCaption(''); // Reset caption when new image is loaded
    }
  }, [imageData]);

  if (!imageData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate__animated animate__fadeIn">
      <div className="bg-base-100 p-4 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Send Image</h3>
          <button 
            onClick={onCancel}
            className="btn btn-sm btn-circle"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4 flex justify-center">
          <div className="max-h-96 overflow-hidden">
            <img 
              src={imageData}
              alt="Preview" 
              className="max-w-full max-h-96 object-contain"
            />
          </div>
        </div>
        
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Caption (optional)</span>
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="input input-bordered w-full"
            maxLength={200}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <button 
            className="btn btn-outline" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => { onSend(imageData, caption); setCaption(''); }}
          >
            Send Image
          </button>
        </div>
      </div>
    </div>
  );
}
