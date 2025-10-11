import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TableCell, TableRow } from "@/components/ui/table";
import { Obituary as ObituaryType } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteObituary, getEditObituaryDialogData } from "./actions";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { EditObituaryDialog } from "./edit-obituary-dialog";

export function Obituary({
  obituary,
  onUpdate,
  role
}: {
  obituary: NonNullable<ObituaryType>;
  onUpdate: () => void;
  role: string | null;
}) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<Awaited<
    ReturnType<typeof getEditObituaryDialogData>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleViewClick = () => {
    router.push(`/dashboard/obituary/${obituary.reference}`);
  };

  const handleEditClick = async () => {
    if (!dialogData) {
      const data = await getEditObituaryDialogData();
      setDialogData(data);
    }
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const formData = new FormData();
    formData.append("id", obituary.id.toString());
    await deleteObituary(formData);
    onUpdate();
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      {/* Desktop Table Row */}
      <TableRow className="hidden table:table-row hover:bg-blue-100/50 transition-colors duration-200">
        <TableCell className="whitespace-pre">{obituary.reference}</TableCell>
        <TableCell>{obituary.surname ?? "N/A"}</TableCell>
        <TableCell>{obituary.givenNames ?? "N/A"}</TableCell>
        <TableCell>
          {obituary.deathDate
            ? obituary.deathDate.toISOString().split("T")[0]
            : "N/A"}
        </TableCell>
        <TableCell className="w-[200px]">
          <div className="w-full">
            {obituary.images && obituary.images.length > 0 ? (
              obituary.images.length === 1 ? (
                <span className="truncate">{obituary.images[0].name}</span>
              ) : (
                <ul className="list-none space-y-1">
                  {obituary.images.map((image, index) => (
                    <li key={index} className="truncate text-xs">
                      {image.name}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              "No images"
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={obituary.proofread ? "outline" : "destructive"}>
            {obituary.proofread ? "Proofread" : "Not Proofread"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button
              onClick={handleViewClick}
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200"
            >
              View Report
            </Button>
            {(role === "ADMIN" ||
              role === "PROOFREADER" ||
              role === "INDEXER") && (
              <Button
                onClick={handleEditClick}
                size="sm"
                disabled={
                  role !== "ADMIN" &&
                  role !== "PROOFREADER" &&
                  role !== "INDEXER"
                }
                className="bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200"
              >
                Edit
              </Button>
            )}
            {role === "ADMIN" && (
              <Button
                onClick={handleDeleteClick}
                size="sm"
                disabled={role !== "ADMIN"}
                className="bg-gray-400 hover:bg-gray-500 text-white transition-colors duration-200"
              >
                Delete
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Mobile Card Layout */}
      <TableRow className="table:hidden hover:bg-blue-100/50 transition-colors duration-200">
        <TableCell colSpan={7} className="p-0">
          <div className="p-3 border-b hover:bg-blue-100/30 transition-colors duration-200">
            {/* Three-column layout for medium screens (600px-1014px) */}
            <div className="grid grid-cols-1 card:grid-cols-3 gap-4">
              {/* Left Column - Main Info */}
              <div className="card:col-span-2 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      File Number:
                    </span>
                    <div className="font-mono">{obituary.reference}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Death Date:
                    </span>
                    <div>
                      {obituary.deathDate
                        ? obituary.deathDate.toISOString().split("T")[0]
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Surname:</span>
                    <div>{obituary.surname ?? "N/A"}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Given Names:
                    </span>
                    <div>{obituary.givenNames ?? "N/A"}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Images:</span>
                    <div className="text-xs">
                      {obituary.images && obituary.images.length > 0 ? (
                        obituary.images.length === 1 ? (
                          <span className="truncate">
                            {obituary.images[0].name}
                          </span>
                        ) : (
                          `${obituary.images.length} images`
                        )
                      ) : (
                        "No images"
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div>
                      <Badge
                        variant={obituary.proofread ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {obituary.proofread ? "Proofread" : "Not Proofread"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Action Buttons */}
              <div className="flex card:flex-col gap-2 pt-1 card:pt-0">
                {/* Primary Action - View Report */}
                <Button
                  onClick={handleViewClick}
                  size="sm"
                  className="bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200 w-full card:w-full"
                >
                  View Report
                </Button>

                {/* Secondary Actions - Edit and Delete */}
                {(role === "ADMIN" ||
                  role === "PROOFREADER" ||
                  role === "INDEXER" ||
                  role === "ADMIN") && (
                  <>
                    {(role === "ADMIN" ||
                      role === "PROOFREADER" ||
                      role === "INDEXER") && (
                      <Button
                        onClick={handleEditClick}
                        size="sm"
                        disabled={
                          role !== "ADMIN" &&
                          role !== "PROOFREADER" &&
                          role !== "INDEXER"
                        }
                        className="bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200 flex-1 card:w-full card:flex-none"
                      >
                        Edit
                      </Button>
                    )}
                    {role === "ADMIN" && (
                      <Button
                        onClick={handleDeleteClick}
                        size="sm"
                        disabled={role !== "ADMIN"}
                        className="bg-gray-400 hover:bg-gray-500 text-white transition-colors duration-200 flex-1 card:w-full card:flex-none"
                      >
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
      {dialogData && (
        <EditObituaryDialog
          obituary={obituary}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={async updatedObituary => {
            onUpdate();
            setTimeout(() => {
              window.location.reload();
            }, 100);
            setIsEditDialogOpen(false);
          }}
          {...dialogData}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
