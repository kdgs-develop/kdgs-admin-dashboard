'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export function BulkUpload() {
  const [showInstructions, setShowInstructions] = useState(false);

  const handleToggleInstructions = () => {
    setShowInstructions(!showInstructions);
    if (!showInstructions) {
      toast({
        title: 'Instructions Displayed',
        description: 'Bulk upload instructions are now visible.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleToggleInstructions} variant="destructive">
        {showInstructions ? 'Hide Bulk Upload Instructions' : 'Show Bulk Upload Instructions'}
      </Button>
      
      {showInstructions && (
        <div className="text-sm text-muted-foreground space-y-4">
          <h3 className="font-semibold text-sm">Bulk Upload using MinIO Client (mc):</h3>
          <p>Follow these steps to perform a bulk upload to your MinIO bucket:</p>

          <div>
            <h4 className="font-semibold text-sm">1. Install MinIO Client (mc):</h4>
            <h5 className="font-semibold text-xs mt-2">For Windows:</h5>
            <ol className="list-decimal list-inside mt-2">
              <li>Download mc.exe from the <a href="https://min.io/download#/windows" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">official MinIO website</a></li>
              <li>Move mc.exe to a directory in your PATH (e.g., C:\Windows\System32\)</li>
            </ol>

            <h5 className="font-semibold text-xs mt-2">For Mac/Linux (AMD64):</h5>
            <ol className="list-decimal list-inside mt-2">
              <li>Open Terminal</li>
              <li>Run the following command:
                <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-xs">
                  wget https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc && sudo mv mc /usr/.local/bin/
                </pre>
              </li>
            </ol>

            <h5 className="font-semibold text-xs mt-2">For Mac/Linux (ARM64):</h5>
            <ol className="list-decimal list-inside mt-2">
              <li>Open Terminal</li>
              <li>Run the following command:
                <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-xs">
                  wget https://dl.min.io/client/mc/release/linux-arm64/mc && chmod +x mc && sudo mv mc /usr/.local/bin/
                </pre>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-sm">2. Configure MinIO Client:</h4>
            <p>Run the following command to configure mc with your MinIO server:</p>
            <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-xs">
            mc alias set myminio https://host:port kdgs-files "MINIO_ACCESS_KEY MINIO_SECRET_KEY
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-sm">3. Perform Bulk Upload:</h4>
            <p>Navigate to the directory containing the files you want to upload, then run:</p>
            <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-xs">
              mc cp --recursive . myminio/kdgs-files
            </pre>
          </div>

          <p className="mt-4"><strong>Note:</strong> Ensure you have the necessary permissions to perform these operations. Always test the process with a small number of files before performing a large bulk upload.</p>

          <p className="mt-4">For more detailed information and advanced usage, refer to the <a href="https://min.io/docs/minio/linux/reference/minio-mc.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">official MinIO Client documentation</a>.</p>
        </div>
      )}
    </div>
  );
}