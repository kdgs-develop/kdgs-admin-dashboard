"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Prisma } from "@prisma/client";
import { ArrowLeft, Download, Eye, Loader2, Share2 } from "lucide-react";
import { BucketItem } from "minio";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getImageUrlAction,
  rotateImageAction
} from "../../images/minio-actions";
import { ViewImageDialog } from "../../images/view-image-dialog";
import {
  fetchImagesForObituaryAction,
  fetchObituaryByReferenceAction,
  generatePublicHashAction
} from "./actions";

type ObituaryWithAllRelations = Prisma.ObituaryGetPayload<{
  include: {
    title: true;
    alsoKnownAs: true;
    birthCity: {
      include: {
        country: true;
      };
    };
    deathCity: {
      include: {
        country: true;
      };
    };
    cemetery: true;
    periodical: true;
    fileBox: true;
    relatives: {
      include: {
        familyRelationship: true;
      };
    };
  };
}>;

export default function ObituaryPage() {
  const { reference } = useParams();
  const router = useRouter();
  const [obituary, setObituary] = useState<ObituaryWithAllRelations | null>(
    null
  );
  const [images, setImages] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<BucketItem | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (reference) {
      const decodedReference = decodeURIComponent(reference as string);

      fetchObituaryByReferenceAction(decodedReference).then(data => {
        if (data) {
          setObituary(data as ObituaryWithAllRelations);
        }
      });
      fetchImagesForObituaryAction(decodedReference).then(setImages);
    }
  }, [reference]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const decodedReference = decodeURIComponent(reference as string);

      // Download PDF
      const pdfResponse = await fetch(
        `/api/generate-pdf/${encodeURIComponent(decodedReference)}`
      );
      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF");
      }
      const pdfBlob = await pdfResponse.blob();
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement("a");
      pdfLink.href = pdfUrl;
      pdfLink.download = `obituary_${decodedReference}.pdf`;
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
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = imageName;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
      }

      toast({
        title: "Download Complete",
        description: "The obituary PDF and images have been downloaded."
      });
    } catch (error) {
      console.error("Error downloading files:", error);
      toast({
        title: "Error",
        description: "Failed to download files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const hash = await generatePublicHashAction(obituary?.id!);
      const publicLink = `${window.location.origin}/public/obituary/${hash}`;
      await navigator.clipboard.writeText(publicLink);
      toast({
        title: "Link Copied",
        description: "Public link has been copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate public link.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (!obituary) {
    return <div>Loading...</div>;
  }

  const fullName =
    `${obituary.title?.name || ""} ${obituary.givenNames || ""} ${obituary.surname || ""}`.trim();

  const handleRotate = async (fileName: string) => {
    rotateImageAction(fileName);
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8 pb-20">
      <Card className="max-w-4xl mx-auto border-t-4 border-blue-600 shadow-lg">
        <CardHeader className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-blue-600">
                Obituary Index Report
              </CardTitle>
              <div className="text-sm text-gray-500 mt-2">
                <span className="font-semibold">File Number:</span>{" "}
                {obituary.reference}
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-semibold">Full Name:</span> {fullName}
              </div>
            </div>
            <Image
              src="/kdgs.png"
              alt="KDGS Logo"
              width={100}
              height={50}
              className="object-contain"
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                Personal Information
              </h2>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Title:</dt>
                  <dd className="w-2/3">{obituary.title?.name || ""}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Given Names:
                  </dt>
                  <dd className="w-2/3">{obituary.givenNames || ""}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Surname:</dt>
                  <dd className="w-2/3">{obituary.surname || ""}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Maiden Name:
                  </dt>
                  <dd className="w-2/3">{obituary.maidenName || ""}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Birth Date:
                  </dt>
                  <dd className="w-2/3">
                    {obituary.birthDate?.toISOString().split("T")[0] || ""}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Place of Birth:
                  </dt>
                  <dd className="w-2/3">
                    {obituary.birthCity?.name || ""}
                    {obituary.birthCity?.name ? ", " : ""}
                    {obituary.birthCity?.province || ""}
                    {obituary.birthCity?.province ? ", " : ""}
                    {obituary.birthCity?.country?.name || ""}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Death Date:
                  </dt>
                  <dd className="w-2/3">
                    {obituary.deathDate?.toISOString().split("T")[0] || ""}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Place of Death:
                  </dt>
                  <dd className="w-2/3">
                    {obituary.deathCity?.name || ""}
                    {obituary.deathCity?.name ? ", " : ""}
                    {obituary.deathCity?.province || ""}
                    {obituary.deathCity?.province ? ", " : ""}
                    {obituary.deathCity?.country?.name || ""}
                  </dd>
                </div>
              </dl>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                Also Known As
              </h2>
              {obituary.alsoKnownAs.length > 0 ? (
                <dl className="space-y-2">
                  {obituary.alsoKnownAs.map((aka, index) => (
                    <div key={index} className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        AKA {index + 1}:
                      </dt>
                      <dd className="w-2/3">
                        {`${aka.surname || ""} ${aka.otherNames || ""}`.trim()}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p></p>
              )}
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                Relatives
              </h2>
              {obituary.relatives.length > 0 ? (
                <dl className="space-y-2">
                  {obituary.relatives.map((relative, index) => (
                    <div key={index} className="flex">
                      <dt className="font-medium text-gray-600 w-1/3">
                        {relative.familyRelationship?.name ||
                          relative.relationship}
                        :
                      </dt>
                      <dd className="w-2/3">
                        {`${relative.givenNames || ""} ${relative.surname || ""} ${relative.predeceased ? "(Predeceased)" : ""}`.trim()}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p></p>
              )}
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                Publication Details
              </h2>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Periodical:
                  </dt>
                  <dd className="w-2/3">{obituary.periodical?.name || ""}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Publish Date:
                  </dt>
                  <dd className="w-2/3">
                    {obituary.publishDate?.toISOString().split("T")[0] || ""}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Page:</dt>
                  <dd className="w-2/3">{obituary.page || ""}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">Column:</dt>
                  <dd className="w-2/3">{obituary.column || ""}</dd>
                </div>
              </dl>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                Additional Information
              </h2>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="font-medium text-gray-600 w-1/3">
                    Proofread:
                  </dt>
                  <dd className="w-2/3">
                    <Badge
                      variant={obituary.proofread ? "default" : "secondary"}
                    >
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
              <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                Obituary Images
              </h2>
              {images.length > 0 ? (
                <ul className="space-y-2">
                  {images.map(image => (
                    <li
                      key={image}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{image}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedImage({ name: image } as BucketItem)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Image
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No images available</p>
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
        <Button
          variant="outline"
          onClick={handleShare}
          disabled={isSharing}
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          {isSharing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Copying Link...
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" /> Share Public Link
            </>
          )}
        </Button>
      </div>
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
