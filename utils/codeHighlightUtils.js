// Import only the core Prism functionality, not language components which can cause issues
import Prism from 'prismjs';

// Create safe known language list
const KNOWN_LANGUAGES = {
  'javascript': true,
  'jsx': true,
  'typescript': true,
  'tsx': true,
  'css': true,
  'python': true,
  'java': true,
  'c': true,
  'cpp': true,
  'csharp': true,
  'json': true,
  'markdown': true, 
  'bash': true,
  'yaml': true,
  'sql': true,
  'go': true,
  'rust': true,
  'php': true,
  // HTML is included in Prism core as 'markup'
  'markup': true,
  'html': 'markup',
  'xml': 'markup'
};

/**
 * Attempts to detect the language of the code
 * @param {string} code - The code to detect the language for
 * @returns {string} The detected language or 'javascript' as default
 */
export function detectLanguage(code) {
  // Simple language detection based on common patterns
  if (code.includes('<html') || code.includes('<div') || code.includes('<body')) {
    return 'markup';
  } else if (code.includes('import React') || code.includes('function(') || code.includes('=>') || code.includes('const ')) {
    return 'javascript';
  } else if (code.includes('class ') && code.includes('extends ') && code.includes('render()')) {
    return 'jsx';
  } else if (code.includes('interface ') || code.includes('type ') || code.includes(':') && code.includes('(') && code.includes(')')) {
    return 'typescript';
  } else if (code.includes('def ') && code.includes(':') && !code.includes('{')) {
    return 'python';
  } else if (code.includes('public class') || code.includes('private class')) {
    return 'java';
  } else if (code.includes('#include') && code.includes('<iostream>')) {
    return 'cpp';
  } else if (code.includes('package main') && code.includes('func ')) {
    return 'go';
  } else if (code.includes('<?php')) {
    return 'php';
  } else if (code.includes('SELECT') && code.includes('FROM') && code.includes('WHERE')) {
    return 'sql';
  } else if (code.includes('fn ') && code.includes('->') && code.includes('mut')) {
    return 'rust';
  } else if (code.startsWith('---') || (code.includes(':') && !code.includes('{'))) {
    return 'yaml';
  } else if (code.startsWith('```json') || (code.includes('{') && code.includes(':') && code.includes('"'))) {
    return 'json';
  } else if (code.includes('#!/bin/bash') || code.includes('apt-get') || code.includes('sudo ')) {
    return 'bash';
  }

  // Default to javascript
  return 'javascript';
}

/**
 * Safely determine the language to use for highlighting
 * @param {string} language - The requested language
 * @returns {string} A safe language to use 
 */
export function getSafeLanguage(language) {
  if (!language) return 'javascript';
  
  const lowerLang = language.toLowerCase();
  
  // Check if it's a known language or alias
  if (KNOWN_LANGUAGES[lowerLang]) {
    return typeof KNOWN_LANGUAGES[lowerLang] === 'string' 
      ? KNOWN_LANGUAGES[lowerLang]  // It's an alias
      : lowerLang;                  // It's a direct match
  }
  
  // Otherwise use javascript as fallback
  return 'javascript';
}

/**
 * Escapes HTML in a string to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - HTML escaped string
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Alternative fallback syntax highlighter that doesn't rely on Prism's language definitions
 * @param {string} code - The code to highlight
 * @param {string} language - The language
 * @returns {string} - HTML with basic syntax highlighting 
 */
function fallbackHighlight(code, language) {
  // Escape HTML first
  const escapedCode = escapeHTML(code);
  
  // Create an array of tokens with their types
  const tokens = [];
  let currentCode = escapedCode;
  
  // Define token types and their patterns
  const tokenTypes = [
    { type: 'comment', pattern: /\/\/.*?(?=\n|$)|\/\*[\s\S]*?\*\/|#.*?(?=\n|$)/g },
    { type: 'string', pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g },
    { type: 'keyword', pattern: /\b(if|else|for|while|function|return|var|let|const|class|import|export|from|extends|try|catch|finally)\b/g },
    { type: 'number', pattern: /\b\d+(\.\d+)?\b/g },
    { type: 'function', pattern: /\b\w+(?=\s*\()/g },
    { type: 'special', pattern: /[\{\}\[\]\(\)]/g }
  ];

  // Process the code to identify tokens
  let processedText = '';
  let lastIndex = 0;
  
  // Function to find the earliest match across all patterns
  function findNextToken(text, startIndex) {
    let earliestMatch = null;
    let matchType = null;
    
    for (const { type, pattern } of tokenTypes) {
      pattern.lastIndex = startIndex;
      const match = pattern.exec(text);
      if (match && (!earliestMatch || match.index < earliestMatch.index)) {
        earliestMatch = match;
        matchType = type;
      }
    }
    
    return { match: earliestMatch, type: matchType };
  }
  
  // Process the text to find tokens
  while (lastIndex < escapedCode.length) {
    const { match, type } = findNextToken(escapedCode, lastIndex);
    
    if (match) {
      // Add any text before this token
      if (match.index > lastIndex) {
        processedText += escapedCode.substring(lastIndex, match.index);
      }
      
      // Add the token with highlighting
      processedText += `<span class="token ${type}">${match[0]}</span>`;
      lastIndex = match.index + match[0].length;
    } else {
      // No more tokens found, add the rest of the text
      processedText += escapedCode.substring(lastIndex);
      break;
    }
  }
  
  return processedText || escapedCode;
}

/**
 * Simple syntax highlighting for code
 * @param {string} code - The code to highlight
 * @param {string} language - The language to use
 * @returns {string} HTML with syntax highlighting
 */
export function highlightCode(code, language = 'javascript') {
  try {
    // First try simplified direct fallback highlighting, which is safer
    return fallbackHighlight(code, language);
  } catch (error) {
    console.error('Error in highlightCode:', error);
    return escapeHTML(code); // Fallback to plain text
  }
}

/**
 * Handles copying code to clipboard
 * @param {string} code - The code to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyCodeToClipboard(code) {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch (error) {
    console.error('Error copying code to clipboard:', error);
    return false;
  }
}
