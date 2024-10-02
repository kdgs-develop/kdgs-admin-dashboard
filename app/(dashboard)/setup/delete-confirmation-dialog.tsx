import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  action: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  action
}: DeleteConfirmationDialogProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNum1(Math.floor(Math.random() * 10));
      setNum2(Math.floor(Math.random() * 10));
      setUserAnswer('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (parseInt(userAnswer) === num1 + num2) {
      setIsLoading(true);
      try {
        await onConfirm();
        onClose();
        toast({
          title: 'Deletion successful',
          description: 'The item has been successfully deleted.'
        });
      } catch (error) {
        console.error('Failed to delete:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete the item. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Incorrect answer. Deletion not possible.');
      toast({
        title: 'Incorrect answer',
        description:
          'Please provide the correct answer to proceed with deletion.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p>To confirm deletion, please solve this simple math problem:</p>
          <p>
            {num1} + {num2} = ?
          </p>
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter your answer"
          />
          {error && <p className="text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading
              ? action === 'delete'
                ? 'Deleting...'
                : 'Sending...'
              : action === 'delete'
                ? 'Proceed and Delete'
                : 'Send New Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
