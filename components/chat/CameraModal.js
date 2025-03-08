import React, { useState, useEffect, useRef } from 'react';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [modalKey, setModalKey] = useState(0); // Key to force re-mount of video element

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Reset state before initializing camera
      setIsCapturing(false);
      setPermissionError(null);
      setIsCameraReady(false);
      setModalKey(prev => prev + 1); // Force re-mount of video element
      
      // Small delay to ensure DOM is ready before camera init
      const timer = setTimeout(() => {
        initCamera();
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // Full cleanup when modal closes
      cleanupCamera();
    }
    
    // Always cleanup on unmount
    return () => {
      cleanupCamera();
    };
  }, [isOpen]);
  
  // Complete camera cleanup
  const cleanupCamera = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force reload
    }
    
    setStream(null);
    setIsCameraReady(false);
  };
  
  // Get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      return videoDevices;
    } catch (err) {
      console.error('Error getting cameras:', err);
      return [];
    }
  };
  
  // Switch camera (if multiple cameras are available)
  const switchCamera = async (deviceId) => {
    // Always stop current stream before switching
    cleanupCamera();
    
    try {
      // Start a new stream with the selected camera
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      };
      
      await initCamera(constraints);
      setActiveCameraId(deviceId);
    } catch (err) {
      console.error('Error switching camera:', err);
      setPermissionError(`Could not switch camera: ${err.message}`);
    }
  };
  
  // Initialize the camera
  const initCamera = async (constraints = null) => {
    try {
      setPermissionError(null);
      setIsCameraReady(false);
      
      // If no constraints provided, use default
      const mediaConstraints = constraints || {
        video: {
          facingMode: 'user', // Default to front camera for selfies
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false // No need for audio since we removed video
      };
      
      console.log('Requesting camera access...');
      // Request access to user's camera
      const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      console.log('Camera access granted');
      
      // Get available cameras for switching
      await getAvailableCameras();
      
      // Set the stream to the video element if it exists
      if (videoRef.current) {
        console.log('Setting video source');
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Set up event handlers
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('Video playing');
                setIsCameraReady(true);
              })
              .catch(err => {
                console.error('Error playing video:', err);
                setPermissionError('Could not start video preview.');
              });
          }
        };
        
        videoRef.current.onerror = (err) => {
          console.error('Video element error:', err);
          setPermissionError('Error with video display: ' + err.target.error.message);
        };
      } else {
        console.error('Video reference is null');
        setPermissionError('Camera initialization failed: Video element not available.');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      if (err.name === 'NotAllowedError') {
        setPermissionError('Camera access denied. Please allow camera access to use this feature.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera found on your device.');
      } else {
        setPermissionError(`Error accessing camera: ${err.message}`);
      }
    }
  };
  
  // Handle modal close with proper cleanup
  const handleClose = () => {
    cleanupCamera();
    if (onClose) {
      onClose();
    }
  };
  
  // Take photo from the video stream
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      console.error('Cannot take photo: video not ready');
      return;
    }
    
    setIsCapturing(true);
    
    // Flash effect with photo capture
    setTimeout(() => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match the video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`Canvas dimensions set to ${canvas.width}x${canvas.height}`);
        
        // Draw the current video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        console.log('Photo captured successfully');
        
        // Pass image data to parent component
        if (onCapture) {
          // Create message object directly for image
          const imageMessage = {
            type: "IMAGE_MESSAGE",
            imageData: imageData,
            caption: ""
          };
          
          // Send the complete message object
          onCapture(imageMessage, 'image');
        }
        
        // Close modal and cleanup
        handleClose();
      } catch (err) {
        console.error('Error capturing photo:', err);
        setPermissionError('Failed to capture photo. Please try again.');
        setIsCapturing(false);
      }
    }, 200); // Small delay for visual feedback
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 animate__animated animate__fadeIn">
      <div className="bg-base-100 p-4 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Take a Photo</h3>
          <div className="flex gap-2 items-center">
            <button 
              onClick={handleClose}
              className="btn btn-sm btn-circle"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="camera-container relative w-full bg-black rounded-lg overflow-hidden">
          {permissionError ? (
            <div className="p-6 text-center text-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>{permissionError}</p>
              <button 
                className="btn btn-primary mt-4"
                onClick={() => {
                  cleanupCamera();
                  setTimeout(() => initCamera(), 300);
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="video-container" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
              {/* Live camera feed - key forces complete remount */}
              <video 
                key={`video-${modalKey}`}
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect for front camera
              />
              
              {/* Loading indicator */}
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                  <div className="loading loading-spinner loading-lg text-primary"></div>
                </div>
              )}
              
              {/* Camera active indicator */}
              {isCameraReady && (
                <div className="absolute top-4 right-4 flex items-center">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">LIVE</span>
                </div>
              )}
              
              {/* Flash effect when taking photo */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white animate-flash"></div>
              )}
              
              {/* Hidden canvas for taking the photo */}
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}
        </div>
        
        {/* Camera controls */}
        <div className="flex justify-center items-center mt-4 relative">
          {/* Camera switch button if multiple cameras available */}
          {availableCameras.length > 1 && (
            <button
              onClick={() => {
                const currentIndex = availableCameras.findIndex(cam => cam.deviceId === activeCameraId);
                const nextIndex = (currentIndex + 1) % availableCameras.length;
                switchCamera(availableCameras[nextIndex].deviceId);
              }}
              className="btn btn-circle btn-sm absolute left-4"
              disabled={!isCameraReady || isCapturing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
          )}
          
          {/* Capture button for photos */}
          <button
            onClick={takePhoto}
            disabled={!isCameraReady || isCapturing || permissionError}
            className="btn btn-primary btn-circle w-16 h-16 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full border-4 border-white"></div>
          </button>
          
          {/* Instructions */}
          <div className="absolute bottom-full mb-3 text-center w-full">
            <span className="text-xs bg-base-200 px-2 py-1 rounded">
              Center yourself and tap to capture
            </span>
          </div>
        </div>

        {/* Add styles for animations */}
        <style jsx>{`
          @keyframes flash {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }
          
          .animate-flash {
            animation: flash 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default CameraModal;
