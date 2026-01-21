import { Shield, User as UserIcon, Search } from 'lucide-react';
import { Button } from '../common/Button';
import type { User } from '../../types';

export interface UserTableProps {
  users: User[];
  onAdjustTokens: (user: User) => void;
}

export function UserTable({ users, onAdjustTokens }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <Search className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">No users found</p>
        <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table" aria-label="User management table">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
              User
            </th>
            <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
              Role
            </th>
            <th scope="col" className="text-right py-3 px-4 font-semibold text-gray-600 text-sm">
              Tokens
            </th>
            <th scope="col" className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
              Registered
            </th>
            <th scope="col" className="text-right py-3 px-4 font-semibold text-gray-600 text-sm">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-indigo-50/50 transition-colors"
            >
              {/* User info - combined name and email */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    user.role === 'admin' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    {user.role === 'admin' ? (
                      <Shield className="w-4 h-4 text-purple-600" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </td>

              {/* Role badge */}
              <td className="py-4 px-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {user.role === 'admin' && <Shield className="w-3 h-3" />}
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </td>

              {/* Token balance */}
              <td className="py-4 px-4 text-right">
                <span className="font-semibold text-gray-900 tabular-nums">
                  {user.token_balance.toLocaleString()}
                </span>
              </td>

              {/* Registration date */}
              <td className="py-4 px-4 text-gray-600 text-sm">
                {new Date(user.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>

              {/* Actions */}
              <td className="py-4 px-4 text-right">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAdjustTokens(user)}
                  aria-label={`Adjust tokens for ${user.name}`}
                >
                  Adjust Tokens
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
