import React from "react";

/**
 * ChatInput - Component for the chat message input form
 * 
 * @param {Object} props
 * @param {string} props.message - The current message text
 * @param {Function} props.setMessage - Function to update message text
 * @param {Function} props.sendMessage - Function to handle form submission
 * @param {boolean} props.isConnected - Whether the WebSocket is connected
 */
const ChatInput = ({ message, setMessage, sendMessage, isConnected }) => {
  return (
    <div className="bg-base-100 p-4 border-t border-gray-700">
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="block p-2 border border-gray-500 rounded-md w-full focus:outline-none"
          disabled={!isConnected}
          aria-label="Message input"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isConnected}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
