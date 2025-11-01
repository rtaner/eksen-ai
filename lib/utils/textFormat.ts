/**
 * Capitalize the first letter of a string
 * @param text - The text to capitalize
 * @returns The text with the first letter capitalized
 */
export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Capitalize the first letter of each word in a string
 * @param text - The text to capitalize
 * @returns The text with the first letter of each word capitalized
 */
export function capitalizeWords(text: string): string {
  if (!text) return text;
  return text
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
}
