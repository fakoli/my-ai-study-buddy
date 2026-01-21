import { BookOpen, FileText, HelpCircle } from 'lucide-react';
import type { EditorTab } from '../../hooks/useModuleEditorForm';

export interface ModuleEditorTabsProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  flashcardCount: number;
  quizQuestionCount: number;
}

export function ModuleEditorTabs({
  activeTab,
  onTabChange,
  flashcardCount,
  quizQuestionCount,
}: ModuleEditorTabsProps) {
  const tabs: { key: EditorTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'content', label: 'Content', icon: <BookOpen className="w-4 h-4" /> },
    {
      key: 'flashcards',
      label: 'Flashcards',
      icon: <FileText className="w-4 h-4" />,
      count: flashcardCount,
    },
    {
      key: 'quiz',
      label: 'Quiz',
      icon: <HelpCircle className="w-4 h-4" />,
      count: quizQuestionCount,
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </nav>
    </div>
  );
}
