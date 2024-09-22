import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function SetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup</CardTitle>
        <CardDescription>Configure your obituary management system.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Add setup configuration options here */}
      </CardContent>
    </Card>
  );
}