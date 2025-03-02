import React, { useState, useEffect } from 'react';
import { searchEmojis, getFullEmojiMap } from '../../utils/emojiUtils';

const EmojiPicker = ({ onSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState('frequent');
  
  // Common categories with a few examples for each
  const categoryEmojis = {
    frequent: [':fire:', ':heart:', ':thumbsup:', ':smile:', ':rocket:', ':100:'],
    smileys: [':smile:', ':joy:', ':thinking:', ':sunglasses:', ':wink:', ':unamused:'],
    nature: [':sunny:', ':umbrella:', ':cloud:', ':snowflake:', ':zap:', ':earth_americas:'],
    food: [':pizza:', ':hamburger:', ':taco:', ':sushi:', ':coffee:', ':cake:'],
    activities: [':soccer:', ':basketball:', ':football:', ':tennis:', ':video_game:', ':trophy:'],
    travel: [':car:', ':airplane:', ':train:', ':boat:', ':rocket:', ':map:'],
    objects: [':bulb:', ':book:', ':computer:', ':camera:', ':lock:', ':key:'],
    symbols: [':heart:', ':arrow_right:', ':exclamation:', ':question:', ':100:', ':sparkles:']
  };
  
  // Initialize emoji categories on load
  useEffect(() => {
    const emojiMap = getFullEmojiMap();
    const categorizedEmojis = {};
    
    // For each category, get the full emoji data
    Object.entries(categoryEmojis).forEach(([category, shortcodes]) => {
      categorizedEmojis[category] = shortcodes
        .map(code => ({ 
          shortcode: code, 
          emoji: emojiMap[code.toLowerCase()] || '❓' 
        }))
        .filter(item => item.emoji !== '❓');
    });
    
    setCategories(categorizedEmojis);
  }, []);
  
  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const results = searchEmojis(searchQuery);
      setResults(results);
    } else {
      setResults([]);
    }
  }, [searchQuery]);
  
  const handleEmojiClick = (emoji) => {
    if (onSelect) {
      onSelect(emoji);
    }
  };
  
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSearchQuery('');
  };
  
  return (
    <div className="emoji-picker bg-base-200 border border-gray-600 rounded shadow-lg p-2 w-72">
      {/* Search bar */}
      <div className="mb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full p-1 text-sm border border-gray-500 rounded"
        />
      </div>
      
      {/* Category tabs */}
      {!searchQuery && (
        <div className="category-tabs overflow-x-auto flex space-x-1 mb-2">
          {Object.keys(categories).map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-2 py-1 text-xs rounded ${
                activeCategory === category ? 'bg-base-300' : 'hover:bg-base-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      )}
      
      {/* Emoji grid */}
      <div className="emoji-grid max-h-48 overflow-y-auto">
        {searchQuery ? (
          results.length > 0 ? (
            <div className="grid grid-cols-8 gap-1">
              {results.map(({ shortcode, emoji }) => (
                <button 
                  key={shortcode}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl hover:bg-base-300 rounded p-1"
                  title={shortcode}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-2">No emojis found</p>
          )
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {categories[activeCategory]?.map(({ shortcode, emoji }) => (
              <button 
                key={shortcode}
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl hover:bg-base-300 rounded p-1"
                title={shortcode}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {onClose && (
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-600">
          <span className="text-xs text-gray-500">Type :emoji-name: in chat</span>
          <button 
            onClick={onClose}
            className="text-xs text-gray-300 hover:text-white"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
