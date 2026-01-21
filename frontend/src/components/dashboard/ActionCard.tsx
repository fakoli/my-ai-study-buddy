import { ArrowRight, BookOpen, Brain, Target, Map, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../common/Card';

interface ActionCardProps {
  type: 'review' | 'quiz' | 'study' | 'paths' | 'create';
  count?: number;
  title: string;
  description: string;
  href: string;
}

const icons = {
  review: Brain,
  quiz: Target,
  study: BookOpen,
  paths: Map,
  create: Plus,
};

const colors = {
  review: {
    icon: 'text-purple-600',
    bg: 'bg-purple-100',
    hoverBg: 'group-hover:bg-purple-200',
    border: 'border-purple-100',
    hoverBorder: 'hover:border-purple-200',
  },
  quiz: {
    icon: 'text-blue-600',
    bg: 'bg-blue-100',
    hoverBg: 'group-hover:bg-blue-200',
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-200',
  },
  study: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-100',
    hoverBg: 'group-hover:bg-emerald-200',
    border: 'border-emerald-100',
    hoverBorder: 'hover:border-emerald-200',
  },
  paths: {
    icon: 'text-indigo-600',
    bg: 'bg-indigo-100',
    hoverBg: 'group-hover:bg-indigo-200',
    border: 'border-indigo-100',
    hoverBorder: 'hover:border-indigo-200',
  },
  create: {
    icon: 'text-amber-600',
    bg: 'bg-amber-100',
    hoverBg: 'group-hover:bg-amber-200',
    border: 'border-amber-100',
    hoverBorder: 'hover:border-amber-200',
  },
};

export function ActionCard({ type, count, title, description, href }: ActionCardProps) {
  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <Link to={href} className="group block">
      <Card className={`h-full border-2 ${colorScheme.border} ${colorScheme.hoverBorder} hover:shadow-md transition-all`}>
        <CardContent className="flex items-center gap-4 py-4">
          <div className={`p-3 rounded-xl ${colorScheme.bg} ${colorScheme.hoverBg} transition-colors`}>
            <Icon className={`w-6 h-6 ${colorScheme.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {count !== undefined && count > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-600 rounded-full">
                  {count}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
}
