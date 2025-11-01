// Data formatting utilities for AI analysis

export interface Note {
  id: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  is_voice_note: boolean;
  created_at: string;
  author_id: string;
}

export interface Task {
  id: string;
  description: string;
  star_rating: number | null;
  completed_at: string | null;
  deadline: string;
  status: 'open' | 'closed';
  created_at: string;
}

export interface AuthorInfo {
  [key: string]: string; // author_id -> "Name Surname"
}

/**
 * Format notes and tasks for Gemini prompt
 */
export function formatDataForPrompt(
  notes: Note[],
  tasks: Task[],
  authorNames: AuthorInfo
): {
  notesJSON: string;
  tasksJSON: string;
  notesCount: number;
  closedTasksCount: number;
} {
  // Filter closed tasks only
  const closedTasks = tasks.filter((t) => t.status === 'closed' && t.star_rating);

  // Format notes for JSON
  const formattedNotes = notes.map((note) => ({
    tarih: new Date(note.created_at).toLocaleDateString('tr-TR'),
    tip: 'not',
    icerik: note.content,
    duygu: note.sentiment === 'positive' ? 'olumlu' : note.sentiment === 'negative' ? 'olumsuz' : 'notr',
    giren_yonetici: authorNames[note.author_id] || 'Bilinmeyen',
    sesli_not: note.is_voice_note,
  }));

  // Format tasks for JSON
  const formattedTasks = closedTasks.map((task) => ({
    tarih: task.completed_at ? new Date(task.completed_at).toLocaleDateString('tr-TR') : '',
    tip: 'görev',
    icerik: task.description,
    puan: task.star_rating,
  }));

  // Combine and sort by date
  const allData = [...formattedNotes, ...formattedTasks].sort((a, b) => {
    const dateA = new Date(a.tarih.split('.').reverse().join('-'));
    const dateB = new Date(b.tarih.split('.').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  return {
    notesJSON: JSON.stringify({ veriler: allData }, null, 2),
    tasksJSON: JSON.stringify(formattedTasks, null, 2),
    notesCount: notes.length,
    closedTasksCount: closedTasks.length,
  };
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startFormatted = start.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  
  const endFormatted = end.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Calculate sentiment distribution
 */
export function calculateSentimentDistribution(notes: Note[]): {
  olumlu: number;
  olumsuz: number;
  notr: number;
} {
  return notes.reduce(
    (acc, note) => {
      if (note.sentiment === 'positive') acc.olumlu++;
      else if (note.sentiment === 'negative') acc.olumsuz++;
      else acc.notr++;
      return acc;
    },
    { olumlu: 0, olumsuz: 0, notr: 0 }
  );
}

/**
 * Calculate average task rating
 */
export function calculateAverageRating(tasks: Task[]): number | null {
  const closedTasksWithRating = tasks.filter(
    (t) => t.status === 'closed' && t.star_rating !== null
  );

  if (closedTasksWithRating.length === 0) return null;

  const sum = closedTasksWithRating.reduce(
    (acc, task) => acc + (task.star_rating || 0),
    0
  );

  return sum / closedTasksWithRating.length;
}
