interface BatchNumberData {
  batchNumbers: {
    id: string;
    number: string;
    createdBy: { fullName: string | null };
    createdAt: Date;
    _count?: { obituaries: number };
    assignedObituaries: number;
    latestEditDate: Date | null;
    latestEditorName: string | null;
    latestEditorRole: string | null;
  }[];
  totalCount: number;
  totalPages: number;
}

{
  batch.latestEditDate && (
    <div className="mt-1 text-xs text-muted-foreground">
      Last updated: {new Date(batch.latestEditDate).toLocaleString()}
      {batch.latestEditorName && (
        <span className="ml-1 text-xs font-semibold text-primary">
          by {batch.latestEditorName}
          {batch.latestEditorRole && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({batch.latestEditorRole})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
