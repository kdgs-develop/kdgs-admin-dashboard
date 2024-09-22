import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle } from 'lucide-react';
import { fetchObituariesAction } from './actions';
import { ObituariesTable } from './obituaries-table';

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { q?: string; offset?: string };
}) {
  const offset = Number(searchParams.offset) || 0;
  const limit = 5;
  const search = searchParams.q || '';

  const { obituaries, total: totalObituaries } = await fetchObituariesAction(
    offset,
    limit,
    search
  );

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="proofread">Proofread</TabsTrigger>
          <TabsTrigger value="not-proofread">Not Proofread</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Obituary
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <ObituariesTable
          obituaries={obituaries}
          offset={offset}
          totalObituaries={totalObituaries}
          onRefresh={async () => {
            'use server';
            return fetchObituariesAction(offset, limit, search);
          }}
          search={search}
        />
      </TabsContent>
    </Tabs>
  );
}
