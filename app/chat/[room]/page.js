"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function ChatRoom({ params }) {
  const { room } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const leave = () => {
    ws.send(JSON.stringify({
      system: true,
      type: "LEAVE_ROOM",
      username: username,
      roomId: room
    }));
    localStorage.removeItem("username");
    localStorage.removeItem("roomname");
    router.push("/");
  };

  useEffect(() => {
    if (typeof window == 'undefined') {
      return;
    }

    // Get username from localStorage
    const storedUsername = localStorage.getItem("username");
    const storedRoom = localStorage.getItem("roomname");
    
    if (!storedUsername || storedRoom !== room) {
      // If no username or room mismatch, redirect to home
      router.push("/");
    }
    
    setUsername(storedUsername);

    if (ws) {
      return;
    }
    
    // Connect to WebSocket
    let wsConnection;
    if (process.env.NODE_ENV === 'development') {
      wsConnection = new WebSocket(`ws://localhost:8000/ws`);
    } else {
      wsConnection = new WebSocket(`wss://${process.env.NEXT_PUBLIC_SITE_URL}/ws`);
    }
    
    wsConnection.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);

      setMessages(prev => [...prev, {
        system: true,
        type: "CONNECTED",
        content: "Connected to the chat server"
      }]);
      
      // Join the room
      wsConnection.send(JSON.stringify({
        system: true,
        type: "JOIN_ROOM",
        username: storedUsername,
        roomId: room
      }));
    };
    
    wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };
    
    wsConnection.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      setMessages(prev => [...prev, {
        system: true,
        type: "DISCONNECTED",
        content: "Disconnected from the chat server"
      }]);
    };
    
    wsConnection.onerror = (error) => {
      console.log("WebSocket error:", error);
      setConnected(false);
      // setMessages(prev => [...prev, {
      //   system: true,
      //   type: "ERROR",
      //   content: error
      // }]);
    };
    
    setWs(wsConnection);
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [room, router]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const sendMessage = (e) => {
    e.preventDefault();
    
    if (message.trim() && ws && connected) {
      ws.send(JSON.stringify({
        system: false,
        type: "CHAT_MESSAGE",
        roomId: room,
        content: message,
        username: username
      }));
      setMessage("");
    }
  };
  
  return (
    <div className="flex flex-col h-screen max-h-screen bg-base-200">
      <div className="bg-base-100 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">#{room}</h1>
          <button 
            onClick={leave}
            className="btn btn-sm btn-outline btn-warning"
          >
            Leave
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div key={index} className={`chat ${msg.system === true ? 'chat-system' : (msg.username === username ? 'chat-end' : 'chat-start')} animate__animated animate__fadeIn`}>
            {!msg.system && (
              <div className="chat-image avatar">
                <div className="w-8 rounded-full">
                  <img src={`https://avatar.vercel.sh/${msg.username}`} />
                </div>
              </div>
            )}
            <div className="chat-header">
              {!msg.system && (
                <>
                  {msg.username}
                  <time className="text-xs opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </time>
                </>
              )}
            </div>
            <div className={`chat-bubble ${msg.system === true ? 'chat-bubble-system bg-gray-600' : (msg.username === username ? 'chat-bubble-primary' : 'chat-bubble-info')}`}>
              {msg.content}
            </div>
            {!msg.system && (
              <div className="chat-footer opacity-50">
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-base-100 p-4 border-t border-gray-700">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="block p-2 border border-gray-500 rounded-md w-full focus:outline-none"
            disabled={!connected}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!connected}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}