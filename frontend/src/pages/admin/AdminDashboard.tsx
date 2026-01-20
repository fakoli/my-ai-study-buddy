import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { useAdminStats, useAdminUsers, useAdjustTokens } from '../../hooks/useAdmin';
import { useToast } from '../../components/common/ToastProvider';
import { Users, Coins, UserCog, Search } from 'lucide-react';
import type { User } from '../../types';

export function AdminDashboard() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({
    search: debouncedSearch || undefined,
    limit: 20,
  });
  const adjustTokens = useAdjustTokens();

  const handleSearch = () => {
    setDebouncedSearch(search);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAdjustTokens = async () => {
    if (!selectedUser || !adjustAmount || !adjustReason) return;

    try {
      const result = await adjustTokens.mutateAsync({
        userId: selectedUser.id,
        data: {
          amount: parseInt(adjustAmount, 10),
          reason: adjustReason,
        },
      });
      showToast(
        `Tokens adjusted: ${result.previous_balance} → ${result.new_balance}`,
        'success'
      );
      setSelectedUser(null);
      setAdjustAmount('');
      setAdjustReason('');
    } catch {
      showToast('Failed to adjust tokens', 'error');
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.user_count || 0}</p>
              <p className="text-sm text-gray-500">Regular Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserCog className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.admin_count || 0}</p>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Coins className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_tokens?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500">Total Tokens</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">User Management</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* User Table */}
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Role</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Tokens</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Registered</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData?.users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{user.email}</td>
                      <td className="py-3 px-4 text-gray-900">{user.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {user.token_balance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          Adjust Tokens
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {usersData?.users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}

              {usersData && usersData.total > usersData.limit && (
                <div className="py-4 text-center text-sm text-gray-500">
                  Showing {usersData.users.length} of {usersData.total} users
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Tokens Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={closeModal}
        title="Adjust Tokens"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{selectedUser.name}</p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
              <p className="text-sm text-gray-600 mt-1">
                Current balance: <span className="font-medium">{selectedUser.token_balance} tokens</span>
              </p>
            </div>

            <Input
              id="adjust-amount"
              label="Amount"
              type="number"
              placeholder="e.g., 50 or -25"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              helperText="Positive to add, negative to deduct"
            />

            <Input
              id="adjust-reason"
              label="Reason"
              placeholder="e.g., Bonus for feedback"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAdjustTokens}
                isLoading={adjustTokens.isPending}
                disabled={!adjustAmount || !adjustReason}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
