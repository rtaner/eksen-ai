/**
 * Date utility functions for dashboard
 */

/**
 * Format date to relative time (e.g., "5 dakika önce", "dün", "2 gün önce")
 */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // Saniyeler
  if (diffInSeconds < 60) {
    return 'Az önce';
  }

  // Dakikalar
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  }

  // Saatler
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} saat önce`;
  }

  // Günler
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Dün';
  }
  if (diffInDays < 7) {
    return `${diffInDays} gün önce`;
  }

  // Haftalar
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} hafta önce`;
  }

  // Aylar
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ay önce`;
  }

  // Yıllar
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} yıl önce`;
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const today = new Date();
  const checkDate = new Date(date);

  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date): boolean {
  const now = new Date();
  const checkDate = new Date(date);

  // Set time to end of day for fair comparison
  now.setHours(23, 59, 59, 999);
  checkDate.setHours(23, 59, 59, 999);

  return checkDate < now;
}

/**
 * Format date to Turkish locale
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
