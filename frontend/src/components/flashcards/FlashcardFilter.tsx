import { Filter } from 'lucide-react';
import type { FlashcardFilter as FilterType, FlashcardRatingSummary } from '../../types';

interface FlashcardFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  summary?: FlashcardRatingSummary;
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unrated', label: 'Unrated' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'unhelpful', label: 'Unhelpful' },
];

function getCount(filter: FilterType, summary?: FlashcardRatingSummary): number | null {
  if (!summary) return null;
  switch (filter) {
    case 'all':
      return summary.total;
    case 'unrated':
      return summary.unrated;
    case 'easy':
      return summary.easy;
    case 'medium':
      return summary.medium;
    case 'hard':
      return summary.hard;
    case 'unhelpful':
      return summary.unhelpful;
  }
}

export function FlashcardFilter({
  currentFilter,
  onFilterChange,
  summary,
}: FlashcardFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-400" />
      <select
        value={currentFilter}
        onChange={(e) => onFilterChange(e.target.value as FilterType)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {filterOptions.map((option) => {
          const count = getCount(option.value, summary);
          return (
            <option key={option.value} value={option.value}>
              {option.label}
              {count !== null ? ` (${count})` : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
}
