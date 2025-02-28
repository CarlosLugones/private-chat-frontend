"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useWebSocket } from "../../../hooks/useWebSocket";
import ChatMessage from "../../../components/chat/ChatMessage";
import ChatInput from "../../../components/chat/ChatInput";

/**
 * ChatRoom - A real-time chat room component using WebSockets
 * 
 * This component provides a full-featured chat interface with:
 * - Real-time messaging through WebSockets
 * - Automatic scrolling to newest messages
 * - User presence notifications
 * - Room-specific chat history
 * 
 * Environment variables:
 * - NEXT_PUBLIC_BACKEND_URL: WebSocket server URL for production
 */
export default function ChatRoom() {
  const { room } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [ready, setReady] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  
  // Load username from localStorage once on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Get username from localStorage
    const storedUsername = localStorage.getItem("username");
    const storedRoom = localStorage.getItem("roomname");
    
    if (!storedUsername || storedRoom !== room) {
      // If no username or room mismatch, redirect to home
      router.push("/");
      return;
    }
    
    setUsername(storedUsername);
    setReady(true); // Mark component as ready for WebSocket connection
    
    // Add debug message to messages
    // setMessages(prev => [...prev, {
    //   system: true,
    //   type: "INFO",
    //   content: `Initializing with username: ${storedUsername} in room: ${room}`
    // }]);
  }, [room, router]);
  
  // Custom WebSocket hook - only connected once username is set and component is ready
  const { connected, sendMessage: sendWebSocketMessage } = useWebSocket({
    room,
    username,
    enabled: ready && !!username && !!room,
    onMessage: (data) => {
      console.log("Received message:", data);
      setMessages(prev => [...prev, data]);
    },
    onConnectionChange: (status) => {
      console.log("WebSocket connection status changed:", status);
      if (status) {
        // setMessages(prev => [...prev, {
        //   system: true,
        //   type: "CONNECTED",
        //   content: "Connected to the chat server"
        // }]);
      } else {
        // setMessages(prev => [...prev, {
        //   system: true,
        //   type: "DISCONNECTED",
        //   content: "Disconnected from the chat server"
        // }]);
      }
    },
    onError: (error) => {
      // console.error("WebSocket error:", error);
      // setMessages(prev => [...prev, {
      //   system: true,
      //   type: "ERROR",
      //   content: `Connection error: ${error.message || "Unknown error"}`
      // }]);
    }
  });

  // Add effect to join the room when connected
  useEffect(() => {
    if (connected && username && room) {
      console.log("Sending JOIN_ROOM message for room:", room);
      sendWebSocketMessage({
        system: true,
        type: "JOIN_ROOM",
        username: username,
        roomId: room
      });
    }
  }, [connected, username, room, sendWebSocketMessage]);

  // Debug connection status
  useEffect(() => {
    console.log("Connection status:", connected, "Username:", username, "Room:", room);
  }, [connected, username, room]);

  const leave = () => {
    if (connected) {
      sendWebSocketMessage({
        system: true,
        type: "LEAVE_ROOM",
        username: username,
        roomId: room
      });
    }
    localStorage.removeItem("username");
    localStorage.removeItem("roomname");
    router.push("/");
  };
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (message.trim() && connected) {
      sendWebSocketMessage({
        system: false,
        type: "CHAT_MESSAGE",
        roomId: room,
        content: message,
        username: username
      });
      setMessage("");
    } else if (!connected) {
      setMessages(prev => [...prev, {
        system: true,
        type: "ERROR",
        content: "Not connected to server. Please wait or refresh the page."
      }]);
    }
  };
  
  return (
    <div className="flex flex-col h-screen max-h-screen bg-base-200">
      <div className="bg-base-100 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">#{room}</h1>
          <div>
            <span className={`${connected ? "text-success" : "text-error"}`}>
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={leave}
              className="btn btn-sm btn-outline"
              aria-label="Leave chat room"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index}
            message={msg}
            isCurrentUser={msg.username === username}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        message={message}
        setMessage={setMessage}
        sendMessage={handleSendMessage}
        isConnected={connected}
      />
    </div>
  );
}