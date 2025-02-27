"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [username, setUsername] = useState("");
  const [roomname, setRoomname] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (username.trim() && roomname.trim()) {
      // Store data in localStorage for use in chat page
      localStorage.setItem("username", username.trim());
      localStorage.setItem("roomname", roomname.trim());
      
      // Navigate to the chat page (you'd need to create this page)
      router.push("/chat/" + roomname.trim());
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
