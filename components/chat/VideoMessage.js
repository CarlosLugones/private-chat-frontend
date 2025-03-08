import React, { useState, useRef, useEffect } from 'react';
import { createPlayableVideoUrl } from '../../utils/VideoHelper';

const VideoMessage = ({ videoData, caption }) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullVideo, setShowFullVideo] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [videoSource, setVideoSource] = useState(null);
  const [hasAttemptedFallback, setHasAttemptedFallback] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const videoRef = useRef(null);
  const fullVideoRef = useRef(null);
  
  // Use different strategies based on the type of video data
  useEffect(() => {
    if (!videoData) {
      console.error('No video data provided');
      setLoadError(true);
      return;
    }
    
    // Debug check for format issues
    console.log('VideoMessage received data:', { 
      type: typeof videoData, 
      isObject: typeof videoData === 'object', 
      hasDataUrl: typeof videoData === 'object' && !!videoData.dataUrl,
      hasBlobUrl: typeof videoData === 'object' && !!videoData.blobUrl,
      hasBlobId: typeof videoData === 'object' && !!videoData.blobId,
      hasMetadata: typeof videoData === 'object' && !!videoData.metadata,
      rawDataPrefix: typeof videoData === 'string' ? videoData.substring(0, 20) + '...' : 'not a string'
    });
    
    // Reset states
    setIsVideoLoaded(false);
    setLoadError(false);
    setIsPlaying(false);
    
    // Direct blob access when available (most reliable)
    if (typeof videoData === 'object' && videoData.blobId && window.videoBlobCache) {
      const cachedBlob = window.videoBlobCache[videoData.blobId];
      if (cachedBlob) {
        console.log('Using cached blob directly');
        const url = URL.createObjectURL(cachedBlob);
        setVideoSource(url);
        setBlobUrl(url);
        return;
      }
    }
    
    // Try the utility for all other cases
    (async () => {
      try {
        // Use our utility to create a playable URL
        const url = await createPlayableVideoUrl(videoData);
        console.log('Created playable URL');
        
        setVideoSource(url);
        setBlobUrl(url);
      } catch (error) {
        console.error('Error creating playable video:', error);
        setLoadError(true);
        
        // Final fallback - try processing just the blobId if available
        if (typeof videoData === 'object' && videoData.blobId && !videoData.blobUrl) {
          handleFallback();
        }
      }
    })();
  }, [videoData]);

  // Add a separate fallback function for cleaner code
  const handleFallback = () => {
    if (typeof videoData === 'object' && videoData.blobId) {
      console.log('Attempting final fallback using blobId:', videoData.blobId);
      try {
        if (window.videoBlobCache && window.videoBlobCache[videoData.blobId]) {
          const blob = window.videoBlobCache[videoData.blobId];
          const url = URL.createObjectURL(blob);
          setVideoSource(url);
          setBlobUrl(url);
          setLoadError(false);
        }
      } catch (err) {
        console.error('Final fallback failed:', err);
      }
    }
  };

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) {
        console.log('Cleaning up blob URL');
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);
  
  // Handle video load completion
  const handleVideoLoad = () => {
    console.log('Video loaded successfully!');
    setIsVideoLoaded(true);
    setLoadError(false);
  };
  
  // Handle video loading error with a more robust approach
  const handleVideoError = (e) => {
    console.error('Video loading error:', e);
    
    if (!hasAttemptedFallback) {
      setHasAttemptedFallback(true);
      
      // Try one last approach - use an embedded video player with specific attributes
      try {
        if (typeof videoData === 'object' && videoData.dataUrl) {
          // Create a new blob URL with explicit playable format
          const dataUrl = videoData.dataUrl;
          
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              // Force WebM MIME type which has better support
              const newBlob = new Blob([blob], { type: 'video/webm' });
              const url = URL.createObjectURL(newBlob);
              
              console.log('Created emergency fallback URL for video');
              setVideoSource(url);
              setBlobUrl(url);
              
              // Flag as loaded after a delay to allow browser to process
              setTimeout(() => {
                setIsVideoLoaded(true);
                setLoadError(false);
              }, 200);
            })
            .catch(err => {
              console.error('Fallback failed:', err);
              setLoadError(true);
            });
        } else {
          setLoadError(true);
        }
      } catch (err) {
        console.error('Error in fallback attempt:', err);
        setLoadError(true);
      }
    } else {
      // Already tried a fallback, give up and just offer download
      setLoadError(true);
      setIsVideoLoaded(false);
    }
  };

  // Download the video
  const handleDownloadClick = (e) => {
    e.stopPropagation();
    if (!videoSource) return;
    
    // Create a simple wrapper to handle different video data types
    const downloadVideo = () => {
      const link = document.createElement('a');
      link.href = videoSource;
      link.download = `video-${new Date().getTime()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    // If we have a blob from the cache, use that for better downloads
    if (typeof videoData === 'object' && videoData.blobId && window.videoBlobCache) {
      const cachedBlob = window.videoBlobCache[videoData.blobId];
      if (cachedBlob) {
        const url = URL.createObjectURL(cachedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `video-${new Date().getTime()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
    }
    
    // Otherwise use standard approach
    downloadVideo();
  };
  
  // Toggle play/pause
  const togglePlayPause = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Error playing video:', err);
          setLoadError(true);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  // Toggle full-size video view
  const toggleFullVideo = () => {
    setShowFullVideo(!showFullVideo);
  };

  return (
    <div className="video-message relative">
      {/* Loading indicator */}
      {!isVideoLoaded && !loadError && (
        <div className="flex justify-center items-center h-32 w-full bg-base-300 rounded animate-pulse">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      )}
      
      {/* Error message with download option */}
      {loadError && (
        <div className="flex flex-col justify-center items-center h-40 w-full bg-base-300 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-warning mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-center px-4 mb-2">
            This video cannot be played directly in the chat.
          </p>
          
          <div className="mt-1 flex flex-col items-center">
            <button 
              className="btn btn-sm btn-success mb-2"
              onClick={handleDownloadClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              Download Video
            </button>
            
            {caption && (
              <p className="mt-1 text-sm text-base-content/80">{caption}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Video thumbnail */}
      {videoSource && !loadError && (
        <div className="video-container relative group">
          <video 
            ref={videoRef}
            className={`max-h-64 max-w-full rounded object-contain ${isVideoLoaded ? '' : 'hidden'}`}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            src={videoSource}
            muted
            controls
            preload="metadata"
            width="320"
            autoPlay={false}
          />
          
          {/* Download button always visible on hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="btn btn-circle btn-xs btn-success"
              onClick={handleDownloadClick}
              title="Download video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
            </button>
          </div>
          
          {/* Add a click-to-play overlay, but only when not playing */}
          {isVideoLoaded && !isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause(e);
              }}
            >
              <div className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-white" viewBox="0 0 16 16">
                  <path d="M6 3v10l8-5-8-5z"/>
                </svg>
              </div>
            </div>
          )}
          
          {caption && (
            <p className="mt-1 text-sm text-base-content/80">{caption}</p>
          )}
        </div>
      )}
      
      {/* Full-size video modal */}
      {showFullVideo && videoSource && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 animate__animated animate__fadeIn"
          onClick={toggleFullVideo}
        >
          <div className="max-w-full max-h-full p-4">
            <video 
              ref={fullVideoRef}
              className="max-w-full max-h-[90vh] object-contain"
              src={videoSource}
              controls
              autoPlay
              muted={false}
            />
            
            {caption && (
              <p className="mt-2 text-center text-base-content/80">{caption}</p>
            )}
          </div>
          
          {/* Always show download button */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button 
              className="btn btn-circle btn-sm btn-success"
              onClick={handleDownloadClick}
              title="Download video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
            </button>
            <button 
              className="btn btn-circle btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullVideo();
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoMessage;
