import React, { useState } from 'react';
import { parseEmojis, checkEmoji } from '../../utils/emojiUtils';

const EmojiDebug = () => {
  const [shortcode, setShortcode] = useState(':heart:');
  const [debugInfo, setDebugInfo] = useState(null);
  const [testText, setTestText] = useState('Try :fire: and :heart: and :rocket: and :pizza:');
  const [renderedText, setRenderedText] = useState('');
  
  const checkShortcode = () => {
    const info = checkEmoji(shortcode);
    setDebugInfo(info);
  };
  
  const testParsing = () => {
    const rendered = parseEmojis(testText);
    setRenderedText(rendered);
  };
  
  return (
    <div className="bg-base-200 p-4 rounded border border-gray-700 mt-4">
      <h3 className="text-lg font-bold mb-3">Emoji Debug Tool</h3>
      
      <div className="mb-4">
        <label className="block mb-1">Check Emoji Shortcode:</label>
        <div className="flex">
          <input
            type="text"
            value={shortcode}
            onChange={(e) => setShortcode(e.target.value)}
            className="p-2 border border-gray-500 rounded-l"
          />
          <button
            onClick={checkShortcode}
            className="bg-primary text-white px-3 py-2 rounded-r"
          >
            Check
          </button>
        </div>
        
        {debugInfo && (
          <div className="mt-2 p-2 bg-base-300 rounded">
            <p><strong>Shortcode:</strong> {debugInfo.shortcode}</p>
            <p><strong>Found:</strong> {debugInfo.found ? 'Yes' : 'No'}</p>
            <p><strong>Emoji:</strong> {debugInfo.emoji || 'Not found'}</p>
            <p><strong>Total Emojis:</strong> {debugInfo.mapSize}</p>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Test Emoji Parsing:</label>
        <div>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-2 border border-gray-500 rounded mb-2"
            rows={3}
          />
          <button
            onClick={testParsing}
            className="bg-primary text-white px-3 py-2 rounded"
          >
            Parse
          </button>
        </div>
        
        {renderedText && (
          <div className="mt-2 p-2 bg-base-300 rounded">
            <p><strong>Rendered Text:</strong></p>
            <p className="text-lg">{renderedText}</p>
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500">
        This tool helps diagnose emoji rendering issues. Try shortcodes like :heart:, :rocket:, etc.
      </div>
    </div>
  );
};

export default EmojiDebug;
