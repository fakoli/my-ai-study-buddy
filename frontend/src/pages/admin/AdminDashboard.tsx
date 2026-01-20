import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { useAdminStats, useAdminUsers, useAdjustTokens } from '../../hooks/useAdmin';
import { useToast } from '../../components/common/ToastProvider';
import { useAuthContext } from '../../components/common/AuthProvider';
import { Users, Coins, UserCog, Search } from 'lucide-react';
import type { User } from '../../types';

export function AdminDashboard() {
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Protect route on frontend - redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showToast('Access denied. Admin privileges required.', 'error');
      navigate('/', { replace: true });
    }
  }, [user, navigate, showToast]);

  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErrorObj } = useAdminStats();
  const { data: usersData, isLoading: usersLoading, isError: usersError, error: usersErrorObj } = useAdminUsers({
    search: debouncedSearch || undefined,
    skip: (currentPage - 1) * 20,
    limit: 20,
  });
  const adjustTokens = useAdjustTokens();

  // Real-time search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // Reset to page 1 when search changes
      if (search !== debouncedSearch) {
        searchParams.delete('page');
        setSearchParams(searchParams);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, debouncedSearch, searchParams, setSearchParams]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(search);
    }
  };

  const handleAdjustTokens = async () => {
    if (!selectedUser || !adjustAmount.trim() || !adjustReason) return;

    const trimmedAmount = adjustAmount.trim();
    const parsedAmount = Number.parseInt(trimmedAmount, 10);

    // Validate the amount is a valid integer
    if (!/^-?\d+$/.test(trimmedAmount) || Number.isNaN(parsedAmount)) {
      showToast('Please enter a valid integer token amount', 'error');
      return;
    }

    // Check if amount is within acceptable range
    if (parsedAmount < -1000000 || parsedAmount > 1000000) {
      showToast('Amount must be between -1,000,000 and 1,000,000', 'error');
      return;
    }

    try {
      const result = await adjustTokens.mutateAsync({
        userId: selectedUser.id,
        data: {
          amount: parsedAmount,
          reason: adjustReason,
        },
      });

      // Check if the adjustment was clamped to zero
      const requestedNewBalance = result.previous_balance + parsedAmount;
      const wasClamped = requestedNewBalance < 0 && result.new_balance === 0;

      if (wasClamped) {
        showToast(
          `Tokens adjusted: ${result.previous_balance} → ${result.new_balance} (clamped to prevent negative balance)`,
          'success'
        );
      } else {
        showToast(
          `Tokens adjusted: ${result.previous_balance} → ${result.new_balance}`,
          'success'
        );
      }
      setSelectedUser(null);
      setAdjustAmount('');
      setAdjustReason('');
    } catch (error) {
      console.error('Failed to adjust tokens:', error);
      const message =
        (error as { message?: string })?.message || 'Failed to adjust tokens';
      showToast(message, 'error');
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  const goToPage = (page: number) => {
    const totalPages = usersData ? Math.max(1, Math.ceil(usersData.total / usersData.limit)) : 1;
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    searchParams.set('page', String(nextPage));
    setSearchParams(searchParams);
  };

  // Error state handling
  if (statsError) {
    const errorMessage = (statsErrorObj as { message?: string })?.message || 'Failed to load admin statistics';
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

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
                aria-label="Search users by name or email"
              />
            </div>
          </div>

          {/* User Table */}
          {usersError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">
                {(usersErrorObj as { message?: string })?.message || 'Failed to load users'}
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="User management table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th scope="col" className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Email</th>
                    <th scope="col" className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Name</th>
                    <th scope="col" className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Role</th>
                    <th scope="col" className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Tokens</th>
                    <th scope="col" className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Registered</th>
                    <th scope="col" className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
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
                          aria-label={`Adjust tokens for ${user.name}`}
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

              {usersData && usersData.total > usersData.limit && (() => {
                const totalPages = Math.max(1, Math.ceil(usersData.total / usersData.limit));

                return (
                  <div className="py-4 flex flex-col items-center gap-2 text-sm text-gray-500">
                    <div>
                      Showing {usersData.users.length} of {usersData.total} users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
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
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        aria-label="Go to next page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                );
              })()}
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
              helperText="Positive to add, negative to deduct (min: -1,000,000, max: 1,000,000)"
              aria-describedby="adjust-amount-helper"
            />

            <Input
              id="adjust-reason"
              label="Reason"
              placeholder="e.g., Bonus for feedback"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              aria-required="true"
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAdjustTokens}
                isLoading={adjustTokens.isPending}
                disabled={!adjustAmount.trim() || !adjustReason.trim()}
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
