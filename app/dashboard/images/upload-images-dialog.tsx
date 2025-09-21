// 'use client';

// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { useEffect, useRef, useState } from 'react';

// interface UploadImagesDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export function UploadImagesDialog({
//   isOpen,
//   onClose
// }: UploadImagesDialogProps) {
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [isUploading, setIsUploading] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (!isOpen) {
//       setSelectedFiles([]);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//     }
//   }, [isOpen]);

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(event.target.files || []);
//     setSelectedFiles(files.slice(0, 25)); // Limit to 25 files
//   };

//   const handleUpload = async () => {
//     if (selectedFiles.length > 0) {
//       setIsUploading(true);
//       try {
//         const formData = new FormData();
//         selectedFiles.forEach((file) => formData.append('files', file));

//         const response = await fetch('/api/upload', {
//           method: 'POST',
//           body: formData,
//         });

//         if (!response.ok) {
//           throw new Error('Upload failed');
//         }

//         console.log('Upload completed successfully');
//         onClose();
//       } catch (error) {
//         console.error('Error uploading files:', error);
//         // You might want to show an error message to the user here
//       } finally {
//         setIsUploading(false);
//       }
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Upload Images</DialogTitle>
//           <DialogDescription>
//             Upload images to the obituary index.
//           </DialogDescription>
//         </DialogHeader>
//         <div className="space-y-4">
//           <Input
//             type="file"
//             accept="image/*"
//             multiple
//             onChange={handleFileChange}
//             ref={fileInputRef}
//           />
//           <p className="text-sm text-muted-foreground">
//             Selected files: {selectedFiles.length} (max 25)
//           </p>
//           <Button onClick={handleUpload} disabled={isUploading}>
//             {isUploading ? 'Uploading...' : 'Upload'}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
