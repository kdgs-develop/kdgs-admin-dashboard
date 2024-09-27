'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateReference } from '../actions';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

interface GenerateFileNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateFileNameDialog({ isOpen, onClose }: GenerateFileNameDialogProps) {
  const [surname, setSurname] = useState('');
  const [generatedFileName, setGeneratedFileName] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (surname) {
      const fileName = await generateReference(surname);
      setGeneratedFileName(fileName);
      setIsCopied(false); // Reset copied state when generating new filename
    }
  };

  const handleCopy = () => {
    if (generatedFileName) {
      navigator.clipboard.writeText(generatedFileName);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "File name copied to clipboard.",
      });

      // Reset the button text after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate New File Name</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="surname" className="text-right">
              Surname
            </Label>
            <Input
              id="surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="col-span-3"
            />
          </div>
          {generatedFileName && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">New File Name</Label>
              <div className="col-span-3 font-black text-blue-600">{generatedFileName}</div>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between items-center">
          <AnimatePresence>
            {generatedFileName && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Button 
                  variant="outline" 
                  onClick={handleCopy} 
                  disabled={isCopied}
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy File Name
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Button type="submit" onClick={handleGenerate}>
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}