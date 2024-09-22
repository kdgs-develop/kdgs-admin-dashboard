import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function ImagesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Files</CardTitle>
        <CardDescription>View and manage image files stored in Minio S3.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Add image file listing and management functionality here */}
      </CardContent>
    </Card>
  );
}