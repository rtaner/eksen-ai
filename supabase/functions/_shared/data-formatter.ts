// Data formatting utilities for AI analysis

export interface Note {
  id: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  is_voice_note: boolean;
  created_at: string;
  author_id: string;
  group_id?: string | null;
  groups?: { name?: string } | null;
}

export interface Task {
  id: string;
  description: string;
  star_rating: number | null;
  completed_at: string | null;
  deadline: string;
  status: 'open' | 'closed';
  created_at: string;
  group_id?: string | null;
  groups?: { name?: string } | null;
}

export interface AuthorInfo {
  [key: string]: string; // author_id -> "Name Surname"
}

export interface ChecklistResult {
  id: string;
  checklist_snapshot: {
    title: string;
    description?: string;
    items?: Array<{ id: string; text: string; order: number }>;
  };
  completed_items: string[];
  score: number;
  closing_note?: string;
  completed_at: string;
  completed_by?: string;
}

/**
 * Format notes and tasks for Gemini prompt
 */
export function formatDataForPrompt(
  notes: Note[],
  tasks: Task[],
  checklistsOrAuthorNames?: ChecklistResult[] | AuthorInfo,
  authorNames?: AuthorInfo
): {
  notesJSON: string;
  tasksJSON: string;
  notesCount: number;
  closedTasksCount: number;
  checklistsCount: number;
} {
  let checklists: ChecklistResult[] = [];
  let actualAuthorNames: AuthorInfo = {};

  if (Array.isArray(checklistsOrAuthorNames)) {
    checklists = checklistsOrAuthorNames;
    actualAuthorNames = authorNames || {};
  } else if (checklistsOrAuthorNames) {
    actualAuthorNames = checklistsOrAuthorNames as AuthorInfo;
  }

  // Filter closed tasks only
  const closedTasks = tasks.filter((t) => t.status === 'closed' && t.star_rating);

  // Format notes for JSON
  const formattedNotes = notes.map((note) => {
    const groupName = note.groups?.name;
    return {
      tarih: new Date(note.created_at).toLocaleDateString('tr-TR'),
      tip: note.group_id ? 'grup_notu' : 'bireysel_not',
      kategori: groupName ? `Ekip Notu (${groupName})` : 'Bireysel Not',
      icerik: groupName ? `[${groupName} Grubu Notu]: ${note.content}` : note.content,
      duygu: note.sentiment === 'positive' ? 'olumlu' : note.sentiment === 'negative' ? 'olumsuz' : 'notr',
      giren_yonetici: actualAuthorNames[note.author_id] || 'Bilinmeyen',
      sesli_not: note.is_voice_note,
    };
  });

  // Format tasks for JSON
  const formattedTasks = closedTasks.map((task) => {
    const groupName = task.groups?.name;
    return {
      tarih: task.completed_at ? new Date(task.completed_at).toLocaleDateString('tr-TR') : '',
      tip: task.group_id ? 'grup_gorevi' : 'bireysel_gorev',
      kategori: groupName ? `Ekip Görevi (${groupName})` : 'Bireysel Görev',
      icerik: groupName ? `[${groupName} Grubu Görevi]: ${task.description}` : task.description,
      puan: task.star_rating,
    };
  });

  // Format checklists for JSON (including items completed/not completed details)
  const formattedChecklists = checklists.map((checklist) => {
    const itemsList = (checklist.checklist_snapshot?.items || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((item: any) => {
        const isCompleted = (checklist.completed_items || []).includes(item.id);
        return `- ${item.order}. ${item.text}: ${isCompleted ? '✓ Tamamlandı' : '✗ Tamamlanmadı'}`;
      })
      .join('\n');

    const content = `[Checklist: ${checklist.checklist_snapshot?.title || 'Checklist'}]
Maddeler:
${itemsList || 'Madde bulunmuyor'}
${checklist.closing_note ? 'Yönetici Notu: ' + checklist.closing_note : ''}`;

    return {
      tarih: new Date(checklist.completed_at).toLocaleDateString('tr-TR'),
      tip: 'checklist',
      icerik: content,
      puan: checklist.score || 0, // 0-5 scale
      degerlendiren: checklist.completed_by ? (actualAuthorNames[checklist.completed_by] || 'Bilinmeyen') : 'Sistem',
    };
  });

  // Combine and sort by date
  const allData = [...formattedNotes, ...formattedTasks, ...formattedChecklists].sort((a, b) => {
    const dateA = new Date(a.tarih.split('.').reverse().join('-'));
    const dateB = new Date(b.tarih.split('.').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  return {
    notesJSON: JSON.stringify({ veriler: allData }, null, 2),
    tasksJSON: JSON.stringify(formattedTasks, null, 2),
    notesCount: notes.length,
    closedTasksCount: closedTasks.length,
    checklistsCount: checklists.length,
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
