import React, { useState } from 'react';

const ImageMessage = ({ imageData, caption }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  // Handle image load completion
  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };
  
  // Toggle full-size image view
  const toggleFullImage = () => {
    setShowFullImage(!showFullImage);
  };

  return (
    <div className="image-message">
      {/* Loading indicator */}
      {!isImageLoaded && (
        <div className="flex justify-center items-center h-32 w-full bg-base-300 rounded animate-pulse">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      )}
      
      {/* Image thumbnail (clickable) */}
      <div 
        className={`image-container cursor-pointer ${isImageLoaded ? '' : 'hidden'}`}
        onClick={toggleFullImage}
      >
        <img 
          src={imageData} 
          alt={caption || "Shared image"} 
          onLoad={handleImageLoad}
          className="max-h-64 max-w-full rounded object-contain"
        />
        {caption && (
          <p className="mt-1 text-sm text-base-content/80">{caption}</p>
        )}
      </div>
      
      {/* Full-size image modal */}
      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 animate__animated animate__fadeIn"
          onClick={toggleFullImage}
        >
          <div className="max-w-full max-h-full p-4">
            <img 
              src={imageData} 
              alt={caption || "Shared image"} 
              className="max-w-full max-h-[90vh] object-contain"
            />
            {caption && (
              <p className="mt-2 text-center text-base-content/80">{caption}</p>
            )}
          </div>
          <button 
            className="absolute top-4 right-4 btn btn-circle btn-sm"
            onClick={toggleFullImage}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageMessage;
