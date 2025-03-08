/**
 * @module EmojiUtils
 * @description Utilities for handling emoji shortcodes and replacement in text
 */

import data from '@emoji-mart/data'
import { init } from 'emoji-mart'

// Initialize emoji-mart with data
init({ data })

/**
 * Common emoji shortcuts for quick replacement
 * Uncomment or add shortcuts as needed
 */
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

/**
 * Essential emojis that should always be available
 * These emojis are prioritized in search results and guaranteed to work
 */
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

/**
 * Configuration options for the emoji utility
 */
export const emojiConfig = {
  maxSearchResults: 24,
  enableShortcuts: true,
  enableDebug: false,
  customEmojis: {} // Add your custom emojis here
};

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build complete emoji mapping from emoji-mart data
let fullEmojiMap = null;
let lastBuildTime = null;

/**
 * Builds a complete mapping of emoji shortcodes to their native representations
 */
const buildEmojiMap = () => {
  // Use cached version if available
  if (fullEmojiMap) return fullEmojiMap;
  
  const startTime = emojiConfig.enableDebug ? performance.now() : null;
  fullEmojiMap = { 
    ...essentialEmojis,
    ...emojiConfig.customEmojis 
  }; // Start with our essential emojis
  
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
    // Still return what we have even if there was an error
  }
  
  // Add performance logging if debug is enabled
  if (emojiConfig.enableDebug) {
    const endTime = performance.now();
    console.log(`Emoji map built in ${(endTime - startTime).toFixed(2)}ms with ${Object.keys(fullEmojiMap).length} entries`);
    lastBuildTime = new Date();
  }
  
  // Merge with our shortcuts if enabled
  return emojiConfig.enableShortcuts 
    ? { ...fullEmojiMap, ...emojiShortcuts }
    : fullEmojiMap;
};

/**
 * Debug function to check if an emoji is available
 * @param {string} code - Emoji shortcode to check
 * @returns {Object} Information about the emoji availability
 */
export const checkEmoji = (code) => {
  const map = buildEmojiMap();
  const shortcode = code.startsWith(':') ? code.toLowerCase() : `:${code.toLowerCase()}:`;
  return { 
    shortcode, 
    emoji: map[shortcode] || null,
    found: !!map[shortcode],
    mapSize: Object.keys(map).length,
    lastBuildTime
  };
};

/**
 * Handle shortcode replacement in text input
 * @param {string} text - Text that may contain emoji shortcodes
 * @returns {string} Text with shortcodes replaced by emoji characters
 */
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

/**
 * Parse text with emoji shortcodes for rendering
 * @param {string} text - Text that may contain emoji shortcodes
 * @returns {string} Text with emojis rendered
 */
export const parseEmojis = (text) => {
  if (!text) return '';
  return handleEmojiShortcodes(text);
};

// Cache for search results to improve performance
const searchCache = new Map();

/**
 * Search for emojis by shortcode query
 * @param {string} query - Search term for finding emojis
 * @returns {Array<{shortcode: string, emoji: string}>} Array of matching emoji objects
 */
export const searchEmojis = (query) => {
  if (!query || query.length < 2) return [];
  
  const sanitizedQuery = query.toLowerCase();
  
  // Check cache first
  const cacheKey = `query_${sanitizedQuery}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }
  
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
  
  // Cache and return results (implementation remains the same)
  const results = [...essentialMatches, ...allMatches].slice(0, emojiConfig.maxSearchResults);
  searchCache.set(cacheKey, results);
  return results;
};

// Export relevant functions
export { buildEmojiMap as getFullEmojiMap };
