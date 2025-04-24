"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit,
  Loader2,
  Search,
  ShoppingCart
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getOrders,
  searchOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderItems
} from "./actions";
import EditOrderDialog from "./edit-order-dialog";
import OrderItemsDialog from "./order-items-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface OrderData {
  orders: {
    id: string;
    customerEmail: string | null;
    customerFullName: string | null;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: Date;
    isMember: boolean;
    _count: { items: number };
  }[];
  totalCount: number;
  totalPages: number;
}

export function OrdersAdministration() {
  const [orderData, setOrderData] = useState<OrderData>({
    orders: [],
    totalCount: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{
    id: string;
    customerEmail: string | null;
    customerFullName: string | null;
    status: string;
    isMember: boolean;
  } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);

  const fetchOrders = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getOrders(page, itemsPerPage);
      setOrderData({
        orders: data.orders,
        totalCount: data.totalCount,
        totalPages: data.totalPages
      });
      setIsDataFetched(true);
    } catch (error) {
      toast({
        title: "Error fetching orders",
        description:
          error instanceof Error ? error.message : "Failed to fetch orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchOrders(currentPage);
    }
  }, [currentPage, itemsPerPage, isExpanded]);

  const handleSearch = async () => {
    if (!isExpanded) return;

    setIsLoading(true);
    try {
      if (!searchTerm.trim()) {
        await fetchOrders(1);
        setCurrentPage(1);
        return;
      }

      const results = await searchOrders(searchTerm, 1, itemsPerPage);
      setOrderData({
        orders: results.orders,
        totalCount: results.totalCount,
        totalPages: results.totalPages
      });
      setCurrentPage(1);
    } catch (error) {
      toast({
        title: "Error searching orders",
        description:
          error instanceof Error ? error.message : "Failed to search orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (status: string) => {
    if (!selectedOrder) return;

    try {
      await updateOrderStatus(selectedOrder.id, status);
      toast({
        title: "Success",
        description: "Order status updated successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedOrder(null);
      if (isExpanded) {
        fetchOrders(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error updating order",
        description:
          error instanceof Error ? error.message : "Failed to update order",
        variant: "destructive"
      });
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!selectedOrder) return;

    try {
      await deleteOrder(id);
      toast({
        title: "Success",
        description: "Order deleted successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedOrder(null);
      if (isExpanded) {
        fetchOrders(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error deleting order",
        description:
          error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive"
      });
    }
  };

  const handleToggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
  };

  const handleClearSearch = async () => {
    if (!isExpanded) return;

    setSearchTerm("");
    await fetchOrders(1);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  const formatCurrency = (amount: number, currency: string = "cad") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(amount / 100); // Convert cents to dollars
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "FAILED":
        return "destructive";
      case "PROCESSING":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={handleToggleExpanded}
      >
        <div>
          <CardTitle>Orders Management</CardTitle>
          {!isExpanded && (
            <CardDescription>Click to manage customer orders</CardDescription>
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
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email, customer name, or order ID"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="secondary"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
            <Button
              onClick={handleClearSearch}
              variant="outline"
              disabled={isLoading || !searchTerm.trim()}
            >
              Reset
            </Button>
          </div>

          {isLoading && !isDataFetched ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orderData.orders.length > 0 ? (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Orders:</h3>
                <div className="space-y-2">
                  {orderData.orders.map(order => (
                    <div
                      key={order.id}
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <div className="grid grid-cols-4 gap-4 flex-1 items-center">
                        <div className="truncate">
                          <span className="text-sm font-medium">
                            {order.customerFullName || "Unknown"}
                          </span>
                          <div className="text-xs text-muted-foreground truncate">
                            {order.customerEmail || "No email"}
                          </div>
                        </div>

                        <div className="text-xs">
                          {format(
                            new Date(order.createdAt),
                            "yyyy-MM-dd HH:mm"
                          )}
                        </div>

                        <div className="text-sm">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getStatusBadgeVariant(order.status)}
                            >
                              {order.status}
                            </Badge>
                            {order.isMember && (
                              <Badge
                                variant="success"
                                className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200"
                              >
                                Member
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {order._count.items > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedOrder({
                                id: order.id,
                                customerEmail: order.customerEmail,
                                customerFullName: order.customerFullName,
                                status: order.status,
                                isMember: order.isMember
                              });
                              setIsItemsDialogOpen(true);
                            }}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            {order._count.items} Items
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedOrder({
                              id: order.id,
                              customerEmail: order.customerEmail,
                              customerFullName: order.customerFullName,
                              status: order.status,
                              isMember: order.isMember
                            });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <SelectItem value="5">5 per page</SelectItem>
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
                    Page {currentPage} of {orderData.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev =>
                        Math.min(prev + 1, orderData.totalPages)
                      )
                    }
                    disabled={currentPage === orderData.totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : isDataFetched ? (
            <div className="py-8 text-center text-muted-foreground">
              No orders found
            </div>
          ) : null}

          <EditOrderDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedOrder(null);
            }}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            order={selectedOrder}
          />

          <OrderItemsDialog
            isOpen={isItemsDialogOpen}
            onClose={() => {
              setIsItemsDialogOpen(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
          />
        </CardContent>
      )}
    </Card>
  );
}
