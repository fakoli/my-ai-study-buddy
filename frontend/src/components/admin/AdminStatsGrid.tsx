import { Users, Coins, Shield, UserCheck } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import type { AdminStatsResponse } from '../../types';

export interface AdminStatsGridProps {
  stats: AdminStatsResponse;
}

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  const statItems = [
    {
      label: 'Total Users',
      value: stats.total_users,
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Regular Users',
      value: stats.user_count,
      icon: <UserCheck className="w-6 h-6 text-emerald-600" />,
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Admins',
      value: stats.admin_count,
      icon: <Shield className="w-6 h-6 text-purple-600" />,
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Total Tokens',
      value: stats.total_tokens.toLocaleString(),
      icon: <Coins className="w-6 h-6 text-amber-600" />,
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`p-3 ${item.bgColor} rounded-xl`}>{item.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-sm text-gray-600">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
