import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BucketItem } from 'minio';

interface RenameImageDialogProps {
  image: BucketItem | null;
  onClose: () => void;
  onRename: (oldName: string, newName: string) => void;
}

export function RenameImageDialog({ image, onClose, onRename }: RenameImageDialogProps) {
  const [newName, setNewName] = useState('');
  const [answer, setAnswer] = useState('');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  useEffect(() => {
    if (image) {
      setNewName(image.name ?? '');
      setNum1(Math.floor(Math.random() * 10));
      setNum2(Math.floor(Math.random() * 10));
      setAnswer('');
    }
  }, [image]);

  const handleConfirm = () => {
    if (parseInt(answer) === num1 + num2) {
      onRename(image?.name || '', newName);
      onClose();
    } else {
      alert('Incorrect answer. Please try again.');
    }
  };

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rename Image: {image?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label>New Name</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          <p>To confirm, please solve this simple math problem:</p>
          <div className="flex items-center space-x-2">
            <Label>{num1} + {num2} =</Label>
            <Input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-20"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}