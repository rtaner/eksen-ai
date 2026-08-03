'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Note, Task } from '@/lib/types';
import NoteItem from '@/components/notes/NoteItem';
import TaskItem from '@/components/tasks/TaskItem';
import NoteForm from '@/components/notes/NoteForm';
import TaskForm from '@/components/tasks/TaskForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function StoreNotesTasksSection() {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;
      setIsOwner(profile.role === 'owner' || profile.role === 'manager');

      // Fetch store level notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('is_store_level', true)
        .order('created_at', { ascending: false });

      // Fetch store level tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_store_level', true)
        .order('created_at', { ascending: false });

      setNotes(notesData || []);
      setTasks(tasksData || []);

      // Fetch author names
      const authorIds = [...new Set([
        ...(notesData || []).map((n) => n.author_id),
        ...(tasksData || []).filter((t) => t.author_id).map((t) => t.author_id!),
      ])];

      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, surname')
          .in('id', authorIds);

        const names: Record<string, string> = {};
        profiles?.forEach((p) => {
          names[p.id] = `${p.name} ${p.surname}`;
        });
        setAuthorNames(names);
      }
    } catch (err) {
      console.error('Error loading store notes & tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  const handleDeleteNote = async (note: Note) => {
    if (!confirm('Bu mağaza notunu silmek istediğinizden emin misiniz?')) return;
    await supabase.from('notes').delete().eq('id', note.id);
    loadStoreData();
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Bu mağaza görevini silmek istediğinizden emin misiniz?')) return;
    await supabase.from('tasks').delete().eq('id', task.id);
    loadStoreData();
  };

  const handleCloseTask = async (task: Task) => {
    await supabase.from('tasks').update({ status: 'closed', completed_at: new Date().toISOString() }).eq('id', task.id);
    loadStoreData();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
      {/* Header with buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🏬 Mağaza Genel Notları & Yapılacaklar
          </h2>
          <p className="text-sm text-gray-500">
            Mağaza geneli için notlar alın ve atamasız yapılacaklar listesi oluşturun (Daha sonra personele/gruba devredebilirsiniz)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingNote(null);
              setIsNoteModalOpen(true);
            }}
            variant="secondary"
            size="sm"
          >
            + Mağaza Notu Ekle
          </Button>
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            variant="primary"
            size="sm"
          >
            + Yapılacak Görev Ekle
          </Button>
        </div>
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
      ) : notes.length === 0 && tasks.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">Henüz eklenmiş mağaza genel notu veya görevi bulunmuyor.</p>
          <p className="text-xs text-gray-400 mt-1">Mağaza geneli için hatırlatmalar veya reyon yapılacakları ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Notes list */}
          {notes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Mağaza Notları ({notes.length})</h3>
              <div className="space-y-2">
                {notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    authorName={authorNames[note.author_id] || 'Yönetici'}
                    canEdit={isOwner}
                    canDelete={isOwner}
                    onEdit={(n) => {
                      setEditingNote(n);
                      setIsNoteModalOpen(true);
                    }}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tasks list */}
          {tasks.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold text-gray-700">Mağaza Yapılacaklar Listesi ({tasks.length})</h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    authorName={task.author_id ? authorNames[task.author_id] : 'Yönetici'}
                    canEdit={isOwner}
                    canDelete={isOwner}
                    onClose={handleCloseTask}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsTaskModalOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <Modal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          title={editingNote ? 'Mağaza Notunu Düzenle' : 'Yeni Mağaza Genel Notu'}
        >
          <NoteForm
            isStoreLevel={true}
            editingNote={editingNote}
            onSuccess={() => {
              setIsNoteModalOpen(false);
              loadStoreData();
            }}
          />
        </Modal>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          title={editingTask ? 'Görevi Düzenle / Personele Ata' : 'Yeni Mağaza Görevi (Yapılacak)'}
        >
          <TaskForm
            isStoreLevel={true}
            editingTask={editingTask}
            onSuccess={() => {
              setIsTaskModalOpen(false);
              loadStoreData();
            }}
            onCancel={() => setIsTaskModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
