/**
 * Statistics calculation utilities for dashboard
 */

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Calculate average
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Format number with Turkish locale
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('tr-TR');
}

/**
 * Get sentiment color
 */
export function getSentimentColor(ratio: number): string {
  if (ratio >= 70) return 'text-green-600';
  if (ratio >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get rating color
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Format rating with stars
 */
export function formatRating(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  let stars = '⭐'.repeat(fullStars);
  if (hasHalfStar && fullStars < 5) {
    stars += '½';
  }
  
  return `${stars} (${rating.toFixed(1)})`;
}
