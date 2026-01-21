import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import type { User } from '../../types';

export interface TokenAdjustmentModalProps {
  user: User | null;
  amount: string;
  reason: string;
  onAmountChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isValid: boolean;
}

export function TokenAdjustmentModal({
  user,
  amount,
  reason,
  onAmountChange,
  onReasonChange,
  onClose,
  onConfirm,
  isLoading,
  isValid,
}: TokenAdjustmentModalProps) {
  return (
    <Modal isOpen={!!user} onClose={onClose} title="Adjust Tokens" size="sm">
      {user && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-600 mt-1">
              Current balance: <span className="font-medium">{user.token_balance} tokens</span>
            </p>
          </div>

          <Input
            id="adjust-amount"
            label="Amount"
            type="number"
            placeholder="e.g., 50 or -25"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            hint="Positive to add, negative to deduct (min: -1,000,000, max: 1,000,000)"
          />

          <Input
            id="adjust-reason"
            label="Reason"
            placeholder="e.g., Bonus for feedback"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            aria-required="true"
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={!isValid}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
