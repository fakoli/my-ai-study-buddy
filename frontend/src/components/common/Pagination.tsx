import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  displayedItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  displayedItems,
  onPageChange,
  itemLabel = 'items',
}: PaginationProps) {
  if (totalItems <= displayedItems && totalPages <= 1) {
    return null;
  }

  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="py-4 flex flex-col items-center gap-2 text-sm text-gray-500">
      <div>
        Showing {displayedItems} of {totalItems} {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={goToPrevious}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
        >
          Previous
        </Button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={goToNext}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
