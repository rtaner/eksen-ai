'use client';

interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showOneOnOneTab?: boolean;
}

export default function TabNavigation({ activeTab, onTabChange, showOneOnOneTab = false }: TabNavigationProps) {
  const tabs: Tab[] = [
    { id: 'notes', label: 'Notlar' },
    { id: 'tasks', label: 'Görevler' },
    { id: 'checklists', label: 'Checklistler' },
    ...(showOneOnOneTab ? [{ id: 'one-on-one', label: '🤝 1-on-1 Görüşmeler' }] : []),
  ];
  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                px-6 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px]
                ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
