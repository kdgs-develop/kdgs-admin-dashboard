'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchObituaryByReferenceAction, fetchImagesForObituaryAction } from './actions';
import { Prisma } from '@prisma/client';
import Image from 'next/image';
import { Download, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

export default function ObituaryPage() {
  const { reference } = useParams();
  const router = useRouter();
  const [obituary, setObituary] = useState<ObituaryWithAllRelations | null>(null);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (reference) {
      fetchObituaryByReferenceAction(reference as string).then((data) => {
        if (data) {
          setObituary(data as ObituaryWithAllRelations);
        }
      });
      fetchImagesForObituaryAction(reference as string).then(setImages);
    }
  }, [reference]);

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/generate-pdf/${reference}`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `obituary_${reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "PDF Downloaded",
        description: "The obituary PDF has been successfully downloaded.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download the obituary PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!obituary) {
    return <div>Loading...</div>;
  }

  const fullName = `${obituary.title?.name || ''} ${obituary.givenNames || ''} ${obituary.surname || ''}`.trim();

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
        <CardContent className="bg-white">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Personal Information</h2>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Title:</dt>
                  <dd className="w-2/3">{obituary.title?.name || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Given Names:</dt>
                  <dd className="w-2/3">{obituary.givenNames || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Surname:</dt>
                  <dd className="w-2/3">{obituary.surname || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Maiden Name:</dt>
                  <dd className="w-2/3">{obituary.maidenName || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Birth Date:</dt>
                  <dd className="w-2/3">{obituary.birthDate?.toDateString() || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Death Date:</dt>
                  <dd className="w-2/3">{obituary.deathDate?.toDateString() || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Place of Death:</dt>
                  <dd className="w-2/3">{obituary.place || 'N/A'}</dd>
                </div>
              </dl>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Also Known As</h2>
              {obituary.alsoKnownAs.length > 0 ? (
                <dl className="space-y-2">
                  {obituary.alsoKnownAs.map((aka, index) => (
                    <div key={index} className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">AKA {index + 1}:</dt>
                      <dd className="w-2/3">{`${aka.surname || ''} ${aka.otherNames || ''}`.trim() || 'N/A'}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p>N/A</p>
              )}
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Relatives</h2>
              {obituary.relatives.length > 0 ? (
                <dl className="space-y-2">
                  {obituary.relatives
                    .filter(relative => relative.relationship) // Filter out relatives with null relationship
                    .map((relative, index) => (
                      <div key={index} className="flex">
                        <dt className="font-medium text-gray-600 w-1/3">{relative.relationship}:</dt>
                        <dd className="w-2/3">
                          {`${relative.givenNames || ''} ${relative.surname || ''} ${relative.predeceased ? '(Predeceased)' : ''}`.trim() || 'N/A'}
                        </dd>
                      </div>
                    ))}
                </dl>
              ) : (
                <p>N/A</p>
              )}
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Publication Details</h2>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Periodical:</dt>
                  <dd className="w-2/3">{obituary.periodical?.name || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Publish Date:</dt>
                  <dd className="w-2/3">{obituary.publishDate?.toDateString() || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Page:</dt>
                  <dd className="w-2/3">{obituary.page || 'N/A'}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Column:</dt>
                  <dd className="w-2/3">{obituary.column || 'N/A'}</dd>
                </div>
              </dl>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Additional Information</h2>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Proofread:</dt>
                  <dd className="w-2/3">
                    <Badge variant={obituary.proofread ? "default" : "secondary"}>
                      {obituary.proofread ? "Yes" : "No"}
                    </Badge>
                  </dd>
                </div>
                {obituary.notes && (
                  <div className="flex">
                    <dt className="font-medium text-gray-600 w-1/3">Notes:</dt>
                    <dd className="w-2/3">{obituary.notes}</dd>
                  </div>
                )}
              </dl>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Obituary Images</h2>
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((image) => (
                    <img
                      key={image}
                      src={`/api/images/${image}`}
                      alt={image}
                      className="w-full h-40 object-cover rounded"
                    />
                  ))}
                </div>
              ) : (
                <p>N/A</p>
              )}
            </section>
          </div>
        </CardContent>
      </Card>
      <div className="mt-8 flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Compiled by Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8</p>
        <p>© 2024 Javier Gongora</p>
      </footer>
    </div>
  );
}