"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import { Edit2, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  createGenealogist,
  deleteGenealogist,
  getGenealogists,
  updateGenealogist,
  updateGenealogistPassword,
  cleanupOrphanedGenealogists,
} from "./actions";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface Genealogist {
  id: number;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string | null;
}

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["VIEWER", "SCANNER", "INDEXER", "PROOFREADER", "ADMIN"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export function GenealogistAdministration() {
  const dashboard_url = process.env.NEXT_PUBLIC_DASHBOARD_URL!;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;

  const [genealogists, setGenealogists] = useState<Genealogist[]>([]);
  const [editingGenealogist, setEditingGenealogist] =
    useState<Genealogist | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [emailDetails, setEmailDetails] = useState<{
    to: string;
    name: string;
    password: string;
    role: string;
    isResend: boolean;
  } | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "newPassword" | null
  >(null);
  const [selectedGenealogist, setSelectedGenealogist] =
    useState<Genealogist | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "VIEWER",
      password: "",
    },
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const fetchGenealogists = async () => {
    try {
      const fetchedGenealogists = await getGenealogists();
      setGenealogists(fetchedGenealogists);
    } catch (error) {
      console.error("Error fetching genealogists:", error);
      toast({ title: "Error fetching genealogists", variant: "destructive" });
    }
  };

  useEffect(() => {
    const initializeAdminPanel = async () => {
      try {
        // First cleanup orphaned records
        const cleanupResults = await cleanupOrphanedGenealogists();
        console.log("Cleanup completed:", cleanupResults);

        // Then fetch the updated list
        const updatedGenealogists = await getGenealogists();
        setGenealogists(updatedGenealogists);
      } catch (error) {
        console.error("Error initializing admin panel:", error);
        toast({
          title: "Error initializing admin panel",
          description: "Failed to cleanup orphaned records",
          variant: "destructive",
        });
      }
    };

    initializeAdminPanel();
  }, []);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const generateSecurePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    form.setValue("password", password);
    return password;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const newGenealogist = await createGenealogist({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
        role: data.role,
        password: data.password,
      });

      if (newGenealogist && newGenealogist.email) {
        await sendWelcomeEmail(
          {
            email: newGenealogist.email,
            fullName:
              newGenealogist.fullName || `${data.firstName} ${data.lastName}`,
            role: newGenealogist.role || data.role,
            id: newGenealogist.id,
          },
          data.password,
          false
        );
      } else {
        throw new Error("Failed to create genealogist or email is missing");
      }

      toast({ title: "Genealogist created successfully" });
      fetchGenealogists();
      form.reset();
    } catch (error) {
      console.error("Error creating genealogist:", error);
      toast({
        title: "Error creating genealogist",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const sendEmail = async (details: NonNullable<typeof emailDetails>) => {
    if (isSending) return;
    setIsSending(true);
    try {
      if (!details || !details.to) {
        console.error("Email details:", details);
        throw new Error("Recipient email is missing");
      }

      emailjs.init(publicKey);

      const templateParams = {
        to_email: details.to,
        to_name: details.name,
        password: details.password,
        role: details.role,
        dashboard_url: dashboard_url,
        is_resend: details.isResend,
      };

      console.log("Sending email with params:", templateParams);

      const result = await emailjs.send(serviceId, templateId, templateParams);

      if (result.text !== "OK") {
        throw new Error("Failed to send email");
      }

      toast({
        title: details.isResend ? "New password sent" : "Welcome email sent",
        description: `Email sent successfully to ${details.to}`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error sending email",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendWelcomeEmail = async (
    genealogist: {
      email: string;
      fullName: string;
      role: string;
      id: number;
    },
    password: string,
    isResend: boolean = false
  ) => {
    if (!genealogist.email) {
      throw new Error("Genealogist email is missing");
    }

    const details = {
      to: genealogist.email,
      name: genealogist.fullName,
      password: password,
      role: genealogist.role,
      isResend: isResend,
    };

    setEmailDetails(details);
    await sendEmail(details);
  };

  const handleDeleteGenealogist = (genealogist: Genealogist) => {
    setSelectedGenealogist(genealogist);
    setConfirmAction("delete");
    setIsConfirmDialogOpen(true);
  };

  const handleSendNewPassword = (genealogist: Genealogist) => {
    setSelectedGenealogist(genealogist);
    setConfirmAction("newPassword");
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedGenealogist) return;

    try {
      if (confirmAction === "newPassword") {
        const newPassword = generateSecurePassword();
        await updateGenealogistPassword(selectedGenealogist.id, newPassword);
        await sendWelcomeEmail(
          {
            email: selectedGenealogist.email,
            fullName: selectedGenealogist.fullName || "Genealogist",
            role: selectedGenealogist.role || "Unknown",
            id: selectedGenealogist.id,
          },
          newPassword,
          true
        );
      } else if (confirmAction === "delete") {
        await deleteGenealogist(selectedGenealogist.id);
      }
      fetchGenealogists();
    } catch (error) {
      console.error("Error in handleConfirmAction:", error);
      throw error; // Rethrow the error to be caught in handleConfirmAction
    } finally {
      setIsConfirmDialogOpen(false);
      setSelectedGenealogist(null);
      setConfirmAction(null);
    }
  };

  const openEditDialog = (genealogist: Genealogist) => {
    setEditingGenealogist(genealogist);
    setEditPhone(genealogist.phone || "");
    setEditRole(genealogist.role || "");
    setIsEditDialogOpen(true);
  };

  const handleEditGenealogist = async () => {
    if (!editingGenealogist) return;

    try {
      await updateGenealogist({
        id: editingGenealogist.id,
        phone: editPhone,
        role: editRole as Role,
      });
      toast({ title: "Genealogist updated successfully" });
      fetchGenealogists();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ title: "Error updating genealogist", variant: "destructive" });
    }
  };

  const handleManualCleanup = async () => {
    try {
      await cleanupOrphanedGenealogists();
      await fetchGenealogists();
      toast({
        title: "Cleanup completed",
        description: "Successfully removed orphaned records",
      });
    } catch (error) {
      console.error("Error during manual cleanup:", error);
      toast({
        title: "Error during cleanup",
        description: "Failed to cleanup orphaned records",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-[calc(100%)]">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <CardTitle>Genealogist Administration</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage genealogists and user roles
            </CardDescription>
          )}
        </div>
        <Button variant="ghost" size="icon">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-8">
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleManualCleanup}
                variant="outline"
                className="text-sm"
              >
                Update Genealogists List
              </Button>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Controller
                          name="role"
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                <SelectItem value="SCANNER">Scanner</SelectItem>
                                <SelectItem value="INDEXER">Indexer</SelectItem>
                                <SelectItem value="PROOFREADER">
                                  Proofreader
                                </SelectItem>
                                <SelectItem value="PROCESS_MANAGER">
                                  Process Manager
                                </SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateSecurePassword}
                          >
                            Generate
                          </Button>
                          <div className="relative flex-grow">
                            <FormControl>
                              <Input
                                placeholder="Password"
                                type={showPassword ? "text" : "password"}
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={togglePasswordVisibility}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Button
                    onClick={handleManualCleanup}
                    variant="outline"
                    className="text-sm"
                  >
                    Refresh Genealogists List
                  </Button>
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    variant="default"
                  >
                    Create Genealogist
                  </Button>
                </div>
              </form>
            </Form>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {genealogists.map((genealogist) => (
                    <TableRow key={genealogist.id}>
                      <TableCell>{genealogist.fullName || "N/A"}</TableCell>
                      <TableCell>{genealogist.email}</TableCell>
                      <TableCell>{genealogist.phone || "N/A"}</TableCell>
                      <TableCell>{genealogist.role || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(genealogist)}
                            disabled={
                              genealogist.email === "kdgs.develop@gmail.com"
                            }
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendNewPassword(genealogist)}
                            disabled={
                              genealogist.email === "kdgs.develop@gmail.com"
                            }
                          >
                            Send New Password
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteGenealogist(genealogist)}
                            disabled={
                              genealogist.email === "kdgs.develop@gmail.com"
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DeleteConfirmationDialog
              isOpen={isConfirmDialogOpen}
              onClose={() => setIsConfirmDialogOpen(false)}
              onConfirm={handleConfirmAction}
              action={confirmAction as "delete" | "newPassword"}
            />

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Genealogist</DialogTitle>
                  <DialogDescription>
                    Update the phone number and role of the genealogist. Click
                    save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="edit-phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-role" className="text-right">
                      Role
                    </Label>
                    <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                        <SelectItem value="SCANNER">Scanner</SelectItem>
                        <SelectItem value="INDEXER">Indexer</SelectItem>
                        <SelectItem value="PROOFREADER">Proofreader</SelectItem>
                        <SelectItem value="PROCESS_MANAGER">
                          Process Manager
                        </SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleEditGenealogist}>
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
