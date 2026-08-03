'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Note, Task, Personnel, Role } from '@/lib/types';
import NoteItem from '@/components/notes/NoteItem';
import TaskItem from '@/components/tasks/TaskItem';
import Modal from '@/components/ui/Modal';
import NoteForm from '@/components/notes/NoteForm';
import TaskForm from '@/components/tasks/TaskForm';

type FilterCategory = 'all' | 'store' | 'group' | 'personnel' | 'tasks' | 'notes';

interface SocialFeedStreamProps {
  personnelList: Personnel[];
  refreshTrigger: number;
  onRefresh: () => void;
}

export default function SocialFeedStream({ personnelList, refreshTrigger, onRefresh }: SocialFeedStreamProps) {
  const supabase = createClient();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [personnelMap, setPersonnelMap] = useState<Record<string, string>>({});
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role>('personnel');

  // Edit Modals
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadFeedData = async () => {
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
      const role = profile.role as Role;
      setUserRole(role);

      // Fetch Groups Map
      const { data: groups } = await supabase.from('groups').select('id, name');
      const gMap: Record<string, string> = {};
      groups?.forEach((g) => {
        gMap[g.id] = g.name;
      });
      setGroupsMap(gMap);

      // Map Personnel
      const pMap: Record<string, string> = {};
      personnelList.forEach((p) => {
        pMap[p.id] = p.name;
      });
      setPersonnelMap(pMap);

      // Query Notes (RLS policy will filter based on role)
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      // Query Tasks (Only open/active tasks appear in the Live Social Feed)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      setNotes(notesData || []);
      setTasks(tasksData || []);

      // Author Profiles
      const authorIds = [...new Set([
        ...(notesData || []).map((n) => n.author_id),
        ...(tasksData || []).filter((t) => t.author_id).map((t) => t.author_id!),
      ])];

      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, surname')
          .in('id', authorIds);

        const aNames: Record<string, string> = {};
        profiles?.forEach((p) => {
          aNames[p.id] = `${p.name} ${p.surname}`;
        });
        setAuthorNames(aNames);
      }
    } catch (err) {
      console.error('Error loading feed stream:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, [refreshTrigger]);

  const handleDeleteNote = async (note: Note) => {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    const { error } = await supabase.from('notes').delete().eq('id', note.id);
    if (error) {
      alert(`Not silinirken hata oluştu: ${error.message}`);
      loadFeedData();
    } else {
      onRefresh?.();
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      alert(`Görev silinirken hata oluştu: ${error.message}`);
      loadFeedData();
    } else {
      onRefresh?.();
    }
  };

  const handleCloseTask = async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'closed', completed_at: new Date().toISOString() })
      .eq('id', task.id);
    if (error) {
      alert(`Görev tamamlanırken hata oluştu: ${error.message}`);
      loadFeedData();
    } else {
      onRefresh?.();
    }
  };

  // Combine and sort chronologically
  const feedItems = [
    ...notes.map((n) => ({ type: 'note' as const, date: n.created_at, data: n })),
    ...tasks.map((t) => ({ type: 'task' as const, date: t.created_at, data: t })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter items
  const filteredItems = feedItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'store') return item.data.is_store_level;
    if (activeFilter === 'group') return !!item.data.group_id;
    if (activeFilter === 'personnel') return !!item.data.personnel_id && !item.data.is_store_level;
    if (activeFilter === 'notes') return item.type === 'note';
    if (activeFilter === 'tasks') return item.type === 'task';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200 no-scrollbar">
        {[
          { id: 'all', label: '🔥 Canlı Akış (Tümü)' },
          { id: 'store', label: '🏬 Mağaza Genel' },
          { id: 'group', label: '👥 Gruplar' },
          { id: 'personnel', label: '👤 Bireysel' },
          { id: 'tasks', label: '📋 Görevler' },
          { id: 'notes', label: '📝 Notlar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as FilterCategory)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Stream */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Akış yükleniyor...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 p-6">
          <p className="text-gray-500 font-medium text-sm">Bu filtreye uygun herhangi bir akış gönderisi bulunamadı.</p>
          <p className="text-xs text-gray-400 mt-1">Yarıda kalan bir iş veya duyuru eklemek için yukarıdaki hızlı paylaşım kutusunu kullanabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            if (item.type === 'note') {
              const note = item.data as Note;
              const gName = note.group_id ? groupsMap[note.group_id] : undefined;
              const pName = note.personnel_id ? personnelMap[note.personnel_id] : undefined;
              const author = note.author_id ? authorNames[note.author_id] : 'Yönetici';
              
              // Note edit/delete permissions: Owner can edit/delete all, Manager/Personnel can edit/delete own
              const canEditNote = userRole === 'owner' || note.author_id === currentUserId;
              const canDeleteNote = userRole === 'owner' || note.author_id === currentUserId;

              return (
                <div key={`note-${note.id}`} className="bg-white rounded-2xl border border-gray-200 p-1 shadow-2xs">
                  <NoteItem
                    note={note}
                    authorName={author}
                    targetName={pName}
                    groupName={gName}
                    canEdit={canEditNote}
                    canDelete={canDeleteNote}
                    onEdit={(n) => setEditingNote(n)}
                    onDelete={handleDeleteNote}
                  />
                </div>
              );
            } else {
              const task = item.data as Task;
              const gName = task.group_id ? groupsMap[task.group_id] : undefined;
              const pName = task.personnel_id ? personnelMap[task.personnel_id] : undefined;
              const author = task.author_id ? authorNames[task.author_id] : 'Yönetici';

              // Task edit/delete/close permissions: Owner and Manager have full control over tasks
              const canEditTask = userRole === 'owner' || userRole === 'manager' || task.author_id === currentUserId;
              const canDeleteTask = userRole === 'owner' || userRole === 'manager' || task.author_id === currentUserId;

              return (
                <div key={`task-${task.id}`} className="bg-white rounded-2xl border border-gray-200 p-1 shadow-2xs">
                  <TaskItem
                    task={task}
                    authorName={author}
                    targetName={pName}
                    groupName={gName}
                    canEdit={canEditTask}
                    canDelete={canDeleteTask}
                    onClose={handleCloseTask}
                    onEdit={(t) => setEditingTask(t)}
                    onDelete={handleDeleteTask}
                  />
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <Modal
          isOpen={!!editingNote}
          onClose={() => setEditingNote(null)}
          title="Notu Düzenle"
        >
          <NoteForm
            editingNote={editingNote}
            onSuccess={() => {
              setEditingNote(null);
              loadFeedData();
            }}
          />
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          title="Görevi Düzenle / Personele veya Gruba Devret"
        >
          <TaskForm
            editingTask={editingTask}
            onSuccess={() => {
              setEditingTask(null);
              loadFeedData();
            }}
            onCancel={() => setEditingTask(null)}
          />
        </Modal>
      )}
    </div>
  );
}
