'use client';

interface PermissionToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function PermissionToggle({
  label,
  checked,
  onChange,
  disabled = false,
}: PermissionToggleProps) {
  return (
    <label className="flex items-center justify-center min-h-[44px] cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={`
          relative w-11 h-6 rounded-full transition-colors
          ${checked ? 'bg-blue-600' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2
        `}
      >
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
      <span className="sr-only">{label}</span>
    </label>
  );
}
