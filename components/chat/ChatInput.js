import React, { useState, useRef, useEffect } from "react";

/**
 * ChatInput - Component for the chat message input form
 * 
 * @param {Object} props
 * @param {string} props.message - The current message text
 * @param {Function} props.setMessage - Function to update message text
 * @param {Function} props.sendMessage - Function to handle form submission
 * @param {boolean} props.isConnected - Whether the WebSocket is connected
 * @param {Array} props.users - List of users for mention autocomplete
 */
const ChatInput = ({ message, setMessage, sendMessage, isConnected, users = [] }) => {
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(null);
  const inputRef = useRef(null);
  const mentionMenuRef = useRef(null);

  // Filter users based on the mention query
  const filteredUsers = users.filter(user => 
    user.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Check for mentions when message changes
  useEffect(() => {
    const lastAtIndex = message.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // If there's a space after the last @, or if @ is the first character in the message
      const isValidMention = lastAtIndex === 0 || message[lastAtIndex - 1] === ' ';
      
      if (isValidMention) {
        // Get the text after the @ symbol until a space (if any)
        const textAfterAt = message.slice(lastAtIndex + 1);
        const spaceIndex = textAfterAt.indexOf(' ');
        
        // If there's a space after the mention, hide the menu
        if (spaceIndex !== -1) {
          setShowMentionMenu(false);
          return;
        }
        
        // Otherwise show the mention menu with the query
        const query = textAfterAt;
        setMentionQuery(query);
        setMentionPosition(lastAtIndex);
        setShowMentionMenu(true);
        return;
      }
    }
    
    // Hide the mention menu if no @ detected or no longer valid
    setShowMentionMenu(false);
  }, [message]);

  // Close mention menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowMentionMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle clicking on a username in the mention menu
  const handleSelectMention = (username) => {
    if (mentionPosition !== null) {
      // Replace the @query with @username and add a space
      const beforeMention = message.slice(0, mentionPosition);
      const afterMention = message.slice(mentionPosition + mentionQuery.length + 1);
      
      const newMessage = `${beforeMention}@${username} ${afterMention}`;
      setMessage(newMessage);
      
      // Focus the input after selection
      inputRef.current.focus();
      
      // Close the mention menu
      setShowMentionMenu(false);
    }
  };

  return (
    <div className="p-4 bg-base-100 border-t border-gray-700 relative">
      <form onSubmit={sendMessage} className="flex">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            className="w-full p-2 border border-gray-500 rounded-l focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!isConnected}
          />
          
          {/* Mention autocomplete menu */}
          {showMentionMenu && filteredUsers.length > 0 && (
            <div 
              ref={mentionMenuRef}
              className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto bg-base-100 border border-gray-600 rounded-md shadow-lg z-10 animate__animated animate__fadeIn"
            >
              <ul>
                {filteredUsers.map((user) => (
                  <li 
                    key={user} 
                    className="px-4 py-2 hover:bg-base-300 cursor-pointer flex items-center"
                    onClick={() => handleSelectMention(user)}
                  >
                    <img 
                      src={`https://avatar.vercel.sh/${user}`} 
                      alt={`${user}'s avatar`} 
                      className="w-5 h-5 rounded-full mr-2" 
                    />
                    <span>{user}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="p-2 border border-gray-500 rounded-r bg-primary text-white hover:bg-primary-focus disabled:bg-gray-500"
          disabled={!isConnected}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
