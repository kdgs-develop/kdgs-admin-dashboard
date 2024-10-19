import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OverwriteConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fileName: string;
}

export function OverwriteConfirmationDialog({ isOpen, onConfirm, onCancel, fileName }: OverwriteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm File Overwrite</DialogTitle>
          <DialogDescription>
            The file "{fileName}" already exists. Do you want to overwrite it?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onCancel} variant="outline">Cancel</Button>
          <Button onClick={onConfirm} variant="destructive">Overwrite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}