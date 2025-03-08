/**
 * Utility functions to help with cross-browser video compatibility
 */

/**
 * Check if the browser can play WebM videos
 */
export function canPlayWebM() {
  const video = document.createElement('video');
  return video.canPlayType('video/webm; codecs="vp8, vorbis"') !== '';
}

/**
 * Check if the browser can play MP4 videos
 */
export function canPlayMP4() {
  const video = document.createElement('video');
  return video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') !== '';
}

// Add this new function to explicitly handle WebM data
export function extractWebMMetadata(dataUrl) {
  // Basic check if this is WebM data
  const isWebM = dataUrl.includes('video/webm');
  
  // Create a more specific MIME type for better player compatibility
  let enhancedMimeType = 'video/webm';
  
  if (isWebM) {
    if (dataUrl.includes('codecs=')) {
      // Keep existing codecs info
      enhancedMimeType = dataUrl.match(/video\/webm[^;]*(;[^,]*)?/)[0];
    } else {
      // Add default codecs for WebM
      enhancedMimeType = 'video/webm;codecs=vp8,opus';
    }
  }
  
  return {
    isWebM,
    mimeType: enhancedMimeType
  };
}

/**
 * Takes a video blob or URL and attempts to create a universally playable video element
 * @param {Blob|string} videoSource - Video blob or URL
 * @param {Function} onSuccess - Called with playable video URL when successful
 * @param {Function} onError - Called when conversion fails
 */
export function createBrowserCompatibleVideo(videoSource, onSuccess, onError) {
  try {
    console.log('Starting browser compatibility conversion for video');
    
    // If it's already a string URL, use directly
    if (typeof videoSource === 'string') {
      // If it's a data URL, convert to blob for better compatibility
      if (videoSource.startsWith('data:')) {
        // Extract MIME type and metadata
        const mimeMatch = videoSource.match(/^data:(.*?);/);
        let mimeType = mimeMatch ? mimeMatch[1] : 'video/webm';
        
        // For WebM, try to get more specific codec info
        const metadata = extractWebMMetadata(videoSource);
        if (metadata.isWebM) {
          mimeType = metadata.mimeType;
        }
        
        console.log('Data URL detected with MIME type:', mimeType);
        
        // Convert data URL to blob with explicit MIME type
        fetch(videoSource)
          .then(res => res.blob())
          .then(blob => {
            // Create a blob with explicit MIME type
            const betterBlob = new Blob([blob], { type: mimeType });
            const blobUrl = URL.createObjectURL(betterBlob);
            console.log('Created blob URL from data URL with type:', mimeType);
            
            // Store the blob in the global cache for future use
            if (!window.videoBlobCache) {
              window.videoBlobCache = {};
            }
            const cacheId = 'video-' + Date.now();
            window.videoBlobCache[cacheId] = betterBlob;
            
            onSuccess(blobUrl);
          })
          .catch(err => {
            console.error('Error converting data URL to blob:', err);
            // Fallback to using the data URL directly as a last resort
            onSuccess(videoSource);
          });
      } else {
        // Not a data URL, just use directly
        onSuccess(videoSource);
      }
      return;
    }

    // If it's a Blob, create a URL from it with proper MIME type
    if (videoSource instanceof Blob) {
      // Make sure the blob has the right MIME type
      let mimeType = videoSource.type || 'video/webm';
      
      // Create a new blob with the correct MIME type if needed
      const properBlob = videoSource.type ? 
        videoSource : 
        new Blob([videoSource], { type: mimeType });
      
      const url = URL.createObjectURL(properBlob);
      console.log(`Created blob URL from blob with MIME type: ${mimeType}`);
      onSuccess(url);
      return;
    }

    // If we got here, we don't know how to handle the input
    onError(new Error('Unsupported video source type'));
  } catch (error) {
    console.error('Error creating browser-compatible video:', error);
    onError(error);
  }
}
