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
    score,
    progress,
    isSubmitting,
    error,
    toggleItem,
    submitResult,
  } = useChecklistExecution(checklist);

  const [showAssignment, setShowAssignment] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);

  const handleComplete = async () => {
    if (completedItems.length === 0) {
      return;
    }

    const result = await submitResult();
    
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
              <label
                key={item.id}
                className={`
                  flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    isCompleted
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
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
            );
          })}
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


