"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import {
  Edit2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  createGenealogist,
  deleteGenealogist,
  getGenealogists,
  getGenealogistsWithPagination,
  getGenealogistStats,
  updateGenealogist,
  updateGenealogistPassword,
  cleanupOrphanedGenealogists
} from "./actions";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface Genealogist {
  id: number;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string | null;
}

interface GenealogistStats {
  totalCount: number;
  roleStats: Record<string, number>;
}

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["VIEWER", "SCANNER", "INDEXER", "PROOFREADER", "ADMIN"]),
  password: z.string().min(8, "Password must be at least 8 characters")
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
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [genealogistData, setGenealogistData] = useState({
    genealogists: [] as Genealogist[],
    totalCount: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<GenealogistStats>({
    totalCount: 0,
    roleStats: {}
  });

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
      password: ""
    }
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const fetchGenealogists = async (page: number) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const data = await getGenealogistsWithPagination(page, itemsPerPage);
      setGenealogistData(data);
      setGenealogists(data.genealogists);
      setIsDataFetched(true);
    } catch (error) {
      console.error("Error fetching genealogists:", error);
      toast({ title: "Error fetching genealogists", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statistics = await getGenealogistStats();
      setStats(statistics);
    } catch (error) {
      console.error("Error fetching genealogist statistics:", error);
      toast({
        title: "Error fetching statistics",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Only fetch data when component is expanded
    if (isExpanded) {
      fetchGenealogists(currentPage);
      fetchStats();
    }
  }, [currentPage, itemsPerPage, isExpanded]);

  const initializeAdminPanel = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // First cleanup orphaned records
      const cleanupResults = await cleanupOrphanedGenealogists();
      console.log("Synchronization completed:", cleanupResults);

      // Then fetch the updated list
      await fetchGenealogists(1);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error initializing admin panel:", error);
      toast({
        title: "Error initializing admin panel",
        description: "Failed to synchronize records",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        password: data.password
      });

      if (newGenealogist && newGenealogist.email) {
        await sendWelcomeEmail(
          {
            email: newGenealogist.email,
            fullName:
              newGenealogist.fullName || `${data.firstName} ${data.lastName}`,
            role: newGenealogist.role || data.role,
            id: newGenealogist.id
          },
          data.password,
          false
        );
      } else {
        throw new Error("Failed to create genealogist or email is missing");
      }

      toast({ title: "Genealogist created successfully" });
      if (isExpanded) {
        await fetchGenealogists(1);
        await fetchStats();
        setCurrentPage(1);
      }
      form.reset();
    } catch (error) {
      console.error("Error creating genealogist:", error);
      toast({
        title: "Error creating genealogist",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
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
        is_resend: details.isResend
      };

      console.log("Sending email with params:", templateParams);

      const result = await emailjs.send(serviceId, templateId, templateParams);

      if (result.text !== "OK") {
        throw new Error("Failed to send email");
      }

      toast({
        title: details.isResend ? "New password sent" : "Welcome email sent",
        description: `Email sent successfully to ${details.to}`
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error sending email",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
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
      isResend: isResend
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
            id: selectedGenealogist.id
          },
          newPassword,
          true
        );
      } else if (confirmAction === "delete") {
        await deleteGenealogist(selectedGenealogist.id);
      }
      if (isExpanded) {
        fetchGenealogists(currentPage);
        fetchStats();
      }
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
        role: editRole as Role
      });
      toast({ title: "Genealogist updated successfully" });
      if (isExpanded) {
        fetchGenealogists(currentPage);
        fetchStats();
      }
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ title: "Error updating genealogist", variant: "destructive" });
    }
  };

  const handleManualCleanup = async () => {
    try {
      setIsLoading(true);
      await cleanupOrphanedGenealogists();
      if (isExpanded) {
        await fetchGenealogists(currentPage);
        await fetchStats();
      }
      toast({
        title: "Cleanup completed",
        description: "Successfully synchronized records"
      });
    } catch (error) {
      console.error("Error during manual cleanup:", error);
      toast({
        title: "Error during cleanup",
        description: "Failed to synchronize records",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // If expanding and data hasn't been fetched yet, useEffect will trigger initialization
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  return (
    <Card className="w-[calc(100%)]">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={handleToggleExpanded}
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
          {isLoading && !isDataFetched ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8">

              {/* Statistics Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.totalCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Genealogists
                  </div>
                </div>
                {Object.entries(stats.roleStats).map(([role, count]) => (
                  <div key={role} className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {count}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {role === "NO_ROLE" ? "No Role" : role}
                    </div>
                  </div>
                ))}
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md bg-card">
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
                                  <SelectItem value="SCANNER">
                                    Scanner
                                  </SelectItem>
                                  <SelectItem value="INDEXER">
                                    Indexer
                                  </SelectItem>
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
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 text-xs"
                            >
                              Generate
                            </Button>
                            <div className="relative flex-grow">
                              <FormControl>
                                <Input
                                  placeholder="Password"
                                  type={showPassword ? "text" : "password"}
                                  className="pr-10 focus-visible:ring-1 focus-visible:ring-primary/50"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full opacity-70 hover:opacity-100"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-8 space-x-3">
                    <Button
                      onClick={handleManualCleanup}
                      variant="outline"
                      className="text-sm border-slate-200 hover:bg-slate-100"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Refresh Genealogists List
                    </Button>
                    <Button
                      type="submit"
                      className="w-full md:w-auto bg-primary hover:bg-primary/90"
                      variant="default"
                      disabled={isLoading}
                    >
                      Create Genealogist
                    </Button>
                  </div>
                </form>
              </Form>

              

              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-medium">Name</TableHead>
                      <TableHead className="font-medium">Email</TableHead>
                      <TableHead className="font-medium">Phone</TableHead>
                      <TableHead className="font-medium">Role</TableHead>
                      <TableHead className="font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {genealogists.map(genealogist => (
                      <TableRow
                        key={genealogist.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {genealogist.fullName || "N/A"}
                        </TableCell>
                        <TableCell>{genealogist.email}</TableCell>
                        <TableCell>{genealogist.phone || "N/A"}</TableCell>
                        <TableCell>
                          {genealogist.role ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                genealogist.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : genealogist.role === "VIEWER"
                                    ? "bg-blue-100 text-blue-800"
                                    : genealogist.role === "SCANNER"
                                      ? "bg-green-100 text-green-800"
                                      : genealogist.role === "INDEXER"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : genealogist.role === "PROOFREADER"
                                          ? "bg-orange-100 text-orange-800"
                                          : genealogist.role ===
                                              "PROCESS_MANAGER"
                                            ? "bg-indigo-100 text-indigo-800"
                                            : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {genealogist.role}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                openEditDialog(genealogist);
                              }}
                              disabled={
                                genealogist.email ===
                                  "kdgs.develop@gmail.com" || isLoading
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handleSendNewPassword(genealogist);
                              }}
                              disabled={
                                genealogist.email ===
                                  "kdgs.develop@gmail.com" || isLoading
                              }
                              className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                            >
                              Send New Password
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteGenealogist(genealogist);
                              }}
                              disabled={
                                genealogist.email ===
                                  "kdgs.develop@gmail.com" || isLoading
                              }
                              className="text-xs text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
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

              <div className="flex justify-between items-center">
                <div>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="py-2 px-3 text-sm">
                    Page {currentPage} of {genealogistData.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev =>
                        Math.min(prev + 1, genealogistData.totalPages)
                      )
                    }
                    disabled={
                      currentPage === genealogistData.totalPages || isLoading
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DeleteConfirmationDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={handleConfirmAction}
                action={confirmAction as "delete" | "newPassword"}
              />

              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
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
                        onChange={e => setEditPhone(e.target.value)}
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
                          <SelectItem value="PROOFREADER">
                            Proofreader
                          </SelectItem>
                          <SelectItem value="PROCESS_MANAGER">
                            Process Manager
                          </SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handleEditGenealogist}
                      disabled={isLoading}
                    >
                      Save changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
