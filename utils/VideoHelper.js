/**
 * Utility functions specifically for video handling and playback
 */

/**
 * Extracts the raw blob data from a data URL
 * @param {string} dataUrl - The data URL containing the video data
 * @returns {Promise<Blob>} - A promise resolving to the video blob
 */
export const extractBlobFromDataUrl = async (dataUrl) => {
  try {
    if (!dataUrl || typeof dataUrl !== 'string') {
      console.error('Invalid dataUrl parameter:', dataUrl);
      throw new Error('Not a valid data URL string');
    }

    if (!dataUrl.startsWith('data:')) {
      console.error('String is not a data URL, does not start with data:');
      throw new Error('Not a valid data URL');
    }

    // More flexible regex pattern to handle different data URL formats
    // This matches: data:[<mediatype>][;charset=<encoding>][;base64],<data>
    const matches = dataUrl.match(/^data:([^,;]+)?((?:;[^,;]+)*),(.+)$/);
    
    if (!matches) {
      console.error('Data URL format does not match expected pattern');
      // Create a generic blob as fallback if the format doesn't match
      return new Blob([dataUrl], { type: 'video/webm' });
    }

    const mimeType = matches[1] || 'video/webm';
    const options = matches[2] || '';
    const data = matches[3] || '';
    const isBase64 = options.includes('base64');
    
    console.log(`Extracted MIME type: ${mimeType}, isBase64: ${isBase64}`);
    
    let bytes;
    if (isBase64) {
      // Convert base64 to binary
      try {
        const binaryString = atob(data);
        bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } catch (e) {
        console.error('Base64 decode error, using fetch API as fallback:', e);
        // Fallback to using fetch API if base64 decode fails
        const response = await fetch(dataUrl);
        return await response.blob();
      }
    } else {
      // Handle non-base64 data
      bytes = new TextEncoder().encode(decodeURIComponent(data));
    }
    
    // Create blob with the correct MIME type
    return new Blob([bytes], { type: mimeType });
  } catch (error) {
    console.error('Error extracting blob from data URL:', error);
    
    // Last resort fallback: try the fetch API
    try {
      console.log('Attempting fetch API fallback for data URL');
      const response = await fetch(dataUrl);
      return await response.blob();
    } catch (fetchError) {
      console.error('Fetch fallback also failed:', fetchError);
      // Create a minimal placeholder blob
      return new Blob(["Video data processing failed"], { type: 'text/plain' });
    }
  }
};

/**
 * Creates a playable video element from various sources
 * @param {Object|string} videoData - Video data object or data URL
 * @returns {Promise<string>} - URL that can be used in a video element
 */
export const createPlayableVideoUrl = async (videoData) => {
  try {
    console.log('Creating playable URL from:', 
      typeof videoData === 'object' ? 'Object with properties: ' + Object.keys(videoData).join(', ') : 
      typeof videoData === 'string' ? 'String starting with: ' + videoData.substring(0, 50) + '...' : 
      'Unknown type: ' + typeof videoData);

    // Direct access to blob in cache
    if (typeof videoData === 'object' && videoData.blobId && window.videoBlobCache) {
      const cachedBlob = window.videoBlobCache[videoData.blobId];
      if (cachedBlob) {
        console.log('Using cached blob from blobId');
        return URL.createObjectURL(cachedBlob);
      }
    }
    
    // Direct blob URL
    if (typeof videoData === 'object' && videoData.blobUrl) {
      console.log('Using existing blobUrl');
      return videoData.blobUrl;
    }
    
    // Direct blob URL as string
    if (typeof videoData === 'string' && videoData.startsWith('blob:')) {
      console.log('Using string blob URL');
      return videoData;
    }
    
    // Data URL - either in object or direct
    let dataUrl;
    if (typeof videoData === 'object' && videoData.dataUrl) {
      dataUrl = videoData.dataUrl;
    } else if (typeof videoData === 'string' && videoData.startsWith('data:')) {
      dataUrl = videoData;
    }
    
    if (dataUrl) {
      console.log('Processing data URL');
      try {
        const blob = await extractBlobFromDataUrl(dataUrl);
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error('Failed to process data URL, trying direct access:', error);
        // If data URL processing fails, try returning it directly
        return dataUrl;
      }
    }
    
    throw new Error('Unsupported video data format');
  } catch (error) {
    console.error('Error creating playable video URL:', error);
    throw error;
  }
};

/**
 * Creates a video element for testing playback support
 * @param {string} url - The URL to test
 * @returns {Promise<boolean>} - True if the URL is playable
 */
export const testPlayability = (url) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      video.removeAttribute('src');
      video.load();
      resolve(false);
    }, 3000);
    
    // Success handler
    video.oncanplay = () => {
      clearTimeout(timeout);
      video.removeAttribute('src');
      video.load();
      resolve(true);
    };
    
    // Error handler
    video.onerror = () => {
      clearTimeout(timeout);
      video.removeAttribute('src');
      video.load();
      resolve(false);
    };
    
    // Start loading the video
    video.src = url;
    video.load();
  });
};
