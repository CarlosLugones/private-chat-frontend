import React from 'react';
import Link from 'next/link';

/**
 * Formats message text to highlight:
 * - URLs (makes them clickable)
 * - Room names (starting with #)
 * - Usernames (starting with @)
 */
export default function FormattedMessage({ text }) {
  if (!text) return null;
  
  // Define regular expressions for patterns to highlight
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const roomRegex = /(#\w+)/g;
  const usernameRegex = /(@\w+)/g;
  
  // Find all matches with their positions and types
  const findAllMatches = () => {
    const allMatches = [];
    
    // Helper to extract all matches for a pattern
    const extractMatches = (regex, type) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          content: match[0],
          index: match.index,
          length: match[0].length,
          type
        });
      }
    };
    
    // Find all matches for each pattern
    extractMatches(urlRegex, 'url');
    extractMatches(roomRegex, 'room');
    extractMatches(usernameRegex, 'username');
    
    // Sort matches by their position in the text
    return allMatches.sort((a, b) => a.index - b.index);
  };
  
  const matches = findAllMatches();
  
  // If no matches, return the original text
  if (matches.length === 0) {
    return <>{text}</>;
  }
  
  // Build the result by interspersing text with matches
  const result = [];
  let lastIndex = 0;
  
  matches.forEach((match, idx) => {
    // Add text before the match
    if (match.index > lastIndex) {
      result.push(
        <React.Fragment key={`text-${idx}`}>
          {text.substring(lastIndex, match.index)}
        </React.Fragment>
      );
    }
    
    // Add the styled match
    switch (match.type) {
      case 'url':
        result.push(
          <a 
            key={`match-${idx}`}
            href={match.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline transition-colors duration-200"
          >
            {match.content}
          </a>
        );
        break;
      case 'room':
        result.push(
          <span 
            key={`match-${idx}`}
            className="text-green-400 font-medium px-1 py-0.5 bg-green-900/20 rounded hover:bg-green-900/30 transition-colors duration-200 cursor-pointer"
          >
            <Link href={`/chat/${match.content.substring(1)}`}>
              {match.content}
            </Link>
          </span>
        );
        break;
      case 'username':
        result.push(
          <span 
            key={`match-${idx}`}
            className="text-purple-300 font-medium px-1 py-0.5 bg-purple-700/20 rounded hover:bg-green-700/30 transition-colors duration-200 cursor-pointer"
          >
            {match.content}
          </span>
        );
        break;
    }
    
    // Update lastIndex to after this match
    lastIndex = match.index + match.length;
  });
  
  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    result.push(
      <React.Fragment key={`text-last`}>
        {text.substring(lastIndex)}
      </React.Fragment>
    );
  }
  
  return <>{result}</>;
}
