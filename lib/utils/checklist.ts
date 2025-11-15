// Checklist utility functions

/**
 * Calculate checklist score based on completed items
 * @param completedCount Number of completed items
 * @param totalCount Total number of items
 * @returns Score between 0.00 and 5.00
 */
export function calculateChecklistScore(
  completedCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  const score = (completedCount / totalCount) * 5;
  return parseFloat(score.toFixed(2));
}

/**
 * Format checklist date to Turkish locale
 * @param date Date string or Date object
 * @returns Formatted date string
 */
export function formatChecklistDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validate checklist items
 * @param items Array of checklist items
 * @returns Validation result with error message if invalid
 */
export function validateChecklistItems(
  items: Array<{ id: string; text: string; order: number }>
): { valid: boolean; error?: string } {
  if (!Array.isArray(items)) {
    return { valid: false, error: 'Items must be an array' };
  }

  if (items.length === 0) {
    return { valid: false, error: 'At least one item is required' };
  }

  if (items.length > 50) {
    return { valid: false, error: 'Maximum 50 items allowed' };
  }

  for (const item of items) {
    if (!item.id || typeof item.id !== 'string') {
      return { valid: false, error: 'Each item must have a valid id' };
    }

    if (!item.text || typeof item.text !== 'string' || item.text.trim().length === 0) {
      return { valid: false, error: 'Each item must have non-empty text' };
    }

    if (item.text.length > 500) {
      return { valid: false, error: 'Item text must be less than 500 characters' };
    }

    if (typeof item.order !== 'number' || item.order < 1) {
      return { valid: false, error: 'Each item must have a valid order (>= 1)' };
    }
  }

  return { valid: true };
}

/**
 * Get color class based on score
 * @param score Score between 0 and 5
 * @returns Tailwind color classes
 */
export function getColorForScore(score: number): {
  text: string;
  bg: string;
  badge: string;
} {
  if (score >= 4.5) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      badge: 'bg-green-100 text-green-700',
    };
  }
  
  if (score >= 3.5) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      badge: 'bg-yellow-100 text-yellow-700',
    };
  }
  
  return {
    text: 'text-red-600',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
  };
}

/**
 * Calculate completion percentage
 * @param completedCount Number of completed items
 * @param totalCount Total number of items
 * @returns Percentage (0-100)
 */
export function calculateCompletionPercentage(
  completedCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}

/**
 * Get score label based on score value
 * @param score Score between 0 and 5
 * @returns Label string
 */
export function getScoreLabel(score: number): string {
  if (score >= 4.5) return 'Mükemmel';
  if (score >= 4.0) return 'Çok İyi';
  if (score >= 3.5) return 'İyi';
  if (score >= 3.0) return 'Orta';
  if (score >= 2.0) return 'Zayıf';
  return 'Çok Zayıf';
}
