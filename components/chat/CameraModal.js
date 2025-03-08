import React, { useState, useEffect, useRef } from 'react';
import { VideoRecordingService } from "../../utils/VideoRecordingService";

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
  
  // New state for video recording
  const [mode, setMode] = useState('photo'); // 'photo' or 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const recordingTimerRef = useRef(null);
  const MAX_RECORDING_TIME = 30; // seconds

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Reset state before initializing camera
      setIsCapturing(false);
      setPermissionError(null);
      setIsCameraReady(false);
      setModalKey(prev => prev + 1); // Force re-mount of video element
      setMode('photo'); // Default to photo mode
      setIsRecording(false);
      setRecordingTime(0);
      setRecordedVideo(null);
      setRecordedChunks([]);
      
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
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
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
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    setStream(null);
    setIsCameraReady(false);
    setMediaRecorder(null);
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
        audio: true // Enable audio for video recording
      };
      
      console.log('Requesting camera access...');
      // Request access to user's camera and microphone
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
                
                // Initialize MediaRecorder for video recording
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                  initMediaRecorder(mediaStream, 'video/webm;codecs=vp9,opus');
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                  initMediaRecorder(mediaStream, 'video/webm;codecs=vp8,opus');
                } else if (MediaRecorder.isTypeSupported('video/webm')) {
                  initMediaRecorder(mediaStream, 'video/webm');
                } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                  initMediaRecorder(mediaStream, 'video/mp4');
                } else {
                  console.error('No supported video MIME type found');
                  setPermissionError('Your browser does not support video recording');
                }
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
        setPermissionError('Camera access denied. Please allow camera and microphone access to use this feature.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera found on your device.');
      } else {
        setPermissionError(`Error accessing camera: ${err.message}`);
      }
    }
  };
  
  // Initialize MediaRecorder for video recording
  const initMediaRecorder = (stream, mimeType) => {
    try {
      const videoService = new VideoRecordingService({
        mimeType,
        videoBitsPerSecond: 250000 // Even lower bitrate for better browser support
      });
      
      const initialized = videoService.initialize(stream, {
        onDataAvailable: (chunk) => {
          console.log(`Received video chunk: ${chunk.size} bytes`);
        },
        onStop: async (blob, actualMimeType, metadata) => {
          console.log(`Recording completed: ${blob.size} bytes, type: ${actualMimeType}`);
          
          try {
            // Create a URL for preview
            const videoUrl = URL.createObjectURL(blob);
            
            // Use the metadata from the recorder, or fall back to defaults
            const videoData = {
              url: videoUrl,
              blob: blob,
              type: actualMimeType,
              duration: metadata?.duration || recordingTime,
              width: metadata?.width || 1280,
              height: metadata?.height || 720,
              valid: true
            };
            
            console.log(`Video stored with duration: ${videoData.duration}s`);
            setRecordedVideo(videoData);
          } catch (err) {
            console.error("Error processing recorded video:", err);
            setPermissionError(`Recording failed: ${err.message}`);
          }
        },
        onError: (error) => {
          console.error("Video recording error:", error);
          setPermissionError(`Recording error: ${error.message}`);
        }
      });
      
      if (!initialized) {
        throw new Error("Failed to initialize video recorder");
      }
      
      setMediaRecorder(videoService);
      console.log("Video recorder initialized successfully");
    } catch (err) {
      console.error('Error creating MediaRecorder:', err);
      setPermissionError(`Could not initialize video recording: ${err.message}`);
    }
  };
  
  // Start recording video
  const startRecording = () => {
    if (!mediaRecorder || isRecording) return;
    
    setIsRecording(true);
    setRecordingTime(0);
    setRecordedChunks([]);
    setRecordedVideo(null);
    
    const started = mediaRecorder.startRecording();
    if (!started) {
      setIsRecording(false);
      setPermissionError("Failed to start recording. Please try again.");
      return;
    }
    
    // Start timer to track recording time
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= MAX_RECORDING_TIME) {
          stopRecording();
          return MAX_RECORDING_TIME;
        }
        return newTime;
      });
    }, 1000);
  };
  
  // Stop recording video
  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return;
    
    mediaRecorder.stopRecording();
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    setIsRecording(false);
  };

  // Handle press and hold for recording
  const handleRecordStart = () => {
    if (mode === 'video' && isCameraReady && !isRecording && !recordedVideo) {
      startRecording();
    }
  };
  
  const handleRecordEnd = () => {
    if (isRecording) {
      stopRecording();
    }
  };
  
  // Send captured video to parent component
  const sendVideo = async () => {
    if (!recordedVideo || !onCapture) {
      console.error("Invalid recorded video data");
      setPermissionError("The video recording is invalid. Please try again.");
      return;
    }
    
    try {
      const blob = recordedVideo.blob;
      const blobId = Date.now().toString(); // Generate a unique ID for this blob
      
      // Store blob in a global cache
      if (!window.videoBlobCache) {
        window.videoBlobCache = {};
      }
      window.videoBlobCache[blobId] = blob;
      
      // Create a blob URL for this video
      const blobUrl = URL.createObjectURL(blob);
      
      // Convert the blob to a data URL for WebSocket transport
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onload = () => {
        // Define the expected MIME type explicitly for better compatibility
        const mimeType = blob.type || 'video/webm;codecs=vp8,opus';
        
        // Send data that can be transported over WebSocket
        onCapture({
          type: "VIDEO_MESSAGE",
          dataUrl: reader.result, // Include data URL for WebSocket transport
          blobId: blobId,         // Local reference for cache
          blobUrl: blobUrl,       // Local URL for immediate use
          metadata: {
            duration: recordedVideo.duration || recordingTime,
            size: blob.size,
            mimeType: mimeType
          }
        }, 'video');
        
        // Note: We don't revoke the URL yet as it will be used in the chat
        handleClose();
      };
      
      reader.onerror = (err) => {
        console.error("Error preparing video for sending:", err);
        setPermissionError(`Failed to prepare video: ${err.message}`);
      };
    } catch (err) {
      console.error("Error preparing video for sending:", err);
      setPermissionError(`Failed to prepare video: ${err.message}`);
    }
  };

  // Discard recorded video and go back to recording mode
  const discardVideo = () => {
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo.url);
      setRecordedVideo(null);
      setRecordingTime(0);
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

  // Format seconds to MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 animate__animated animate__fadeIn">
      <div className="bg-base-100 p-4 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            {mode === 'photo' ? 'Take a Photo' : 'Record a Video'}
          </h3>
          <div className="flex gap-2 items-center">
            {/* Mode toggle */}
            <div className="flex border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setMode('photo')}
                className={`px-3 py-1 text-sm ${mode === 'photo' ? 'bg-primary text-white' : 'bg-base-200'}`}
                disabled={isRecording || recordedVideo}
              >
                Photo
              </button>
              <button
                onClick={() => setMode('video')}
                className={`px-3 py-1 text-sm ${mode === 'video' ? 'bg-primary text-white' : 'bg-base-200'}`}
                disabled={isRecording || recordedVideo}
              >
                Video
              </button>
            </div>
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
          ) : recordedVideo ? (
            // Video playback mode after recording
            <div className="video-container" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
              <video 
                src={recordedVideo.url}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="flex gap-4">
                  <button
                    onClick={discardVideo}
                    className="btn btn-error btn-sm"
                  >
                    Discard
                  </button>
                  <button
                    onClick={sendVideo}
                    className="btn btn-success btn-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
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
              
              {/* Recording indicator and timer */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <span className="text-xs text-white bg-red-600 px-2 py-1 rounded-full font-mono">
                    {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                  </span>
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
          {availableCameras.length > 1 && !recordedVideo && (
            <button
              onClick={() => {
                const currentIndex = availableCameras.findIndex(cam => cam.deviceId === activeCameraId);
                const nextIndex = (currentIndex + 1) % availableCameras.length;
                switchCamera(availableCameras[nextIndex].deviceId);
              }}
              className="btn btn-circle btn-sm absolute left-4"
              disabled={!isCameraReady || isCapturing || isRecording}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
          )}
          
          {/* Capture button - changes based on mode */}
          {!recordedVideo && mode === 'photo' ? (
            <button
              onClick={takePhoto}
              disabled={!isCameraReady || isCapturing || permissionError}
              className="btn btn-primary btn-circle w-16 h-16 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full border-4 border-white"></div>
            </button>
          ) : !recordedVideo && mode === 'video' ? (
            <button
              onMouseDown={handleRecordStart}
              onMouseUp={handleRecordEnd}
              onTouchStart={handleRecordStart}
              onTouchEnd={handleRecordEnd}
              onMouseLeave={handleRecordEnd}
              disabled={!isCameraReady || permissionError}
              className={`btn btn-circle w-16 h-16 flex items-center justify-center ${isRecording ? 'btn-error animate-pulse' : 'btn-primary'}`}
            >
              {isRecording ? (
                <div className="w-8 h-8 rounded bg-white"></div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-600"></div>
              )}
            </button>
          ) : null}
          
          {/* Instructions */}
          {!recordedVideo && (
            <div className="absolute bottom-full mb-3 text-center w-full">
              <span className="text-xs bg-base-200 px-2 py-1 rounded">
                {mode === 'photo' 
                  ? 'Center yourself and tap to capture' 
                  : isRecording 
                    ? 'Release to stop recording' 
                    : 'Press and hold to record (max 30s)'}
              </span>
            </div>
          )}
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
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          .animate-pulse {
            animation: pulse 0.75s infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default CameraModal;
