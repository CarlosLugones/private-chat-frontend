import React from "react";

/**
 * ChatMessage - Component for rendering a single chat message
 * 
 * @param {Object} props
 * @param {Object} props.message - The message object to display
 * @param {boolean} props.isCurrentUser - Whether the message is from the current user
 */
const ChatMessage = ({ message, isCurrentUser }) => {
  const { system, username, content, timestamp } = message;
  
  // Determine chat position class based on message type
  const chatPositionClass = system ? 'chat-system' : (isCurrentUser ? 'chat-end' : 'chat-start');
  
  // Determine bubble style based on message type
  const bubbleClass = system 
    ? 'chat-bubble-system bg-gray-600' 
    : (isCurrentUser ? 'chat-bubble-primary' : 'chat-bubble-info');

  return (
    <div className={`chat ${chatPositionClass} animate__animated animate__fadeIn`}>
      {!system && (
        <div className="chat-image avatar">
          <div className="w-8 rounded-full">
            <img src={`https://avatar.vercel.sh/${username}`} alt={`${username}'s avatar`} />
          </div>
        </div>
      )}
      
      <div className="chat-header">
        {!system && (
          <>
            {username}
            <time className="text-xs opacity-50">
              {timestamp && new Date(timestamp).toLocaleTimeString()}
            </time>
          </>
        )}
      </div>
      
      <div className={`chat-bubble ${bubbleClass}`}>
        {content}
      </div>
      
      {!system && <div className="chat-footer opacity-50"></div>}
    </div>
  );
};

export default ChatMessage;
