'use client';

import { DAYS_OF_WEEK } from '@/lib/types/scheduled-tasks';

export default function RecurrenceSelector({ value, onChange }: any) {
  return (
    <div className="space-y-3">
      <select
        value={value.recurrence_type}
        onChange={(e) => onChange({ ...value, recurrence_type: e.target.value })}
        className="w-full px-4 py-3 border rounded-lg"
      >
        <option value="daily">Her Gün</option>
        <option value="weekly">Haftalık</option>
        <option value="monthly">Aylık</option>
      </select>

      {value.recurrence_type === 'weekly' && (
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              onClick={() => {
                const days = value.recurrence_config.days || [];
                const newDays = days.includes(day.value)
                  ? days.filter((d: number) => d !== day.value)
                  : [...days, day.value];
                onChange({ ...value, recurrence_config: { type: 'weekly', days: newDays } });
              }}
              className={`px-3 py-2 rounded-lg ${
                value.recurrence_config.days?.includes(day.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {day.short}
            </button>
          ))}
        </div>
      )}

      {value.recurrence_type === 'monthly' && (
        <input
          type="number"
          min="1"
          max="31"
          value={value.recurrence_config.day || 1}
          onChange={(e) => onChange({ ...value, recurrence_config: { type: 'monthly', day: parseInt(e.target.value) } })}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Ayın kaçıncı günü?"
        />
      )}

      <input
        type="time"
        value={value.scheduled_time?.substring(0, 5) || '09:00'}
        onChange={(e) => onChange({ ...value, scheduled_time: e.target.value + ':00' })}
        className="w-full px-4 py-3 border rounded-lg"
      />
    </div>
  );
}
