"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [username, setUsername] = useState("");
  const [roomname, setRoomname] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (username.trim() && roomname.trim()) {
      // Store data in localStorage for use in chat page
      localStorage.setItem("username", username.trim());
      localStorage.setItem("roomname", roomname.trim());

      // Connect to websocket
      if (process.env.NEXT_PUBLIC_SITE_URL === undefined) {
        console.error("NEXT_PUBLIC_SITE_URL is not defined in .env.local");
        setError("Configuration error. Please try again later.");
        return;
      }

      let ws = null;
      try {
        if (process.env.NODE_ENV === 'development') {
          ws = new WebSocket(`ws://localhost:3000/api/ws`);
        } else {
          ws = new WebSocket(`wss://${process.env.NEXT_PUBLIC_SITE_URL}/api/ws`);
        }

        ws.onopen = () => {
          console.log("WebSocket connected successfully");
          ws.send(
            JSON.stringify(
              {
                  type: "join",
                  username: username.trim(),
                  roomname: roomname.trim() 
              }
            )
          );
          
          // Navigate to the chat page after connection is established
          router.push(`/chat/${roomname.trim()}`);
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("Failed to connect to the chat server. Please try again.");
        };
      } catch (error) {
        console.error("WebSocket connection error:", error);
        setError("Failed to connect to the chat server. Please try again.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 rounded-lg border border-gray-700">
          <div className="card-body p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">
                Shhhhh 🤫
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
      </div>
    </div>
  );
}
