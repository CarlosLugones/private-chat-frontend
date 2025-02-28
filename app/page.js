"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [roomname, setRoomname] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'localhost:8000';
  const version = require('../package.json').version;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (username.trim() && roomname.trim()) {
      // Store data in localStorage for use in chat page
      localStorage.setItem("username", username.trim());
      localStorage.setItem("roomname", roomname.trim());
      router.push(`/chat/${roomname.trim()}`);
    }
  };

  // Load values from localStorage on component mount
  useEffect(() => {
    // Only access localStorage on the client side
    const storedUsername = localStorage.getItem("username");
    const storedRoomname = localStorage.getItem("roomname");
    
    if (storedUsername) setUsername(storedUsername);
    if (storedRoomname) setRoomname(storedRoomname);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 rounded-lg border border-gray-700">
          <div className="card-body p-8">
            <div className="text-center mb-6">
              <img src="/logo.png" alt="Private Chat" className="w-10 h-10 mx-auto" />
              <h1 className="text-3xl font-bold mb-3 mt-3">
                Private Chat
              </h1>
              <p className="text-base-content/70">Join or create a private chat room</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Nickname</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="block p-2 border border-gray-500 rounded w-full focus:outline-none"
                  required
                />
              </div>
              
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Room</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={roomname}
                    onChange={(e) => setRoomname(e.target.value)}
                    placeholder="Enter room name"
                    className="block p-2 border border-gray-500 rounded-l w-full focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    className="p-2 border border-gray-500 rounded-r bg-gray-700 text-white hover:bg-gray-800 hover:cursor-pointer transition focus:outline-none"
                    onClick={() => setRoomname(Math.random().toString(36).substring(2).toUpperCase())}
                  >
                    Random
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
              >
                Join chat
              </button>

              {error && (
                <div className="mt-4 text-red-500 text-center">
                  {error}
                </div>
              )}

              <div className="text-center mt-6">
                Or join the <button className="link" onClick={() => setRoomname('lobby')}>#lobby</button>
              </div>
            </form>
          </div>
        </div>
        <div className="text-gray-400">
          <p className="flex justify-center gap-2 text-xs mt-4">
            <span>v{version}</span>
            <span>•</span>
            <span>Server: {serverUrl}</span>
          </p>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-blue-400 text-xs">
          <a href="/about" onClick={() => router.push('/about')}>
            About
          </a>
          <a href="https://github.com/CarlosLugones/private-chat-frontend" target="_blank">
            Code
          </a>
        </div>
      </div>
    </div>
  );
}
