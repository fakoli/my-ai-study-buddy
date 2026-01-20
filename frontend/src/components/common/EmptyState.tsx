import { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}

      {children}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {action && (
            <Button onClick={action.onClick}>
              {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" aria-hidden="true" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
