"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ComboboxFormField from "@/components/ui/combo-form-field";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getUserData } from "@/lib/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Trash2 } from "lucide-react";
import { BucketItem } from "minio";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  addBatchNumber,
  addFamilyRelationship,
  addPeriodical,
  addTitle,
  updateObituaryAction,
} from "./actions";
import { AddBatchNumberDialog } from "./add-batch-number-dialog";
import {
  deleteImageAction,
  getImageUrlAction,
  rotateImageAction,
} from "./images/minio-actions";
import { ViewImageDialog } from "./images/view-image-dialog";
import { fetchImagesForObituaryAction } from "./obituary/[reference]/actions";
import { PeriodicalWithRelations } from "@/types/prisma";

const formSchema = z.object({
  reference: z.string().length(8, "Reference must be 8 characters"),
  surname: z
    .string()
    .optional()
    .transform((val) => val?.toUpperCase()),
  titleId: z.number().nullable().optional(),
  givenNames: z
    .string()
    .optional()
    .transform((val) =>
      val
        ?.split(" ")
        .map(
          (name) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        )
        .join(" ")
    ),
  maidenName: z
    .string()
    .optional()
    .transform((val) => val?.toUpperCase()),
  birthDate: z.coerce.date().optional(),
  birthCityId: z.number().nullable().optional(),
  deathDate: z.date({
    required_error: "Death date is required",
    invalid_type_error: "Please select a valid death date",
  }),
  deathCityId: z.number().nullable().optional(),
  burialCemetery: z.string().optional(),
  cemeteryId: z.number().nullable().optional(),
  periodicalId: z.number().nullable().optional(),
  publishDate: z.coerce.date().optional(),
  page: z.string().max(8, "Page must be 8 characters or less").optional(),
  column: z.string().max(8, "Column must be 8 characters or less").optional(),
  notes: z.string().optional(),
  proofread: z.boolean(),
  proofreadDate: z.coerce.date().nullable(),
  proofreadBy: z.string().optional(),
  enteredBy: z.string().optional(),
  enteredOn: z.coerce.date().optional(),
  editedBy: z.string().optional(),
  editedOn: z.coerce.date().optional(),
  fileBoxId: z.number().nullable().optional(),
  relatives: z
    .array(
      z.object({
        surname: z
          .string()
          .nullable()
          .transform((val) => val?.toUpperCase()),
        givenNames: z
          .string()
          .nullable()
          .transform((val) =>
            val
              ?.split(" ")
              .map(
                (name) =>
                  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
              )
              .join(" ")
          ),
        relationship: z
          .string()
          .nullable()
          .transform((val) => val?.toUpperCase()),
        familyRelationshipId: z.string().optional(),
        predeceased: z.boolean().default(false),
      })
    )
    .optional(),
  batchNumberId: z.string().nullable().optional(),
  alsoKnownAs: z
    .array(
      z.object({
        surname: z
          .string()
          .nullable()
          .transform((val) => val?.toUpperCase()),
        otherNames: z
          .string()
          .nullable()
          .transform((val) =>
            val
              ?.split(" ")
              .map(
                (name) =>
                  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
              )
              .join(" ")
          ),
      })
    )
    .optional(),
});

interface EditObituaryDialogProps {
  obituary: {
    id: number;
    reference: string;
    relatives?: {
      id: number;
      surname: string | null;
      givenNames: string | null;
      relationship: string | null;
      familyRelationshipId: string | null;
      familyRelationship?: {
        id: string;
        name: string;
        category: string;
      } | null;
      predeceased: boolean;
    }[];
    alsoKnownAs?: {
      id: number;
      surname: string | null;
      otherNames: string | null;
    }[];
    [key: string]: any;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedObituary: any) => Promise<void>;
  titles: { id: number; name: string }[];
  cities: {
    id: number;
    name: string | null;
    province: string | null;
    country: { name: string } | null;
  }[];
  cemeteries: {
    id: number;
    name: string;
    city: {
      name: string | null;
      province: string | null;
      country: { name: string } | null;
    };
  }[];
  periodicals: {
    id: number;
    name: string;
    city?: {
      name: string;
      province: string | null;
      country: { name: string } | null;
    } | null;
  }[];
  familyRelationships: { id: string; name: string; category: string }[];
  fileBoxes: { id: number; year: number; number: number }[];
  batchNumbers: {
    id: string;
    number: string;
    assignedObituaries: number;
    createdAt: Date;
    createdBy: { fullName: string | null };
    _count?: { obituaries: number };
  }[];
}

export function EditObituaryDialog({
  obituary,
  isOpen,
  onClose,
  onSave,
  titles,
  cities,
  cemeteries,
  periodicals,
  familyRelationships,
  fileBoxes,
  batchNumbers,
}: EditObituaryDialogProps) {
  console.log("Received obituary data:", obituary);
  console.log("Received obituary AKA data:", obituary.alsoKnownAs);
  console.log("Received batch numbers:", batchNumbers);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ file: File; newName: string }>
  >([]);
  const [existingImages, setExistingImages] = useState<
    Array<{ originalName: string; newName: string }>
  >([]);
  const [selectedImage, setSelectedImage] = useState<BucketItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [sumChallenge, setSumChallenge] = useState({ a: 0, b: 0 });
  const [sumAnswer, setSumAnswer] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updatedObituary, setUpdatedObituary] = useState<any>(obituary);
  const [role, setRole] = useState<string | null>(null);
  const [currentUserFullName, setCurrentUserFullName] = useState<string | null>(
    null
  );

  const [localTitles, setLocalTitles] = useState(titles);
  const [localCities, setLocalCities] = useState(cities);
  const [localPeriodicals, setLocalPeriodicals] = useState(periodicals);
  const [localFamilyRelationships, setLocalFamilyRelationships] =
    useState(familyRelationships);

  const [includeOtherFamilyText, setIncludeOtherFamilyText] = useState(false);

  const [isAddBatchNumberDialogOpen, setIsAddBatchNumberDialogOpen] =
    useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference: obituary.reference || "",
      surname: obituary.surname || "",
      titleId: obituary.titleId || undefined,
      givenNames: obituary.givenNames || "",
      maidenName: obituary.maidenName || "",
      birthDate: obituary.birthDate ? new Date(obituary.birthDate) : undefined,
      birthCityId: obituary.birthCityId || undefined,
      deathDate: obituary.deathDate ? new Date(obituary.deathDate) : undefined,
      deathCityId: obituary.deathCityId || undefined,
      burialCemetery: obituary.burialCemetery || "",
      cemeteryId: obituary.cemeteryId || undefined,
      periodicalId: obituary.periodicalId || undefined,
      publishDate: obituary.publishDate
        ? new Date(obituary.publishDate)
        : undefined,
      page: obituary.page || "",
      column: obituary.column || "",
      notes: obituary.notes || "",
      proofread: obituary.proofread || false,
      proofreadDate: obituary.proofreadDate
        ? new Date(obituary.proofreadDate)
        : null,
      proofreadBy: obituary.proofreadBy || "",
      enteredBy: obituary.enteredBy || "",
      enteredOn: obituary.enteredOn ? new Date(obituary.enteredOn) : undefined,
      editedBy: currentUserFullName || "",
      editedOn: new Date(),
      fileBoxId: obituary.fileBoxId || undefined,
      relatives:
        obituary.relatives?.map((relative) => ({
          surname: relative.surname || "",
          givenNames: relative.givenNames || "",
          relationship: relative.relationship || "",
          familyRelationshipId: relative.familyRelationshipId || undefined,
          predeceased: relative.predeceased || false,
        })) || [],
      alsoKnownAs:
        obituary.alsoKnownAs?.map((aka) => ({
          surname: aka.surname || "",
          otherNames: aka.otherNames || "",
        })) || [],
      batchNumberId: obituary.batchNumberId || "",
    },
  });

  const hasImages = existingImages.length > 0 || selectedFiles.length > 0;

  const isProofread = form.watch("proofread");

  useEffect(() => {
    async function fetchUserData() {
      const fetchedUserData = await getUserData();
      setRole(fetchedUserData?.role!);
      setCurrentUserFullName(fetchedUserData?.fullName!);
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    if (isOpen && obituary.reference) {
      fetchImagesForObituaryAction(obituary.reference).then((images) => {
        const formattedImages = images.map((image, index) => ({
          originalName: image,
          newName: generateNewFileName(obituary.reference, index, image),
        }));
        setExistingImages(formattedImages);
      });
    }
  }, [isOpen, obituary.reference]);

  const generateNewFileName = (
    reference: string,
    index: number,
    fileName: string
  ) => {
    const extension = fileName.split(".").pop();
    if (index === 0) {
      return `${reference}.${extension}`;
    }
    const letter = String.fromCharCode(97 + index - 1); // 'a' for the second file, 'b' for the third, etc.
    return `${reference}${letter}.${extension}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map((file, index) => ({
      file,
      newName: generateNewFileName(
        obituary.reference,
        existingImages.length + selectedFiles.length + index,
        file.name
      ),
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteImage = (imageName: string) => {
    setImageToDelete(imageName);
    setSumChallenge({
      a: Math.floor(Math.random() * 10),
      b: Math.floor(Math.random() * 10),
    });
    setSumAnswer("");
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (
      imageToDelete &&
      parseInt(sumAnswer) === sumChallenge.a + sumChallenge.b
    ) {
      await deleteImageAction(imageToDelete);
      setExistingImages((prev) =>
        prev.filter((img) => img.newName !== imageToDelete)
      );
      setIsDeleteDialogOpen(false);
      setImageToDelete(null);
      setSumAnswer("");
    }
  };

  const handleProofreadChange = (checked: boolean) => {
    if (!hasImages) return;
    form.setValue("proofread", checked);
    if (checked) {
      form.setValue("proofreadDate", new Date());
      form.setValue("proofreadBy", currentUserFullName || "");
    } else {
      form.setValue("proofreadDate", null);
      form.setValue("proofreadBy", "");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { relatives, alsoKnownAs, ...obituaryData } = values;

      // Prepare relatives data without obituaryId
      const relativesData =
        relatives?.map((relative) => ({
          surname: relative.surname || "",
          givenNames: relative.givenNames || "",
          relationship: relative.relationship || "",
          familyRelationshipId: relative.familyRelationshipId || null,
          predeceased: relative.predeceased,
        })) || [];

      // Prepare alsoKnownAs data
      const alsoKnownAsData =
        alsoKnownAs?.map((aka) => ({
          surname: aka.surname || "",
          otherNames: aka.otherNames || "",
        })) || [];

      // Handle new image uploads
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("files", file.file, file.newName);
        });

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload new images");
        }
      }

      // Update the obituary
      const updatedObituary = await updateObituaryAction(
        obituary.id,
        obituaryData,
        relativesData,
        alsoKnownAsData
      );

      if (!updatedObituary) {
        throw new Error("Failed to update obituary - no response received");
      }

      await onSave(updatedObituary);
      onClose();
      toast({
        title: "Success",
        description: "The obituary has been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating obituary:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? `Failed to update obituary: ${error.message}`
            : "An unexpected error occurred while updating the obituary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentNotes = form.getValues("notes") || "";
    const familyText = "See obituary image for other family members.";
    if (currentNotes.includes(familyText)) {
      setIncludeOtherFamilyText(true);
    }
  }, [form]);

  useEffect(() => {
    if (obituary.alsoKnownAs?.length) {
      // Force update the form with AKA values
      form.setValue(
        "alsoKnownAs",
        obituary.alsoKnownAs.map((aka) => ({
          surname: aka.surname || "",
          otherNames: aka.otherNames || "",
        }))
      );
    }
  }, [obituary.alsoKnownAs, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto"
        autoFocus={false}
      >
        <DialogHeader>
          <DialogTitle>Edit Obituary</DialogTitle>
          <DialogDescription>
            Make changes to the obituary details here. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              if (errors.deathDate) {
                toast({
                  title: "Death Date is required",
                  description: "Please select a valid death date",
                  variant: "destructive",
                });
              }
            })}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Personal Information */}
              <h3 className="text-lg font-semibold col-span-2">
                Personal Information
              </h3>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">File Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          readOnly
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Surname</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ComboboxFormField
                  control={form.control}
                  name="titleId"
                  label="Title"
                  placeholder="Select a title"
                  emptyText="No title found."
                  items={localTitles}
                  onAddItem={async (name) => {
                    const newTitle = await addTitle(name);
                    setLocalTitles([
                      ...localTitles,
                      { id: newTitle.id, name: newTitle?.name! },
                    ]);
                    return { id: newTitle.id, name: newTitle?.name! };
                  }}
                />
                <FormField
                  control={form.control}
                  name="givenNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Given Names</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm capitalize" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maidenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Maiden Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates and Location Information */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Birth Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ComboboxFormField
                  control={form.control}
                  name="birthCityId"
                  label="Birth Place"
                  placeholder="Select a place"
                  emptyText="No place found."
                  items={localCities.map((city) => ({
                    id: city.id,
                    name: [city.name, city.province, city.country?.name]
                      .filter(Boolean)
                      .join(", "),
                    province: city.province ?? undefined,
                    country: city.country
                      ? { name: city.country.name }
                      : undefined,
                  }))}
                />
                <FormField
                  control={form.control}
                  name="deathDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Death Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ComboboxFormField
                  control={form.control}
                  name="deathCityId"
                  label="Death Place"
                  placeholder="Select a place"
                  emptyText="No place found."
                  items={localCities.map((city) => ({
                    id: city.id,
                    name: [city.name, city.province, city.country?.name]
                      .filter(Boolean)
                      .join(", "),
                    province: city.province ?? undefined,
                    country: city.country
                      ? { name: city.country.name }
                      : undefined,
                  }))}
                />
                <ComboboxFormField
                  control={form.control}
                  name="cemeteryId"
                  label="Interment Place"
                  placeholder="Select an interment place"
                  emptyText="No interment place found."
                  items={cemeteries.map((cemetery) => ({
                    id: cemetery.id,
                    name: cemetery.name,
                    city: cemetery.city
                      ? {
                          name: cemetery.city.name,
                          province: cemetery.city.province ?? undefined,
                          country: cemetery.city.country
                            ? { name: cemetery.city.country.name }
                            : undefined,
                        }
                      : undefined,
                  }))}
                />
              </div>
            </div>

            {/* Also Known As */}
            <div className="space-y-2">
              <FormLabel className="text-xs flex">Also Known As</FormLabel>
              {form.watch("alsoKnownAs")?.map((_, index) => (
                <div key={index} className="flex items-end space-x-2">
                  <FormField
                    control={form.control}
                    name={`alsoKnownAs.${index}.surname`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Surname</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-8 text-sm uppercase"
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value.toUpperCase());
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`alsoKnownAs.${index}.otherNames`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Other Names</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-8 text-sm capitalize"
                            value={field.value || ""}
                            onChange={(e) => {
                              const formatted = e.target.value
                                .split(" ")
                                .map(
                                  (name) =>
                                    name.charAt(0).toUpperCase() +
                                    name.slice(1).toLowerCase()
                                )
                                .join(" ");
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const alsoKnownAs = form.getValues("alsoKnownAs") || [];
                      form.setValue(
                        "alsoKnownAs",
                        alsoKnownAs.filter((_, i) => i !== index)
                      );
                    }}
                    className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const alsoKnownAs = form.getValues("alsoKnownAs") || [];
                  form.setValue("alsoKnownAs", [
                    ...alsoKnownAs,
                    { surname: "", otherNames: "" },
                  ]);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Also Known As
              </Button>
            </div>

            {/* Obituary Files */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Files</h3>

              <FormLabel className="text-xs">Obituary Images</FormLabel>
              {existingImages.length > 0 && (
                <div className="mb-2 space-y-2">
                  {existingImages.map((image, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {image.originalName}{" "}
                        {image.originalName !== image.newName &&
                          `→ ${image.newName}`}
                      </span>
                      <div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedImage({
                              name: image.newName,
                            } as BucketItem)
                          }
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteImage(image.newName)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedFiles.length > 0 && (
                <div className="mb-2 space-y-2">
                  {selectedFiles.map((fileItem, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {fileItem.file.name} → {fileItem.newName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add New Image File
                </Button>
              </div>
            </div>

            {/* Publication Information */}
            <div className="grid grid-cols-2 gap-4">
              <h3 className="text-lg font-semibold col-span-2">
                Publication Information
              </h3>
              <div className="space-y-2">
                <ComboboxFormField
                  control={form.control}
                  name="periodicalId"
                  label="Publication"
                  placeholder="Select a periodical"
                  emptyText="No periodical found."
                  items={localPeriodicals.map((periodical) => ({
                    id: periodical.id,
                    name: periodical.name,
                    city: periodical.city
                      ? {
                          name: periodical.city.name || "",
                          province: periodical.city.province || undefined,
                          country: periodical.city.country
                            ? { name: periodical.city.country.name }
                            : undefined,
                        }
                      : undefined,
                  }))}
                  onAddItem={async (name) => {
                    const newPeriodical = await addPeriodical(name);
                    const formattedPeriodical = {
                      id: newPeriodical.id,
                      name: newPeriodical.name || "",
                      city: newPeriodical.city
                        ? {
                            name: newPeriodical.city.name || "",
                            province: newPeriodical.city.province,
                            country: newPeriodical.city.country,
                          }
                        : null,
                    };
                    setLocalPeriodicals([
                      ...localPeriodicals,
                      formattedPeriodical,
                    ]);
                    return {
                      id: newPeriodical.id,
                      name: newPeriodical.name || "",
                      city: newPeriodical.city
                        ? {
                            name: newPeriodical.city.name || "",
                            province: newPeriodical.city.province || undefined,
                            country: newPeriodical.city.country
                              ? { name: newPeriodical.city.country.name }
                              : undefined,
                          }
                        : undefined,
                    };
                  }}
                />
                <FormField
                  control={form.control}
                  name="publishDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Publish Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="-mt-2">
                <FormField
                  control={form.control}
                  name="page"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Page</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="column"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Column</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Relatives */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Relatives</h3>
              {form.watch("relatives")?.map((relative, index) => (
                <div key={index} className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name={`relatives.${index}.surname`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Surname</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-8 text-sm uppercase"
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value.toUpperCase());
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`relatives.${index}.givenNames`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Given Names</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-8 text-sm"
                            value={field.value || ""}
                            onChange={(e) => {
                              const formatted = e.target.value
                                .split(/(\(|\)|\s+)/) // Split on spaces and brackets
                                .filter((word) => word.trim()) // Remove empty strings
                                .map((word) => {
                                  if (word === "(" || word === ")") return word;
                                  return (
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                  );
                                })
                                .join(" ")
                                .replace(/\s*\(\s*/g, " (") // Clean up spaces around brackets
                                .replace(/\s*\)\s*/g, ") ")
                                .trim();
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!form.getValues(`relatives.${index}.familyRelationshipId`) &&
                  form.getValues(`relatives.${index}.relationship`) ? (
                    <FormField
                      control={form.control}
                      name={`relatives.${index}.relationship`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Relationship
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-8 text-sm"
                              value={field.value || ""}
                              onChange={(e) => {
                                const formatted = e.target.value.toUpperCase();
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ) : (
                    <ComboboxFormField
                      control={form.control}
                      name={`relatives.${index}.familyRelationshipId`}
                      label="Relationship"
                      placeholder="Select a relationship"
                      emptyText="No relationship found."
                      items={localFamilyRelationships}
                      onAddItem={async (name) => {
                        const newFamilyRelationship =
                          await addFamilyRelationship(name);
                        setLocalFamilyRelationships([
                          ...localFamilyRelationships,
                          {
                            id: newFamilyRelationship.id,
                            name: newFamilyRelationship?.name!,
                            category: newFamilyRelationship?.category!,
                          },
                        ]);
                        return {
                          id: newFamilyRelationship.id,
                          name: newFamilyRelationship?.name!,
                        };
                      }}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name={`relatives.${index}.predeceased`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Predeceased</FormLabel>
                        <FormControl>
                          <div className="h-8 rounded-md border border-input bg-background px-3 flex items-center space-x-2">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-sm text-muted-foreground">
                              {field.value ? "Yes" : "No"}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const relatives = form.getValues("relatives");
                      relatives?.splice(index, 1);
                      form.setValue("relatives", relatives || []);
                    }}
                    className="h-8 mt-8 hover:bg-destructive/10 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const relatives = form.getValues("relatives") || [];
                  form.setValue("relatives", [
                    ...relatives,
                    {
                      surname: "",
                      givenNames: "",
                      relationship: "",
                      familyRelationshipId: "",
                      predeceased: false,
                    },
                  ]);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Relative
              </Button>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="includeOtherFamily"
                  checked={includeOtherFamilyText}
                  onCheckedChange={(checked) => {
                    setIncludeOtherFamilyText(checked as boolean);
                    const currentNotes = form.getValues("notes") || "";
                    const familyText =
                      "See obituary image for other family members.";

                    if (checked) {
                      // Add the text on a new line if there's existing content
                      const newNotes = currentNotes
                        ? `${currentNotes}\n${familyText}`
                        : familyText;
                      form.setValue("notes", newNotes);
                    } else {
                      // Remove the text and any empty lines
                      const newNotes = currentNotes
                        .split("\n")
                        .filter((line) => line !== familyText)
                        .join("\n");
                      form.setValue("notes", newNotes);
                    }
                  }}
                />
                <label
                  htmlFor="includeOtherFamily"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include other family members note
                </label>
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="h-20 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Proofread Information */}
            <div className="grid grid-cols-2 gap-4">
              <h3 className="text-lg font-semibold col-span-2">
                Proofread Information
              </h3>
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="proofread"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            handleProofreadChange(checked as boolean);
                          }}
                          disabled={
                            (role !== "ADMIN" &&
                              role !== "PROOFREADER" &&
                              role !== "PROCESS_MANAGER") ||
                            !hasImages
                          }
                        />
                      </FormControl>
                      <FormLabel className="text-xs">Proofread</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="proofreadDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Proofread Date</FormLabel>
                      {role === "ADMIN" || role === "PROOFREADER" ? (
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      ) : (
                        <Input type="date" className="h-8 text-sm" disabled />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="proofreadBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Proofread By</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          disabled={role !== "ADMIN" && role !== "PROOFREADER"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <h3 className="text-lg font-semibold col-span-2">Metadata</h3>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="enteredBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Entered By</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          disabled={role !== "ADMIN"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enteredOn"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Entered On</FormLabel>
                      {role === "ADMIN" ? (
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      ) : (
                        <Input
                          type="date"
                          className="h-8 text-sm"
                          disabled
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="editedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Edited By</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          disabled
                          value={currentUserFullName || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="editedOn"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Edited On</FormLabel>
                      {role === "ADMIN" ? (
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      ) : (
                        <Input
                          type="date"
                          className="h-8 text-sm"
                          disabled
                          value={new Date().toISOString().split("T")[0]}
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2 items-start">
                <ComboboxFormField
                  control={form.control}
                  name="batchNumberId"
                  label="Batch Number"
                  placeholder="Select a batch number"
                  emptyText="No batch numbers found."
                  items={batchNumbers.map((batch) => {
                    console.log("Processing batch:", batch);
                    return {
                      id: batch.id,
                      name: `${batch.number} (${batch._count?.obituaries} of ${batch.assignedObituaries} done) Created by ${batch.createdBy?.fullName || "Unknown"} on ${batch.createdAt.toLocaleDateString()}`,
                    };
                  })}
                  onAddItem={async (name) => {
                    const newBatch = await addBatchNumber(name);
                    console.log("New batch created:", newBatch);
                    setIsAddBatchNumberDialogOpen(false);
                    return {
                      id: newBatch.id,
                      name: `${newBatch.number} (0 of ${newBatch.assignedObituaries} done) Created by ${newBatch.createdBy?.fullName || "Unknown"} on ${newBatch.createdAt.toLocaleDateString()}`,
                    };
                  }}
                />
                <div className="pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddBatchNumberDialogOpen(true)}
                    className="h-8 mt-1"
                  >
                    <PlusCircle className="h-3 w-3 mr-2" />
                    Create new batch number
                  </Button>
                </div>
              </div>
            </div>

            {/* File Box */}
            <h3 className="text-lg font-semibold col-span-2">
              Document Storage
            </h3>
            <ComboboxFormField
              control={form.control}
              name="fileBoxId"
              label="File Box"
              placeholder="Select a file box"
              emptyText="No file box found."
              items={fileBoxes.map((box) => ({
                id: box.id,
                name:
                  box.id === 0
                    ? "Not available"
                    : `${box.year} : ${box.number}`,
              }))}
              onAddItem={async (name) => {
                toast({
                  title: "Cannot add new file box",
                  description:
                    "File boxes are managed separately. Please contact an administrator.",
                  variant: "destructive",
                });
                const tempId = Date.now();
                return { id: tempId, name };
              }}
            />

            <DialogFooter className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* ViewImageDialog */}
      {selectedImage && (
        <ViewImageDialog
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          getImageUrl={getImageUrlAction}
          onRotate={rotateImageAction}
        />
      )}

      {/* DeleteImageDialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone. To confirm, please solve the following sum:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {sumChallenge.a} + {sumChallenge.b} = ?
            </p>
            <Input
              type="number"
              value={sumAnswer}
              onChange={(e) => setSumAnswer(e.target.value)}
              placeholder="Enter the sum"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDeleteImage} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddBatchNumberDialog
        isOpen={isAddBatchNumberDialogOpen}
        onClose={() => setIsAddBatchNumberDialogOpen(false)}
        onAdd={async (number) => {
          const newBatch = await addBatchNumber(number);
          // Update local batch numbers state if needed
          setIsAddBatchNumberDialogOpen(false);
        }}
      />
    </Dialog>
  );
}
