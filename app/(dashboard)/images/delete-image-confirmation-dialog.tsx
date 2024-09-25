import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteImageConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  imageName: string;
}

export function DeleteImageConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  imageName
}: DeleteImageConfirmationDialogProps) {
  const [answer, setAnswer] = useState('');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setNum1(Math.floor(Math.random() * 10));
      setNum2(Math.floor(Math.random() * 10));
      setAnswer('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (parseInt(answer) === num1 + num2) {
      onConfirm();
    } else {
      alert('Incorrect answer. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Image Deletion</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete the image: {imageName}?</p>
        <p>To confirm, please solve this simple math problem:</p>
        <div className="flex items-center space-x-2 mt-4">
          <Label>{num1} + {num2} =</Label>
          <Input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-20"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}