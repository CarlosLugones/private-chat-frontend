"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useWebSocket } from "../../../hooks/useWebSocket";
import ChatMessage from "../../../components/chat/ChatMessage";
import ChatInput from "../../../components/chat/ChatInput";

const RENDERABLE_TYPES = ["JOIN_ROOM", "LEAVE_ROOM", "CHAT_MESSAGE"];

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
  }, [room, router]);
  
  // Custom WebSocket hook - only connected once username is set and component is ready
  const { connected, sendMessage: sendWebSocketMessage } = useWebSocket({
    room,
    username,
    enabled: ready && !!username && !!room,
    onMessage: (data) => {
      console.log("Received message:", data);
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
  
  const toggleUserList = () => {
    setShowUserList(prev => !prev);
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
              onClick={toggleUserList}
              className="btn btn-sm btn-outline"
              aria-label="Toggle user list"
            >
              Users ({users.length})
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
      
      <div className="flex flex-1 overflow-hidden">
        {showUserList && (
          <div className="w-64 bg-base-100 p-4 border-r border-gray-700 overflow-y-auto animate__animated animate__fadeInLeft">
            <h2 className="text-lg font-semibold mb-3">Members in #{room}</h2>
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
        )}
        
        <div className={`flex flex-col ${showUserList ? 'flex-1' : 'w-full'}`}>
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
      </div>
    </div>
  );
}