"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket({ room, username, enabled, onMessage, onConnectionChange, onError }) {
  const [connected, setConnected] = useState(false);
  const [permanentlyFailed, setPermanentlyFailed] = useState(false);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const baseReconnectDelay = 1000; // starting with 1 second
  const connectingRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectingRef = useRef(false);
  
  // Clean up function to close WebSocket connection
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (ws.current) {
      console.log('Closing WebSocket connection');
      ws.current.onclose = null; // Remove onclose handler to prevent reconnection attempt
      ws.current.close();
      ws.current = null;
    }
    connectingRef.current = false;
    reconnectingRef.current = false;
  }, []);

  // Reset connection state to allow reconnection after permanent failure
  const resetConnection = useCallback(() => {
    if (permanentlyFailed) {
      setPermanentlyFailed(false);
      reconnectAttempts.current = 0;
      reconnectingRef.current = false;
      initializeWebSocket();
    }
  }, [permanentlyFailed]);

  // Handle reconnection logic
  const handleReconnection = useCallback(() => {
    // Prevent multiple simultaneous reconnection attempts
    if (reconnectingRef.current || !enabled || permanentlyFailed) return;
    
    reconnectingRef.current = true;
    
    // Increment before calculating delay and scheduling the reconnection
    reconnectAttempts.current += 1;
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current - 1);
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Store the timeout ID so we can clear it if needed
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      reconnectingRef.current = false;
      initializeWebSocket();
    }, delay);
  }, [enabled, onError, permanentlyFailed]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Don't try to connect if disabled, already connecting, already connected, permanently failed, or reconnecting
    if (!enabled || connectingRef.current || ws.current || permanentlyFailed || reconnectingRef.current) return;
    
    connectingRef.current = true;
    console.log(`Initializing WebSocket connection (attempt ${reconnectAttempts.current + 1})`);
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'localhost:8000';

    let socket;
    if (process.env.NODE_ENV === 'production') {
      socket = new WebSocket(`wss://${backendUrl}/ws`);
    } else {
      socket = new WebSocket(`ws://${backendUrl}/ws`);
    }
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      onConnectionChange?.(true);
      reconnectAttempts.current = 0;
      connectingRef.current = false;
      ws.current = socket;
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      // console.error('WebSocket error:', error);
      onError?.(error);
      connectingRef.current = false;
      // We'll let onclose handle the reconnection to avoid duplicate attempts
    };
    
    socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setConnected(false);
      onConnectionChange?.(false);
      connectingRef.current = false;
      ws.current = null;
      
      // Only attempt to reconnect if enabled and not manually closed
      if (enabled && !permanentlyFailed) {
        handleReconnection();
      }
    };
  }, [enabled, onMessage, onConnectionChange, onError, permanentlyFailed, handleReconnection]);

  // Send message through WebSocket
  const sendMessage = useCallback((data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // Initialize WebSocket when enabled
  useEffect(() => {
    if (enabled && !ws.current && !connectingRef.current && !permanentlyFailed && !reconnectingRef.current) {
      // Reset reconnect attempts when intentionally connecting
      reconnectAttempts.current = 0;
      initializeWebSocket();
    } else if (!enabled && (ws.current || reconnectTimeoutRef.current)) {
      cleanup();
    }
  }, [enabled, initializeWebSocket, cleanup, permanentlyFailed]);

  // Clean up on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { 
    connected, 
    sendMessage,
    permanentlyFailed,
    resetConnection 
  };
}
