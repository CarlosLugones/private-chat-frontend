import React, { useState, useRef, useEffect } from "react";
import { handleEmojiShortcodes } from "../../utils/emojiUtils";
import EmojiPicker from "./EmojiPicker";

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(40); // Default height

  // Filter users based on the mention query
  const filteredUsers = users.filter(user => 
    user.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle message input changes with emoji conversion
  const handleMessageChange = (e) => {
    const newMessage = handleEmojiShortcodes(e.target.value);
    setMessage(newMessage);
    
    // Auto-adjust textarea height based on content
    adjustTextareaHeight();
  };
  
  // Handle key press events for multi-line support
  const handleKeyPress = (e) => {
    // If Enter is pressed without Shift, submit the form
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      if (message.trim()) {
        // Call sendMessage with the event
        // The message is already in the state, so no need to pass it
        sendMessage(e);
      }
    }
    // If Enter is pressed with Shift, allow new line (default behavior)
  };
  
  // Auto-adjust textarea height based on content
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      // Reset height temporarily to get proper scrollHeight calculation
      inputRef.current.style.height = '40px'; // Start with default height
      
      // Get scrollHeight and set max height to prevent extremely tall textareas
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 150;
      
      // Only expand if content actually needs more space
      const newHeight = scrollHeight > 40 ? Math.min(scrollHeight, maxHeight) : 40;
      
      // Update state and set height
      setTextareaHeight(newHeight);
      inputRef.current.style.height = `${newHeight}px`;
      
      // If content exceeds max height, enable scrolling
      if (scrollHeight > maxHeight) {
        inputRef.current.style.overflowY = 'auto';
      } else {
        inputRef.current.style.overflowY = 'hidden';
      }
    }
  };

  // Force an immediate adjustment after render and when message changes
  useEffect(() => {
    if (message) {
      // Only adjust when there's actual content
      setTimeout(adjustTextareaHeight, 0);
    } else {
      // Reset to default height when empty
      setTextareaHeight(40);
      if (inputRef.current) {
        inputRef.current.style.height = '40px';
        inputRef.current.style.overflowY = 'hidden';
      }
    }
  }, [message]);

  // Handle emoji selection from picker
  const handleEmojiSelect = (emoji) => {
    // Insert emoji at cursor position or at the end
    const cursorPosition = inputRef.current?.selectionStart || message.length;
    const updatedMessage = 
      message.substring(0, cursorPosition) + 
      emoji + 
      message.substring(cursorPosition);
    
    setMessage(updatedMessage);
    
    // Focus back on input after adding emoji
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = cursorPosition + emoji.length;
        inputRef.current.selectionEnd = cursorPosition + emoji.length;
      }
    }, 10);
  };

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
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-20">
          <EmojiPicker 
            onSelect={handleEmojiSelect} 
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
      
      <form onSubmit={e => { e.preventDefault(); sendMessage(e); }} className="flex items-stretch">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(prev => !prev)}
          className="px-3 mr-1 border border-gray-500 rounded-l bg-base-200 text-base-content hover:bg-base-300 transition-colors flex items-center justify-center min-w-[40px]"
          style={{ height: `${textareaHeight}px` }}
        >
          😊
        </button>
        
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            className="w-full px-3 py-2 border border-gray-500 rounded-none focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            disabled={!isConnected}
            style={{ 
              height: `${textareaHeight}px`,
              minHeight: '40px',
              lineHeight: '1.5'
            }}
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
          className="px-3 border border-gray-500 rounded-r bg-primary text-white hover:bg-primary-focus disabled:bg-gray-500 flex items-center justify-center min-w-[50px]"
          disabled={!isConnected || !message.trim()}
          style={{ height: `${textareaHeight}px` }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
