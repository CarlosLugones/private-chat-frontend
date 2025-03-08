import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { detectLanguage, highlightCode, copyCodeToClipboard, getSafeLanguage } from '../../utils/codeHighlightUtils';
import ImageMessage from './ImageMessage';
import VideoMessage from './VideoMessage';

/**
 * Formats message text to highlight:
 * - URLs (makes them clickable)
 * - Room names (starting with #)
 * - Usernames (starting with @)
 * - Inline code (wrapped in single backticks)
 * - Code blocks (wrapped in triple backticks)
 * - Images (with special handling)
 * - Videos (with special handling)
 * - Preserves line breaks
 */
export default function FormattedMessage({ 
  text, 
  isImageMessage, 
  imageData, 
  imageCaption,
  isVideoMessage,
  videoData,
  videoCaption
}) {
  // Special handling for image messages
  if (isImageMessage && imageData) {
    return <ImageMessage imageData={imageData} caption={imageCaption} />;
  }
  
  // Special handling for video messages
  if (isVideoMessage) {
    console.log('FormattedMessage rendering video message with:', videoData ? 
      (typeof videoData === 'string' ? 'string data URL' : 
       'object with props: ' + Object.keys(videoData).join(', ')) 
    : 'missing');
    
    return <VideoMessage videoData={videoData} caption={videoCaption} />;
  }
  
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  // Add useEffect to load Prism styles
  useEffect(() => {
    // Load Prism styles on client-side only
    import('prismjs/themes/prism-tomorrow.css');
  }, []);
  
  if (!text) return null;
  
  // First, let's extract code blocks to prevent interference with other formatting
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const codeBlocks = [];
  let codeBlockCounter = 0;
  let processedText = text.replace(codeBlockRegex, (match, codeContent) => {
    const placeholderToken = `__CODE_BLOCK_${codeBlockCounter}__`;
    
    // Check for language specification in the first line
    let language = 'javascript'; // Default
    let actualCode = codeContent;
    
    const firstLineBreak = codeContent.indexOf('\n');
    if (firstLineBreak > 0) {
      const firstLine = codeContent.substring(0, firstLineBreak).trim();
      if (firstLine && !firstLine.includes(' ')) {
        language = firstLine;
        actualCode = codeContent.substring(firstLineBreak + 1);
      } else {
        language = detectLanguage(codeContent);
      }
    } else {
      language = detectLanguage(codeContent);
    }
    
    codeBlocks.push({ 
      code: actualCode, 
      language: getSafeLanguage(language) // Ensure we get a safe language 
    });
    codeBlockCounter++;
    return placeholderToken;
  });
  
  // Now extract inline code
  const inlineCodeRegex = /`([^`]+)`/g;
  const inlineCodes = [];
  let inlineCodeCounter = 0;
  processedText = processedText.replace(inlineCodeRegex, (match, codeContent) => {
    const placeholderToken = `__INLINE_CODE_${inlineCodeCounter}__`;
    inlineCodes.push(codeContent);
    inlineCodeCounter++;
    return placeholderToken;
  });
  
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
      const regexWithG = new RegExp(regex.source, regex.flags); // Create a new regex to reset lastIndex
      while ((match = regexWithG.exec(processedText)) !== null) {
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
    
    // Add placeholders for code blocks and inline code
    for (let i = 0; i < codeBlockCounter; i++) {
      const placeholder = `__CODE_BLOCK_${i}__`;
      const index = processedText.indexOf(placeholder);
      if (index !== -1) {
        allMatches.push({
          content: placeholder,
          index,
          length: placeholder.length,
          type: 'codeblock',
          id: i
        });
      }
    }
    
    for (let i = 0; i < inlineCodeCounter; i++) {
      const placeholder = `__INLINE_CODE_${i}__`;
      const index = processedText.indexOf(placeholder);
      if (index !== -1) {
        allMatches.push({
          content: placeholder,
          index,
          length: placeholder.length,
          type: 'inlinecode',
          id: i
        });
      }
    }
    
    // Sort matches by their position in the text
    return allMatches.sort((a, b) => a.index - b.index);
  };
  
  const matches = findAllMatches();
  
  // If no matches, return the original text with preserved line breaks
  if (matches.length === 0) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }
  
  const handleCopyCode = async (code, index, type) => {
    const success = await copyCodeToClipboard(code);
    if (success) {
      setCopiedIndex(`${type}-${index}`);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };
  
  // Build the result by interspersing text with matches
  const result = [];
  let lastIndex = 0;
  
  matches.forEach((match, idx) => {
    // Add text before the match (with preserved line breaks)
    if (match.index > lastIndex) {
      const textSegment = processedText.substring(lastIndex, match.index);
      result.push(
        <React.Fragment key={`text-${idx}`}>
          {textSegment.split('\n').map((line, i) => (
            <React.Fragment key={`line-${idx}-${i}`}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
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
      case 'inlinecode': {
        const code = inlineCodes[match.id];
        result.push(
          <span 
            key={`match-${idx}`}
            className="relative group"
          >
            <code 
              className="px-1.5 py-0.5 bg-gray-800 rounded font-mono text-sm text-green-300 border border-gray-700 cursor-pointer"
              onClick={() => handleCopyCode(code, match.id, 'inline')}
            >
              {code}
            </code>
            <span 
              className="absolute top-0 right-0 transform -translate-y-full bg-gray-800 text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" 
              onClick={() => handleCopyCode(code, match.id, 'inline')}
            >
              {copiedIndex === `inline-${match.id}` ? '✓ Copied!' : 'Copy'}
            </span>
          </span>
        );
        break;
      }
      case 'codeblock': {
        const { code, language } = codeBlocks[match.id];
        
        // Get highlighted code with extra safety
        let highlightedCode;
        try {
          highlightedCode = highlightCode(code, language);
        } catch (error) {
          console.error('Fallback to plain text due to error:', error);
          // Basic HTML escape as ultimate fallback
          highlightedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }
        
        result.push(
          <div 
            key={`match-${idx}`}
            className="relative my-2 w-full overflow-hidden"
          >
            <div className="flex justify-between items-center bg-gray-800 px-2 py-1 text-xs font-mono rounded-t border-t border-l border-r border-gray-700">
              <span className="text-green-400">{language}</span>
              <button 
                className="text-gray-400 hover:text-white px-2"
                onClick={() => handleCopyCode(code, match.id, 'block')}
              >
                {copiedIndex === `block-${match.id}` ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-900 p-3 overflow-x-auto rounded-b border-l border-r border-b border-gray-700">
              <code 
                className={`language-${language}`}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          </div>
        );
        break;
      }
    }
    
    // Update lastIndex to after this match
    lastIndex = match.index + match.length;
  });
  
  // Add any remaining text after the last match (with preserved line breaks)
  if (lastIndex < processedText.length) {
    const textSegment = processedText.substring(lastIndex);
    result.push(
      <React.Fragment key={`text-last`}>
        {textSegment.split('\n').map((line, i) => (
          <React.Fragment key={`line-last-${i}`}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  }
  
  return <div className="whitespace-pre-wrap">{result}</div>;
}
