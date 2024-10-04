'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export function DatabaseBackup() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backup-database', {
        method: 'POST',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const currentDate = new Date().toISOString().split('T')[0];
        a.download = `kdgs_database_${currentDate}_dump`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast({
          title: 'Backup Successful',
          description: 'Your database backup has been downloaded.',
        });
      } else {
        throw new Error('Backup failed');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: 'Backup Failed',
        description: 'There was an error creating the database backup.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleBackup} disabled={isLoading}>
        {isLoading ? 'Creating Backup...' : 'Download Database Backup'}
      </Button>
    </div>
  );
}