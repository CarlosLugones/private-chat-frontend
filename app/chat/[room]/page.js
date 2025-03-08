"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useWebSocket } from "../../../hooks/useWebSocket";
import ChatMessage from "../../../components/chat/ChatMessage";
import ChatInput from "../../../components/chat/ChatInput";
import UsernameModal from "../../../components/chat/UsernameModal";

const RENDERABLE_TYPES = ["JOIN_ROOM", "LEAVE_ROOM", "CHAT_MESSAGE", "IMAGE_MESSAGE", "ERROR"];

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
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pastedImage, setPastedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedImage, setDroppedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  // Add a ref to track recently left users with timestamps
  const recentlyLeftRef = useRef({});
  const router = useRouter();
  
  // Load username from localStorage once on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Get username from localStorage
    const storedUsername = localStorage.getItem("username");
    const storedRoom = localStorage.getItem("roomname");
    
    if (!storedUsername) {
      // Show username modal if no username exists
      setShowUsernameModal(true);
    } else if (storedRoom !== room) {
      // If room mismatch but we have a username, update the stored room
      localStorage.setItem("roomname", room);
      setUsername(storedUsername);
      setReady(true);
    } else {
      // Username and room already match
      setUsername(storedUsername);
      setReady(true);
    }
  }, [room, router]);
  
  // Handle username submission from modal
  const handleUsernameSubmit = (newUsername) => {
    // Save to localStorage
    localStorage.setItem("username", newUsername);
    localStorage.setItem("roomname", room);
    
    // Update state
    setUsername(newUsername);
    setShowUsernameModal(false);
    setReady(true);
  };
  
  // Custom WebSocket hook - only connected once username is set and component is ready
  const { connected, sendMessage: sendWebSocketMessage } = useWebSocket({
    room,
    username,
    enabled: ready && !!username && !!room,
    onMessage: (data) => {
      console.log("Received message:", data);
      
      // Special handling for system messages about users joining/leaving
      if (data.system === true) {
        if (data.type === "JOIN_ROOM") {
          const username = data.username;
          const leftTimestamp = recentlyLeftRef.current[username];
          
          // Check if this user left within last 2 seconds (quick reconnection)
          if (leftTimestamp && (Date.now() - leftTimestamp < 2000)) {
            // This is a quick reconnection - remove the "left" message if it exists
            setMessages(prev => prev.filter(msg => 
              !(msg.system === true && 
                msg.type === "LEAVE_ROOM" && 
                msg.username === username)
            ));
            
            // Clear the reconnection tracking
            delete recentlyLeftRef.current[username];
            
            // Don't add the "joined" message
            return;
          }
        }
        else if (data.type === "LEAVE_ROOM") {
          // Track when this user left
          const username = data.username;
          recentlyLeftRef.current[username] = Date.now();
        }
      }
      
      // Standard message rendering for messages we want to display
      if (RENDERABLE_TYPES.includes(data.type)) {
        setMessages(prev => [...prev, data]);
      }
      
      switch (data.type) {
        case "USER_LIST":
          setUsers(data.users || []);
          break;
        default:
          break;
      }
    },
    onConnectionChange: (status) => {
      console.log("WebSocket connection status changed:", status);
    },
    onError: (error) => {
      // Handle errors
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

  // Process image file from any source (paste, file input, or drop)
  const processImageFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        setPastedImage(event.target.result);
      };
      
      reader.readAsDataURL(file);
      return true;
    }
    return false;
  };

  // Handle drag events for file dropping
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep the dragging state active
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only turn off dragging state if we're leaving the container (not its children)
    // This checks if the event target is the element the event handler is attached to
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  // Handle drop event - process the dropped file
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Process the first file only
      const file = files[0];
      console.log("File dropped:", file.name, file.type);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log("Image loaded from drop");
          setDroppedImage(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const leave = () => {
    if (connected) {
      sendWebSocketMessage({
        system: true,
        type: "LEAVE_ROOM",
        username: username,
        roomId: room
      });
    }
    localStorage.removeItem("roomname");
    router.push("/");
  };
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Enhanced sendMessage function with support for image messages
  const handleSendMessage = (e, customData = null) => {
    if (e) e.preventDefault();
    
    // If custom data is provided (e.g., image message), send that instead
    if (customData && connected) {
      console.log('Sending custom message data:', customData.type);
      
      // For other types, preserve the original approach
      const fullMessage = {
        ...customData,
        system: false,
        roomId: room,
        username: username,
        timestamp: new Date().toISOString()
      };
      
      sendWebSocketMessage(fullMessage);
      return;
    }
    
    // Regular text message
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

  // Handle image from any source - paste, file input, or drop
  const handleImageData = (imageData, caption) => {
    if (!imageData) return;
    
    // If we have a dropped image, reset it after processing
    if (droppedImage && imageData === droppedImage) {
      setDroppedImage(null);
    }
    
    // Send message with image data
    handleSendMessage(null, {
      type: "IMAGE_MESSAGE",
      imageData: imageData,
      caption: caption,
    });
  };
  
  const toggleUserList = () => {
    setShowUserList(prev => !prev);
  };

  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(room)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy room ID:', err);
      });
  };

  // Helper function to determine if messages should be connected
  const shouldConnectMessages = (currentMsg, prevMsg) => {
    // Must be from the same user and not system messages
    if (!prevMsg || currentMsg.system || prevMsg.system || currentMsg.username !== prevMsg.username) {
      return false;
    }
    
    // Check if messages were sent within the same minute
    const currentTime = new Date(currentMsg.timestamp);
    const prevTime = new Date(prevMsg.timestamp);
    
    return (
      currentTime.getFullYear() === prevTime.getFullYear() &&
      currentTime.getMonth() === prevTime.getMonth() &&
      currentTime.getDate() === prevTime.getDate() &&
      currentTime.getHours() === prevTime.getHours() &&
      currentTime.getMinutes() === prevTime.getMinutes()
    );
  };

  // Helper function to determine if a message is the latest from this user in a sequence
  const isLastMessageFromUser = (currentMsg, nextMsg) => {
    // If there's no next message, this is the latest message
    if (!nextMsg) return true;
    
    // If current or next is a system message, not comparable
    if (currentMsg.system || nextMsg.system) return true;
    
    // If the next message is from a different user, this is the latest from the current user
    return currentMsg.username !== nextMsg.username;
  };
  
  return (
    <div className="flex flex-col h-screen max-h-screen bg-base-200 relative">
      {/* Username Modal */}
      <UsernameModal 
        isOpen={showUsernameModal}
        onSubmit={handleUsernameSubmit}
      />

      {/* Chat room content - only shown when not showing username modal */}
      {!showUsernameModal && (
        <>
          <div className="bg-base-100 p-4 border-b border-gray-700 z-10">
            {/* Chat room header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">#{room}</h1>
                <button
                  onClick={copyRoomId}
                  className="btn btn-xs btn-ghost"
                  aria-label="Copy room ID"
                >
                  {copied ? (
                    <span className="text-success text-xs">Copied!</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="tooltip tooltip-bottom mr-2" data-tip={connected ? "Connected" : "Connecting..."}>
                  {connected ? (
                    <span className="relative flex size-3">
                      <span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 animate__animated animate__pulse">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
                    </span>
                  )}
                </div>
                <button 
                  onClick={toggleUserList}
                  className="btn btn-sm btn-outline"
                  aria-label="Toggle user list"
                >
                  Members ({users.length})
                </button>
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
          
          {/* User list side panel overlay */}
          {showUserList && (
            <div 
              className="fixed top-0 left-0 h-full w-72 bg-base-100 shadow-lg z-20 animate__animated animate__fadeInLeft"
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">Chat members</h2>
                  <button 
                    onClick={toggleUserList}
                    className="btn btn-sm btn-circle btn-ghost"
                    aria-label="Close user list"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ul className="space-y-2">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <li 
                          key={user}
                          className={`p-2 rounded-md ${user === username ? 'bg-primary/10 font-medium' : 'bg-base-200'}`}
                        >
                          <img src={`https://avatar.vercel.sh/${user}`} alt={`${user}'s avatar`} className="w-6 h-6 rounded-full inline-block mr-2" />
                          {user === username ? `${user} (you)` : user}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 italic">No other members</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Main chat area - always full width */}
          <div className="flex flex-col flex-1 overflow-hidden w-full">
            <div 
              className={`flex-1 overflow-y-auto p-4 relative ${isDragging ? 'bg-base-300' : ''}`}
              ref={messagesAreaRef}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {messages.map((msg, index) => (
                <ChatMessage 
                  key={index}
                  message={msg}
                  isCurrentUser={msg.username === username}
                  isConnectedToPrevious={shouldConnectMessages(msg, messages[index - 1])}
                  isLastFromUser={isLastMessageFromUser(msg, messages[index + 1])}
                />
              ))}
              <div ref={messagesEndRef} />
              
              {/* Drag overlay for visual feedback */}
              {isDragging && (
                <div className="fixed inset-0 flex items-center justify-center bg-base-200 bg-opacity-70 pointer-events-none z-50">
                  <div className="bg-base-100 p-6 rounded-lg shadow-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="mx-auto mb-4" viewBox="0 0 16 16">
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                    </svg>
                    <span className="text-xl font-medium">Drop image to share</span>
                  </div>
                </div>
              )}
            </div>
            
            <ChatInput
              message={message}
              setMessage={setMessage}
              sendMessage={handleSendMessage}
              isConnected={connected}
              users={users}
              pastedImage={pastedImage}
              setPastedImage={setPastedImage}
              droppedImage={droppedImage}
              onImageSend={handleImageData}
            />
          </div>
        </>
      )}
    </div>
  );
}