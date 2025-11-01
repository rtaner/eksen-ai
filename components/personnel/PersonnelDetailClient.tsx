'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Personnel, Note, Task } from '@/lib/types';
import { useRealtime } from '@/lib/hooks/useRealtime';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { createClient } from '@/lib/supabase/client';
import { capitalizeFirst } from '@/lib/utils/textFormat';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import NoteForm from '@/components/notes/NoteForm';
import ActivityFeed from '@/components/tasks/ActivityFeed';
import TaskForm from '@/components/tasks/TaskForm';
import TaskCloseModal from '@/components/tasks/TaskCloseModal';

interface PersonnelDetailClientProps {
  personnel: Personnel;
}

export default function PersonnelDetailClient({
  personnel,
}: PersonnelDetailClientProps) {
  const supabase = createClient();
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete, isOwner: isOwnerRole } = usePermissions();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [closingTask, setClosingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Fetch data function
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Create fresh client instance to avoid stale session
      const freshClient = createClient();

      // Fetch notes
      const { data: notesData, error: notesError } = await freshClient
        .from('notes')
        .select('*')
        .eq('personnel_id', personnel.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch all tasks (open and closed)
      const { data: tasksData, error: tasksError } = await freshClient
        .from('tasks')
        .select('*')
        .eq('personnel_id', personnel.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setNotes(notesData || []);
      setTasks(tasksData || []);

      // Fetch author names (from both notes and tasks)
      const noteAuthorIds = notesData?.map((n) => n.author_id) || [];
      const taskAuthorIds = tasksData?.filter((t) => t.author_id).map((t) => t.author_id!) || [];
      const allAuthorIds = [...new Set([...noteAuthorIds, ...taskAuthorIds])];

      if (allAuthorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await freshClient
          .from('profiles')
          .select('id, name, surname')
          .in('id', allAuthorIds);

        if (profilesError) throw profilesError;

        const names: Record<string, string> = {};
        profilesData?.forEach((p) => {
          names[p.id] = `${p.name} ${p.surname}`;
        });
        setAuthorNames(names);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [personnel.id]);

  // Real-time subscription for notes
  useRealtime({
    table: 'notes',
    filter: `personnel_id=eq.${personnel.id}`,
    onInsert: async (newNote: Note) => {
      setNotes((prev) => [newNote, ...prev]);
      
      // Fetch author name if not already cached
      if (!authorNames[newNote.author_id]) {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, surname')
          .eq('id', newNote.author_id)
          .single();
        
        if (data) {
          setAuthorNames((prev) => ({
            ...prev,
            [data.id]: `${data.name} ${data.surname}`,
          }));
        }
      }
    },
    onUpdate: (updatedNote: Note) => {
      setNotes((prev) =>
        prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
      );
    },
    onDelete: (deletedNote: Note) => {
      setNotes((prev) => prev.filter((note) => note.id !== deletedNote.id));
    },
  });

  // Real-time subscription for tasks
  useRealtime({
    table: 'tasks',
    filter: `personnel_id=eq.${personnel.id}`,
    onInsert: async (newTask: Task) => {
      setTasks((prev) => [newTask, ...prev]);
      
      // Fetch author name if not already cached and author_id exists
      if (newTask.author_id && !authorNames[newTask.author_id]) {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, surname')
          .eq('id', newTask.author_id)
          .single();
        
        if (data) {
          setAuthorNames((prev) => ({
            ...prev,
            [data.id]: `${data.name} ${data.surname}`,
          }));
        }
      }
    },
    onUpdate: (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
    },
    onDelete: (deletedTask: Task) => {
      setTasks((prev) => prev.filter((task) => task.id !== deletedTask.id));
    },
  });

  const handleNoteSuccess = () => {
    setIsNoteModalOpen(false);
    setEditingNote(null);
    fetchData();
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleDeleteNote = (note: Note) => {
    setDeletingNote(note);
  };

  const confirmDelete = async () => {
    if (!deletingNote) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', deletingNote.id);

      if (error) throw error;

      setDeletingNote(null);
      // Manually update the list (real-time might be delayed)
      setNotes((prev) => prev.filter((note) => note.id !== deletingNote.id));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Not silinirken bir hata oluştu');
    }
  };

  const handleTaskSuccess = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    fetchData();
  };

  const handleCloseTask = (task: Task) => {
    setClosingTask(task);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
  };

  const confirmDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', deletingTask.id);

      if (error) throw error;

      setDeletingTask(null);
      // Manually update the list (real-time might be delayed)
      setTasks((prev) => prev.filter((task) => task.id !== deletingTask.id));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Görev silinirken bir hata oluştu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Personnel info card with action buttons */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Personnel info with back button */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Link href="/personnel">
                  <Button variant="secondary" size="sm">
                    ← Geri
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  {capitalizeFirst(personnel.name)}
                </h1>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              {canCreate('notes') && (
                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px]"
                >
                  <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Not Ekle
                </button>
              )}
              {canCreate('tasks') && (
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 min-h-[48px]"
                >
                  <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                  Görev Ekle
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <Card>
        <div className="p-6 space-y-4">
          {/* Header with real-time indicator and filter toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Notlar ve Görevler
              </h2>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Canlı
              </span>
            </div>
            
            {/* Filter toggle button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 min-h-[44px] ${
                isFilterOpen
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="Filtreleri aç/kapa"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
              {isFilterOpen ? 'Filtreyi Gizle' : 'Filtrele'}
            </button>
          </div>

          {/* Activity feed (notes and tasks) */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          ) : (
            <ActivityFeed
              notes={notes}
              tasks={tasks}
              authorNames={authorNames}
              currentUserId={user?.id || ''}
              isOwner={isOwnerRole}
              canEditNotes={canEdit('notes')}
              canDeleteNotes={canDelete('notes')}
              canEditTasks={canEdit('tasks')}
              canDeleteTasks={canDelete('tasks')}
              isFilterOpen={isFilterOpen}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onCloseTask={handleCloseTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </div>
      </Card>

      {/* Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setEditingNote(null);
        }}
        title={editingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}
        size="md"
      >
        <NoteForm
          personnelId={personnel.id}
          editingNote={editingNote}
          onSuccess={handleNoteSuccess}
        />
      </Modal>

      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
        size="md"
      >
        <TaskForm
          personnelId={personnel.id}
          editingTask={editingTask}
          onSuccess={handleTaskSuccess}
          onCancel={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      </Modal>

      {/* Task Close Modal */}
      <Modal
        isOpen={!!closingTask}
        onClose={() => setClosingTask(null)}
        title="Görevi Kapat"
        size="sm"
      >
        {closingTask && (
          <TaskCloseModal
            task={closingTask}
            onSuccess={() => {
              setClosingTask(null);
              fetchData();
            }}
            onCancel={() => setClosingTask(null)}
          />
        )}
      </Modal>

      {/* Delete Note Confirmation Modal */}
      <Modal
        isOpen={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        title="Notu Sil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Bu notu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeletingNote(null)}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Task Confirmation Modal */}
      <Modal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        title="Görevi Sil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeletingTask(null)}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteTask}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
