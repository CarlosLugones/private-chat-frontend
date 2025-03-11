import React from "react";
import { useState } from "react";
import ReactPlayer from "react-player";

export default function VideoPlayer({ url }) {
  const [showModal, setShowModal] = useState(false);
  console.log(showModal)
  return (
    <div className="max-w-md p-4  rounded-lg  bg-transparent relative" onClick={()=>setShowModal(!showModal)}>
      <div className="cursor-pointer" onClick={() => setShowModal(true)}>
        <ReactPlayer url={url} playing={true} loop={true} muted={true} width="100%" height="auto" />
      </div>
      
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg max-w-3xl w-full h-100 relative">
            <button className="absolute top-1 right-0.5 bg-blue-700 p-2 w-10 h-10 rounded-full" onClick={() => setShowModal(false)}>✕</button>
            <ReactPlayer url={url} playing={true} controls={true} width="100%" height="100%" />
          </div>
        </div>
      )}
    </div>
  );
}
