"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "PROCESSING"])
});

type EditOrderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrderStatus: (status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  order: {
    id: string;
    customerEmail: string | null;
    customerFullName: string | null;
    status: string;
    isMember?: boolean;
  } | null;
};

function EditOrderDialog({
  isOpen,
  onClose,
  onUpdateOrderStatus,
  onDeleteOrder,
  order
}: EditOrderDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: (order?.status as any) || "PENDING"
    }
  });

  useEffect(() => {
    if (order) {
      form.reset({
        status: order.status as any
      });
    }
  }, [order, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onUpdateOrderStatus(values.status);
      onClose();
    } catch (error) {
      toast({
        title: "Error updating order",
        description:
          error instanceof Error ? error.message : "Failed to update order",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>
            Update the status for this order.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2 mb-4">
              <div>
                <span className="text-sm font-medium">Order ID:</span>
                <p className="text-sm truncate">{order?.id}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Customer:</span>
                <p className="text-sm">
                  {order?.customerFullName || "Unknown"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Email:</span>
                <p className="text-sm">
                  {order?.customerEmail || "Not provided"}
                </p>
              </div>
              {order?.isMember && (
                <div>
                  <p className="text-sm font-medium text-green-700 flex items-center">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded mr-1">
                      Member
                    </span>
                    This order was made by a registered member
                  </p>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-between items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the order and all associated items.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => order && onDeleteOrder(order.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditOrderDialog;
