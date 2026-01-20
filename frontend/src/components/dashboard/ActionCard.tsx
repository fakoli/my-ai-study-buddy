import { ArrowRight, BookOpen, Brain, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../common/Card';

interface ActionCardProps {
  type: 'review' | 'quiz' | 'study';
  count?: number;
  title: string;
  description: string;
  href: string;
}

const icons = {
  review: Brain,
  quiz: Target,
  study: BookOpen,
};

const colors = {
  review: 'text-purple-500 bg-purple-100',
  quiz: 'text-blue-500 bg-blue-100',
  study: 'text-green-500 bg-green-100',
};

export function ActionCard({ type, count, title, description, href }: ActionCardProps) {
  const Icon = icons[type];

  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colors[type]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{title}</h3>
              {count !== undefined && count > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                  {count}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{description}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </CardContent>
      </Card>
    </Link>
  );
}
