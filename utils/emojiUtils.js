import data from '@emoji-mart/data'
import { init } from 'emoji-mart'

// Initialize emoji-mart with data
init({ data })

// Common emoji shortcuts for quick replacement
const emojiShortcuts = {
  // ':)': '😊',
  // ':(': '😔',
  // ':|': '😐',
  // ';)': '😉',
  // ':*': '😘',
  // '<3': '❤️',
  // '(y)': '👍',
  // '(n)': '👎',
};

// Essential emojis that should always be available
const essentialEmojis = {
  ':heart:': '❤️',
  ':fire:': '🔥',
  ':thumbsup:': '👍', 
  ':thumbsdown:': '👎',
  ':rocket:': '🚀',
  ':star:': '⭐',
  ':smile:': '😊',
  ':laughing:': '😆',
  ':joy:': '😂',
  ':pizza:': '🍕',
  ':tada:': '🎉',
  ':wave:': '👋',
  ':100:': '💯',
  ':thinking:': '🤔',
  ':eyes:': '👀',
  ':sunglasses:': '😎',
};

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build complete emoji mapping from emoji-mart data
let fullEmojiMap = null;

const buildEmojiMap = () => {
  if (fullEmojiMap) return fullEmojiMap;
  
  fullEmojiMap = { ...essentialEmojis }; // Start with our essential emojis
  
  try {
    // Process all emojis from emoji-mart data
    if (data && data.emojis) {
      console.log('Processing emoji data...');
      
      // Try different ways to access emoji data depending on how it's structured
      Object.entries(data.emojis).forEach(([key, emoji]) => {
        let shortcodes = [];
        let native = null;
        
        // Handle different structures in emoji-mart data
        if (emoji.shortcodes) {
          shortcodes = Array.isArray(emoji.shortcodes) ? emoji.shortcodes : [emoji.shortcodes];
        } else if (emoji.id) {
          // Some versions structure it differently
          shortcodes = [emoji.id];
        }
        
        // Find the native emoji representation
        if (emoji.skins && emoji.skins[0] && emoji.skins[0].native) {
          native = emoji.skins[0].native;
        } else if (emoji.native) {
          native = emoji.native;
        }
        
        // Add all shortcodes to our map if we have a native representation
        if (native && shortcodes.length > 0) {
          shortcodes.forEach(code => {
            const shortcode = `:${code}:`;
            fullEmojiMap[shortcode.toLowerCase()] = native;
          });
        }
      });
    }
  } catch (error) {
    console.error('Error processing emoji data:', error);
  }
  
  // Merge with our shortcuts
  return { ...fullEmojiMap, ...emojiShortcuts };
};

// Debug function to check if emoji is available
export const checkEmoji = (code) => {
  const map = buildEmojiMap();
  const shortcode = code.startsWith(':') ? code.toLowerCase() : `:${code.toLowerCase()}:`;
  return { 
    shortcode, 
    emoji: map[shortcode] || null,
    found: !!map[shortcode],
    mapSize: Object.keys(map).length
  };
};

// Handle shortcode replacement in text input with special emphasis on common emojis
export const handleEmojiShortcodes = (text) => {
  if (!text) return '';
  
  let result = text;
  const emojis = buildEmojiMap();
  
  // First replace simple shortcuts (like :) and :D)
  Object.entries(emojiShortcuts).forEach(([shortcode, emoji]) => {
    const escapedShortcode = escapeRegExp(shortcode);
    result = result.replace(new RegExp(escapedShortcode, 'g'), emoji);
  });
  
  // Then directly handle essential emojis to ensure they always work
  Object.entries(essentialEmojis).forEach(([shortcode, emoji]) => {
    // Use case-insensitive replacements for essential emojis
    const escapedShortcode = escapeRegExp(shortcode);
    result = result.replace(new RegExp(escapedShortcode, 'gi'), emoji);
  });
  
  // Finally, try standard emoji shortcodes from the full map
  result = result.replace(/:([-+_a-z0-9]+):/gi, (match) => {
    return emojis[match.toLowerCase()] || match;
  });
  
  return result;
};

// Parse text with emoji shortcodes for rendering
export const parseEmojis = (text) => {
  if (!text) return '';
  return handleEmojiShortcodes(text);
};

// For emoji suggestions - now returns complete results from the full emoji set
export const searchEmojis = (query) => {
  if (!query || query.length < 2) return [];
  
  const sanitizedQuery = query.toLowerCase();
  const emojis = buildEmojiMap();
  
  // First prioritize essential emojis that match the query
  const essentialMatches = Object.entries(essentialEmojis)
    .filter(([shortcode]) => shortcode.toLowerCase().includes(sanitizedQuery))
    .map(([shortcode, emoji]) => ({ shortcode, emoji }));
  
  // Then get matches from the full emoji set
  const allMatches = Object.entries(emojis)
    .filter(([shortcode]) => 
      shortcode.toLowerCase().includes(sanitizedQuery) &&
      shortcode.startsWith(':') && // Only include standard :code: format in search results
      !essentialEmojis[shortcode] // Don't duplicate essentials
    )
    .map(([shortcode, emoji]) => ({ shortcode, emoji }));
  
  // Combine and limit results
  return [...essentialMatches, ...allMatches].slice(0, 24);
};

// Export relevant functions
export { buildEmojiMap as getFullEmojiMap };
