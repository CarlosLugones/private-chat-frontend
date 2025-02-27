"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [username, setUsername] = useState("");
  const [roomname, setRoomname] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const router = useRouter();
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    // Check if user info exists in localStorage
    const storedUsername = localStorage.getItem("username");
    const storedRoomname = localStorage.getItem("roomname");
    
    if (!storedUsername || !storedRoomname) {
      router.push("/");
      return;
    }
    
    setUsername(storedUsername);
    setRoomname(storedRoomname);
  }, [router]);
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (message.trim()) {
      setMessages([...messages, { text: message, sender: "user" }]);
      setMessage("");
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="w-full">
        <div className="rounded-lg shadow-lg flex flex-col h-[90vh] border border-gray-700">
          {/* Chat header */}
          <div className="bg-blue-600 text-white px-6 p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-xl font-bold">#{roomname}</h2>
            <div>@{username}</div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 max-w-[80%] animate__animated animate__fadeIn ${
                  msg.sender === "user"
                    ? "ml-auto bg-blue-600 text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl"
                    : "bg-gray-100 rounded-tl-xl rounded-tr-xl rounded-br-xl"
                } p-3`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <div className="border-t border-gray-700 p-4">
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-500 rounded-l-md focus:outline-none"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-r-md transition duration-300"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
