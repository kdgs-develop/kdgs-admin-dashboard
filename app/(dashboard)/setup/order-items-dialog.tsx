"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, ShoppingCart, Calendar } from "lucide-react";
import { getOrderItems } from "./actions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface OrderItemData {
  id: string;
  orderId: string;
  obituaryRef: string;
  obituaryName: string;
  price: number;
}

interface OrderData {
  id: string;
  customerEmail: string | null;
  customerFullName: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: Date;
}

interface OrderItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    customerEmail: string | null;
    customerFullName: string | null;
    status: string;
  } | null;
}

export function OrderItemsDialog({
  isOpen,
  onClose,
  order
}: OrderItemsDialogProps) {
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [itemCount, setItemCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && order) {
      loadOrderItems();
    }
  }, [isOpen, order]);

  const loadOrderItems = async () => {
    if (!order) return;

    try {
      setIsLoading(true);
      const data = await getOrderItems(order.id);
      setOrderItems(data.items);
      setOrderDetails(data.order);
      setItemCount(data.count);
    } catch (error) {
      console.error("Error loading order items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOrderItems([]);
    setItemCount(0);
    setOrderDetails(null);
    onClose();
  };

  const formatCurrency = (amount: number, currency: string = "cad") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(amount / 100); // Convert cents to dollars
  };

  const downloadOrderItemsList = () => {
    if (!orderItems.length || !orderDetails) return;

    // Create formatted content
    const content = [
      `Order Details - ${orderDetails.id}`,
      `Customer: ${orderDetails.customerFullName || "Unknown"}`,
      `Email: ${orderDetails.customerEmail || "Not provided"}`,
      `Status: ${orderDetails.status}`,
      `Date: ${format(new Date(orderDetails.createdAt), "yyyy-MM-dd HH:mm:ss")}`,
      `Total Amount: ${formatCurrency(orderDetails.totalAmount, orderDetails.currency)}`,
      "",
      `Order Items (${itemCount}):`,
      "",
      ...orderItems.map((item, index) => {
        return `${index + 1}. ${item.obituaryName} (Ref: ${item.obituaryRef}) - ${formatCurrency(item.price, orderDetails.currency)}`;
      })
    ].join("\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_${orderDetails.id.slice(0, 8)}_items.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Order Items for {order?.customerFullName || "Unknown Customer"}
          </DialogTitle>
          <DialogDescription>
            {itemCount > 0 && `Showing ${itemCount} items.`}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && orderDetails && (
          <>
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Order ID:</div>
                <div className="font-medium truncate">{orderDetails.id}</div>

                <div>Customer:</div>
                <div className="font-medium">
                  {orderDetails.customerFullName || "Unknown"}
                </div>

                <div>Email:</div>
                <div className="font-medium">
                  {orderDetails.customerEmail || "Not provided"}
                </div>

                <div>Date:</div>
                <div className="font-medium">
                  {format(new Date(orderDetails.createdAt), "yyyy-MM-dd HH:mm")}
                </div>

                <div>Status:</div>
                <div className="font-medium">
                  <Badge
                    variant={
                      orderDetails.status === "COMPLETED"
                        ? "success"
                        : orderDetails.status === "PENDING"
                          ? "warning"
                          : orderDetails.status === "FAILED"
                            ? "destructive"
                            : "default"
                    }
                  >
                    {orderDetails.status}
                  </Badge>
                </div>

                <div>Total:</div>
                <div className="font-medium">
                  {formatCurrency(
                    orderDetails.totalAmount,
                    orderDetails.currency
                  )}
                </div>
              </div>
            </div>

            {orderItems.length > 0 ? (
              <>
                <ScrollArea className="max-h-[300px] pr-4">
                  <div className="space-y-2">
                    {orderItems.map(item => (
                      <div
                        key={item.id}
                        className="p-3 border rounded border-l-4 border-l-blue-300"
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium truncate pr-2">
                            {item.obituaryName}
                          </div>
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            {formatCurrency(item.price, orderDetails.currency)}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground mt-1">
                          <div className="flex items-center">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            <span>Obituary Ref: {item.obituaryRef}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadOrderItemsList}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Details
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No items found for this order.
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default OrderItemsDialog;
