
/**
 * Provides helper functions for working with video data
 */

// Global cache for video blobs
if (typeof window !== 'undefined' && !window.videoBlobCache) {
  window.videoBlobCache = {};
}

/**
 * Get a video blob from the cache or create one from a data URL
 * 
 * @param {Object|string} videoData - Video data object or data URL
 * @returns {Promise<Blob>} - Promise resolving to a video Blob
 */
export const getVideoBlob = async (videoData) => {
  // Case 1: Check global cache if we have a blobId
  if (typeof videoData === 'object' && videoData.blobId && window.videoBlobCache) {
    const cachedBlob = window.videoBlobCache[videoData.blobId];
    if (cachedBlob) {
      return cachedBlob;
    }
  }
  
  // Case 2: Create from data URL
  if (typeof videoData === 'string' && videoData.startsWith('data:')) {
    try {
      // Fetch the data URL to convert it to a blob
      const response = await fetch(videoData);
      return await response.blob();
    } catch (err) {
      console.error('Error creating blob from data URL:', err);
      throw err;
    }
  }
  
  // Case 3: Object with data URL
  if (typeof videoData === 'object' && videoData.dataUrl) {
    try {
      const response = await fetch(videoData.dataUrl);
      return await response.blob();
    } catch (err) {
      console.error('Error creating blob from object dataUrl:', err);
      throw err;
    }
  }
  
  throw new Error('Unsupported video data format');
};

/**
 * Create a blob URL from video data
 * 
 * @param {Object|string} videoData - Video data object or data URL
 * @returns {Promise<string>} - Promise resolving to a blob URL
 */
export const createBlobUrl = async (videoData) => {
  try {
    // Check if we already have a blob URL
    if (typeof videoData === 'object' && videoData.blobUrl) {
      return videoData.blobUrl;
    }
    
    // Otherwise create a new one
    const blob = await getVideoBlob(videoData);
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Error creating blob URL:', err);
    throw err;
  }
};

/**
 * Store a video blob in the global cache
 * 
 * @param {Blob} blob - Video blob to store
 * @returns {string} - ID for retrieval
 */
export const storeVideoBlob = (blob) => {
  if (typeof window === 'undefined' || !blob) {
    return null;
  }
  
  const blobId = `video_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  window.videoBlobCache[blobId] = blob;
  return blobId;
};
