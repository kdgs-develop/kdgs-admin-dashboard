import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Obituary as ObituaryType } from '@/lib/db';
import { deleteObituaryById } from '@/lib/db';

export function Obituary({ obituary }: { obituary: ObituaryType }) {
  return (
    <TableRow>
      <TableCell>{obituary.reference}</TableCell>
      <TableCell>{obituary.surname}</TableCell>
      <TableCell>{obituary.givenNames}</TableCell>
      <TableCell>{obituary.deathDate?.toLocaleDateString()}</TableCell>
      <TableCell>
        <Badge variant={obituary.proofread ? "default" : "secondary"}>
          {obituary.proofread ? "Proofread" : "Not Proofread"}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>
              <form action={deleteObituaryById.bind(null, obituary.id)}>
                <button type="submit">Delete</button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}