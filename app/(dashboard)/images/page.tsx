import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ImageTable } from './image-table';

export default function ImagesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Obituary Image Files</CardTitle>
        <CardDescription>
          View and manage image files stored in Minio S3.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageTable />
      </CardContent>
    </Card>
  );
}
