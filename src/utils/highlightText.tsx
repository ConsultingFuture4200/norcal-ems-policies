import React from 'react';
import { Text, TextStyle } from 'react-native';

/**
 * Parse highlight markers from SQLite FTS5 output and render as React Native Text
 * with styled highlight spans.
 *
 * FTS5 uses our custom markers: <<HL>>matched text<</HL>>
 */
export function renderHighlightedText(
  text: string,
  baseStyle: TextStyle,
  highlightStyle: TextStyle,
): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(/(<<HL>>.*?<<\/HL>>)/g);

  return parts.map((part, index) => {
    if (part.startsWith('<<HL>>') && part.endsWith('<</HL>>')) {
      const highlighted = part.slice(6, -7); // Strip markers
      return (
        <Text key={index} style={[baseStyle, highlightStyle]}>
          {highlighted}
        </Text>
      );
    }
    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
}

/**
 * Simple client-side highlighting for cases where FTS5 highlighting
 * isn't available (e.g., fallback search results).
 */
export function highlightQuery(
  text: string,
  query: string,
  baseStyle: TextStyle,
  highlightStyle: TextStyle,
): React.ReactNode[] {
  if (!query || !text) {
    return [<Text key={0} style={baseStyle}>{text}</Text>];
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      regex.lastIndex = 0; // Reset after test
      return (
        <Text key={index} style={[baseStyle, highlightStyle]}>
          {part}
        </Text>
      );
    }
    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
}

/**
 * Extract a content snippet around the first match of a query.
 * Used when FTS5 snippet() isn't available.
 */
export function extractSnippet(
  content: string,
  query: string,
  contextChars: number = 120,
): string {
  if (!content || !query) return content?.slice(0, 200) || '';

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase().split(/\s+/)[0]; // First word
  const matchIndex = lowerContent.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return content.slice(0, 200) + (content.length > 200 ? '...' : '');
  }

  const start = Math.max(0, matchIndex - contextChars);
  const end = Math.min(content.length, matchIndex + lowerQuery.length + contextChars);

  let snippet = content.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}
