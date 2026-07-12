'use client';

import { useState } from 'react';
import { useChecklistExecution } from '@/lib/hooks/useChecklistExecution';
import Button from '@/components/ui/Button';
import PersonnelAssignmentForm from './PersonnelAssignmentForm';
import type { Checklist } from '@/lib/types';

interface ChecklistExecutionModalProps {
  checklist: Checklist;
  onComplete: () => void;
  onCancel: () => void;
}

export default function ChecklistExecutionModal({
  checklist,
  onComplete,
  onCancel,
}: ChecklistExecutionModalProps) {
  const {
    completedItems,
    itemComments,
    setItemComment,
    score,
    progress,
    isSubmitting,
    error,
    toggleItem,
    submitResult,
  } = useChecklistExecution(checklist);

  const [showAssignment, setShowAssignment] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [closingNote, setClosingNote] = useState<string>('');
  const [activeCommentItemId, setActiveCommentItemId] = useState<string | null>(null);

  const handleComplete = async () => {
    if (completedItems.length === 0) {
      return;
    }

    const result = await submitResult(closingNote);
    
    if (result) {
      setResultId(result.id);
      setShowAssignment(true);
    }
  };

  const handleSkipAssignment = () => {
    onComplete();
  };

  if (showAssignment && resultId) {
    return (
      <PersonnelAssignmentForm
        resultId={resultId}
        onComplete={onComplete}
        onSkip={handleSkipAssignment}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            Tamamlanan: {completedItems.length}/{checklist.items.length}
          </span>
          <span className="font-bold text-blue-600">
            Puan: {score.toFixed(2)}/5.00
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {checklist.items
          .sort((a, b) => a.order - b.order)
          .map((item) => {
            const isCompleted = completedItems.includes(item.id);
            return (
              <div
                key={item.id}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${
                    isCompleted
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3 flex-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleItem(item.id)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-500 mr-2">{item.order}.</span>
                      <span
                        className={`${
                          isCompleted
                            ? 'text-blue-900 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  </label>
                  
                  {/* Yorum Yaz/Düzenle Butonu */}
                  <button
                    type="button"
                    onClick={() => setActiveCommentItemId(activeCommentItemId === item.id ? null : item.id)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors border font-medium flex-shrink-0 ${
                      itemComments[item.id]
                        ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {itemComments[item.id] ? '📝 Yorumu Düzenle' : '💬 Yorum Yaz'}
                  </button>
                </div>

                {/* Yorum Giriş Alanı */}
                {activeCommentItemId === item.id && (
                  <div className="mt-3 pl-8">
                    <textarea
                      value={itemComments[item.id] || ''}
                      onChange={(e) => setItemComment(item.id, e.target.value)}
                      placeholder="Bu madde için not/yorum ekleyin..."
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      maxLength={300}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">
                        {(itemComments[item.id] || '').length}/300 karakter
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveCommentItemId(null)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Optional Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Yorum <span className="text-gray-400 font-normal">(Opsiyonel)</span>
        </label>
        <textarea
          value={closingNote}
          onChange={(e) => setClosingNote(e.target.value)}
          placeholder="Checklist hakkında not ekleyebilirsiniz..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {closingNote.length}/500 karakter
        </p>
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
          type="button"
          onClick={handleComplete}
          disabled={completedItems.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Tamamla'}
        </Button>
      </div>
    </div>
  );
}


