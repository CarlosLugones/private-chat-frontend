import React from "react";
import { useState } from "react";
import ReactPlayer from "react-player";

export default function VideoPlayer({ url }) {
  return (
    <div>
      <ReactPlayer url={url} playing={false} loop={false} muted={false} width="100%" height="auto" />
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <a href={url} target="_blank" className="text-blue-400 hover:underline transition-colors duration-200" rel="noopener noreferrer">
          {url}
          </a>
      </div>
    </div>
  );
}
