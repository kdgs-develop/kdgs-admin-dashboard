'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchObituaryByReferenceAction, fetchImagesForObituaryAction, getPublicObituaryByHash } from '@/app/(dashboard)/obituary/[reference]/actions';
import { Prisma } from '@prisma/client';
import Image from 'next/image';
import { Download, Loader2, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ViewImageDialog } from '@/app/(dashboard)/images/view-image-dialog';
import { getImageUrlAction } from '@/app/(dashboard)/images/minio-actions';
import { BucketItem } from 'minio';

type ObituaryWithAllRelations = Prisma.ObituaryGetPayload<{
  include: {
    title: true,
    alsoKnownAs: true,
    birthCity: true,
    deathCity: true,
    cemetery: true,
    periodical: true,
    fileBox: true,
    relatives: true
  }
}>;

export default function PublicObituaryPage() {
  const { hash } = useParams();
  const [obituary, setObituary] = useState<ObituaryWithAllRelations | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<BucketItem | null>(null);

  useEffect(() => {
    async function loadObituary() {
      const data = await getPublicObituaryByHash(hash as string);
      if (data) {
        setObituary(data as ObituaryWithAllRelations);
      }
    }
    loadObituary().then(() => {
      fetchImagesForObituaryAction(obituary?.reference as string).then(setImages);
    });
  }, [hash]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Download PDF
      const pdfResponse = await fetch(`/api/generate-pdf/${obituary?.reference}`);
      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF');
      }
      const pdfBlob = await pdfResponse.blob();
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = `obituary_${obituary?.reference}.pdf`;
      pdfLink.click();
      window.URL.revokeObjectURL(pdfUrl);

      // Download images
      for (const imageName of images) {
        const imageUrl = await getImageUrlAction(imageName);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageName}`);
        }
        const imageBlob = await imageResponse.blob();
        const downloadUrl = window.URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = imageName;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
      }

      toast({
        title: "Download Complete",
        description: "The obituary PDF and images have been downloaded.",
      });
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: "Error",
        description: "Failed to download files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!obituary) {
    return <div>Loading...</div>;
  }

  const fullName = `${obituary.title?.name || ''} ${obituary.givenNames || ''} ${obituary.surname || ''}`.trim();

  const handleRotate = async (fileName: string, degrees: number) => {
    // Implement rotation logic if needed
    console.log(`Rotating ${fileName} by ${degrees} degrees`);
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <Card className="max-w-4xl mx-auto border-t-4 border-blue-600 shadow-lg">
        <CardHeader className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-blue-600">Obituary Index Report</CardTitle>
              <div className="text-sm text-gray-500 mt-2">
                <span className="font-semibold">File Number:</span> {obituary.reference}
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-semibold">Full Name:</span> {fullName}
              </div>
            </div>
            <Image src="/kdgs.png" alt="KDGS Logo" width={100} height={50} className="object-contain" priority />
          </div>
        </CardHeader>
        {/* Rest of the sections remain exactly the same until the buttons section */}
        <CardContent className="bg-white">
          {/* ... Same content sections as the private page ... */}
        </CardContent>
      </Card>
      <div className="mt-8 flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Download PDF & Images
            </>
          )}
        </Button>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Compiled by Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8</p>
        <p>© 2024 Javier Gongora</p>
      </footer>
      {selectedImage && (
        <ViewImageDialog
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onRotate={handleRotate}
          getImageUrl={getImageUrlAction}
        />
      )}
    </div>
  );
} 