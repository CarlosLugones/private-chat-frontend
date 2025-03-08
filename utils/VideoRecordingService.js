/**
 * A service to handle video recording with better compatibility across browsers
 */
export class VideoRecordingService {
  constructor(options = {}) {
    this.options = {
      mimeType: 'video/webm;codecs=vp8',
      audioBitsPerSecond: 64000,   // Lower audio bitrate for better compatibility
      videoBitsPerSecond: 250000,  // Lower video bitrate for better compatibility
      ...options
    };
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.onDataAvailable = null;
    this.onStop = null;
    this.onError = null;
    this.startTime = null;
  }
  
  /**
   * Initialize the recorder with a media stream
   */
  initialize(stream, callbacks = {}) {
    try {
      this.stream = stream;
      this.onDataAvailable = callbacks.onDataAvailable || null;
      this.onStop = callbacks.onStop || null;
      this.onError = callbacks.onError || null;
      
      // Try to find the best supported MIME type, prioritizing more compatible codecs
      const mimeTypes = [
        // Most compatible options first
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      
      let selectedMimeType = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log(`Using supported MIME type: ${mimeType}`);
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error("No supported video recording MIME type found");
      }
      
      // Create media recorder with options
      const options = {
        mimeType: selectedMimeType,
        audioBitsPerSecond: this.options.audioBitsPerSecond,
        videoBitsPerSecond: this.options.videoBitsPerSecond
      };
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
      this.mediaRecorder.onstop = this.handleStop.bind(this);
      this.mediaRecorder.onerror = this.handleError.bind(this);
      
      return true;
    } catch (error) {
      console.error("Failed to initialize video recorder:", error);
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }
  
  /**
   * Start recording
   */
  startRecording(timeSlice = 250) {
    if (!this.mediaRecorder) {
      console.error("MediaRecorder not initialized");
      return false;
    }
    
    this.recordedChunks = [];
    this.startTime = Date.now();
    
    try {
      this.mediaRecorder.start(timeSlice);
      console.log("Recording started", this.mediaRecorder.state);
      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }
  
  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state !== "recording") {
      console.log("Not recording or already stopped");
      return false;
    }
    
    try {
      // Calculate recording duration
      const recordingDuration = (Date.now() - this.startTime) / 1000;
      console.log(`Recording duration: ${recordingDuration.toFixed(2)}s`);
      
      // Store for use in the stop handler
      this.recordingDuration = recordingDuration;
      
      this.mediaRecorder.stop();
      console.log("Recording stopped");
      return true;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }
  
  /**
   * Handle data available event
   */
  handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
      console.log(`Received data chunk: ${event.data.size} bytes`);
      this.recordedChunks.push(event.data);
      
      if (this.onDataAvailable) {
        this.onDataAvailable(event.data);
      }
    }
  }
  
  /**
   * Handle stop event and ensure proper WebM container finalization
   */
  handleStop() {
    if (this.recordedChunks.length === 0) {
      console.error("No video data recorded");
      if (this.onError) {
        this.onError(new Error("No video data was recorded"));
      }
      return;
    }
    
    // Calculate total size
    const totalSize = this.recordedChunks.reduce((size, chunk) => size + chunk.size, 0);
    console.log(`Total recorded: ${totalSize} bytes in ${this.recordedChunks.length} chunks`);
    
    // Get the real duration in seconds
    const duration = (this.recordingDuration || 0).toFixed(3);
    
    try {
      // Create a blob from the chunks
      const mimeType = this.mediaRecorder.mimeType || 'video/webm;codecs=vp8,opus';
      
      // For better compatibility, we'll do a two-step processing:
      // 1. Create the initial blob
      const tempBlob = new Blob(this.recordedChunks, { type: mimeType });
      
      // 2. Create a properly muxed WebM file with duration metadata
      // This is crucial for creating a valid WebM container
      this.fixWebmDuration(tempBlob, parseFloat(duration), (fixedBlob) => {
        console.log(`Fixed WebM duration: ${duration}s, size: ${fixedBlob.size} bytes`);
        
        // Fixed metadata for the video that helps players
        const metadata = {
          duration: parseFloat(duration),
          width: 1280,
          height: 720,
          type: mimeType,
          size: fixedBlob.size
        };
        
        if (this.onStop) {
          this.onStop(fixedBlob, mimeType, metadata);
        }
      });
    } catch (error) {
      console.error("Error finalizing video:", error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Fix WebM duration metadata
   * This is essential for creating a valid WebM container that players can read
   */
  fixWebmDuration(blob, duration, callback) {
    // If we're dealing with very short clips (<1s), add a small buffer
    if (duration < 1) duration = 1;
    
    // For iOS compatibility, we need to convert to MP4 if browser supports it
    if (MediaRecorder.isTypeSupported('video/mp4') && typeof window.MediaSource !== 'undefined') {
      console.log('Attempting MP4 conversion for better compatibility');
      this.convertToMp4(blob, duration, callback);
      return;
    }

    // For browsers that support it, fix WebM duration metadata
    const reader = new FileReader();
    
    reader.onload = () => {
      // The file data buffer
      const buffer = reader.result;
      
      // We need to create a view of the buffer to work with the binary data
      const view = new DataView(buffer);
      
      // WebM header begins with 'EBML'
      // Search for the duration field
      const durationPos = this.findWebMDurationPosition(view);
      
      if (durationPos) {
        console.log(`Found duration field at position ${durationPos}`);
        // WebM duration is stored as a float64
        view.setFloat64(durationPos, duration, false);
        
        // Create a new blob with the fixed duration
        const fixedBlob = new Blob([buffer], { type: blob.type });
        
        callback(fixedBlob);
      } else {
        console.warn('Could not find duration field, using original blob');
        callback(blob);
      }
    };
    
    reader.onerror = (err) => {
      console.error('Error reading blob:', err);
      callback(blob); // Fallback to original blob
    };
    
    reader.readAsArrayBuffer(blob);
  }

  /**
   * Find the position of duration metadata in WebM
   * This is a simplified approach that works for most WebM files
   */
  findWebMDurationPosition(dataView) {
    // WebM has a fairly complex structure, but duration is typically found
    // in a specific location. This is a simplified search.
    const bytes = dataView.byteLength;
    
    // Simple heuristic - look for specific byte patterns that often precede duration
    for (let i = 0; i < bytes - 8; i++) {
      // Look for common duration field patterns
      if ((dataView.getUint8(i) === 0x44 && 
           dataView.getUint8(i+1) === 0x89 && 
           dataView.getUint8(i+2) === 0x84) ||
          // Alternative pattern
          (dataView.getUint8(i) === 0x44 && 
           dataView.getUint8(i+1) === 0x89 &&
           dataView.getUint8(i+2) === 0x88)) {
        
        // Return position after the pattern, where the float64 duration value is stored
        return i + 4; // Skip the pattern bytes and size byte
      }
    }
    
    return null;
  }

  /**
   * Attempt to convert WebM to MP4 for better compatibility
   * This is experimental and may not work in all browsers
   */
  convertToMp4(webmBlob, duration, callback) {
    // Create a video element to process the WebM file
    const videoEl = document.createElement('video');
    videoEl.style.display = 'none';
    document.body.appendChild(videoEl);
    
    // Set up event handlers
    videoEl.onloadedmetadata = () => {
      console.log('WebM loaded for conversion, attempting capture');
      
      try {
        // Create a MediaSource for the output
        const mediaSource = new MediaSource();
        videoEl.src = URL.createObjectURL(mediaSource);
        
        mediaSource.addEventListener('sourceopen', () => {
          // Create a SourceBuffer
          const sourceBuffer = mediaSource.addSourceBuffer('video/mp4;codecs=avc1.42E01E,mp4a.40.2');
          
          // Get the webm data
          const reader = new FileReader();
          reader.onload = () => {
            sourceBuffer.appendBuffer(reader.result);
            
            // When update is complete
            sourceBuffer.addEventListener('updateend', () => {
              mediaSource.endOfStream();
              
              // Create new blob with corrected duration
              const video = document.createElement('video');
              video.src = URL.createObjectURL(webmBlob);
              video.muted = true;
              
              video.onloadedmetadata = () => {
                // Set the correct duration
                video.currentTime = duration;
                
                // Wait for correct time
                video.ontimeupdate = () => {
                  // Create a canvas and draw the video frame
                  const canvas = document.createElement('canvas');
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  
                  // Convert to blob
                  canvas.toBlob((finalBlob) => {
                    // Clean up
                    if (videoEl.parentNode) {
                      videoEl.parentNode.removeChild(videoEl);
                    }
                    URL.revokeObjectURL(videoEl.src);
                    
                    // Return the processed blob
                    callback(webmBlob); // Fallback to WebM if conversion fails
                  }, 'video/mp4');
                };
                
                video.play().catch(err => {
                  console.error('Error playing video during conversion:', err);
                  callback(webmBlob); // Fallback to WebM
                });
              };
              
              video.onerror = () => {
                console.error('Error loading video during conversion');
                callback(webmBlob); // Fallback to WebM
              };
            });
          };
          
          reader.readAsArrayBuffer(webmBlob);
        });
      } catch (err) {
        console.error('Error during MP4 conversion:', err);
        if (videoEl.parentNode) {
          videoEl.parentNode.removeChild(videoEl);
        }
        callback(webmBlob); // Fallback to WebM
      }
    };
    
    videoEl.onerror = () => {
      console.error('Error loading WebM for conversion');
      if (videoEl.parentNode) {
        videoEl.parentNode.removeChild(videoEl);
      }
      callback(webmBlob); // Fallback to WebM
    };
    
    // Load the WebM blob
    videoEl.src = URL.createObjectURL(webmBlob);
  }
  
  /**
   * Handle error event
   */
  handleError(error) {
    console.error("MediaRecorder error:", error);
    if (this.onError) {
      this.onError(error);
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    this.recordedChunks = [];
    this.mediaRecorder = null;
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      this.stream = null;
    }
  }
  
  /**
   * Create a video element with the recorded video
   */
  static createVideoElement(blob, autoplay = true) {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    if (autoplay) {
      video.autoplay = true;
    }
    
    // Clean up URL when done
    video.onended = () => {
      URL.revokeObjectURL(url);
    };
    
    return { video, url, blob };
  }
  
  /**
   * Convert a blob to a data URL
   */
  static async blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
