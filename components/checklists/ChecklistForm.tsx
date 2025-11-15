'use client';

import { useState, useEffect } from 'react';
import { useChecklists } from '@/lib/hooks/useChecklists';
import { useToast } from '@/lib/contexts/ToastContext';
import Button from '@/components/ui/Button';
import type { Checklist, ChecklistItem } from '@/lib/types';

// Simple UUID generator
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface ChecklistFormProps {
  editingChecklist: Checklist | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChecklistForm({
  editingChecklist,
  onSuccess,
  onCancel,
}: ChecklistFormProps) {
  const { createChecklist, updateChecklist } = useChecklists();
  const { showSuccess, showError } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load editing data
  useEffect(() => {
    if (editingChecklist) {
      setTitle(editingChecklist.title);
      setDescription(editingChecklist.description || '');
      setItems(editingChecklist.items);
    } else {
      // Start with one empty item
      setItems([{ id: generateId(), text: '', order: 1 }]);
    }
  }, [editingChecklist]);

  const addItem = () => {
    const newItem: ChecklistItem = {
      id: generateId(),
      text: '',
      order: items.length + 1,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      showError('En az 1 madde olmalıdır');
      return;
    }
    const filtered = items.filter((item) => item.id !== id);
    // Reorder
    const reordered = filtered.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    setItems(reordered);
  };

  const updateItemText = (id: string, text: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Reorder
    const reordered = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    setItems(reordered);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      showError('Başlık zorunludur');
      return;
    }

    const validItems = items.filter((item) => item.text.trim());
    if (validItems.length === 0) {
      showError('En az 1 madde girmelisiniz');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        title: title.trim(),
        description: description.trim() || undefined,
        items: validItems,
      };

      if (editingChecklist) {
        // Update
        const success = await updateChecklist(editingChecklist.id, formData);
        if (success) {
          showSuccess('Checklist güncellendi');
          onSuccess();
        } else {
          showError('Checklist güncellenirken bir hata oluştu');
        }
      } else {
        // Create
        const result = await createChecklist(formData);
        if (result) {
          showSuccess('Checklist oluşturuldu');
          onSuccess();
        } else {
          showError('Checklist oluşturulurken bir hata oluştu');
        }
      }
    } catch (error) {
      console.error('Form submit error:', error);
      showError('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Başlık *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Örn: Hijyen Kontrolü"
          maxLength={200}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Açıklama
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Checklist hakkında kısa açıklama..."
          rows={3}
          maxLength={500}
        />
      </div>


      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Maddeler * ({items.length})
          </label>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Madde Ekle
          </button>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              {/* Order buttons */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Yukarı taşı"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Aşağı taşı"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Order number */}
              <span className="text-sm text-gray-500 w-6">{item.order}.</span>

              {/* Text input */}
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Madde metni..."
                maxLength={500}
              />

              {/* Delete button */}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                title="Sil"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          İptal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Kaydediliyor...' : editingChecklist ? 'Güncelle' : 'Oluştur'}
        </Button>
      </div>
    </form>
  );
}
