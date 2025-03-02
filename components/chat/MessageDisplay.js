import React from "react";
import { parseEmojis } from "../../utils/emojiUtils";

const MessageDisplay = ({ message }) => {
  const { text, username, timestamp } = message;
  const processedText = parseEmojis(text);
  
  return (
    <div className="message-container">
      <div className="flex items-start mb-4">
        <img 
          src={`https://avatar.vercel.sh/${username}`} 
          alt={`${username}'s avatar`} 
          className="w-8 h-8 rounded-full mr-2" 
        />
        <div className="flex-1">
          <div className="flex items-baseline">
            <span className="font-bold mr-2">{username}</span>
            <span className="text-xs text-gray-500">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          </div>
          {/* Simple text rendering without dangerouslySetInnerHTML for better security */}
          <div className="message-text">{processedText}</div>
        </div>
      </div>
    </div>
  );
};

export default MessageDisplay;
