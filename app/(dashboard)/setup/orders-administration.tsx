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
  ShoppingCart,
  Users,
  BarChart3
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getOrders,
  searchOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderItems,
  getOrderCounts,
  getMonthlyOrdersData
} from "./actions";
import EditOrderDialog from "./edit-order-dialog";
import OrderItemsDialog from "./order-items-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

interface MonthlyData {
  labels: string[];
  salesData: {
    total: number[];
    member: number[];
    nonMember: number[];
    prevYearTotal: number[];
    prevYearMember: number[];
    prevYearNonMember: number[];
  };
  countData: {
    total: number[];
    member: number[];
    nonMember: number[];
    prevYearTotal: number[];
    prevYearMember: number[];
    prevYearNonMember: number[];
  };
  itemCountData: {
    total: number[];
    member: number[];
    nonMember: number[];
    prevYearTotal: number[];
    prevYearMember: number[];
    prevYearNonMember: number[];
  };
  year: number;
  previousYear: number;
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
  const [memberFilter, setMemberFilter] = useState<
    "all" | "members" | "non-members"
  >("all");
  const [orderCounts, setOrderCounts] = useState({
    totalCount: 0,
    memberCount: 0,
    nonMemberCount: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartView, setChartView] = useState<"sales" | "count" | "items">(
    "sales"
  );
  const [dataView, setDataView] = useState<
    "all" | "total" | "member" | "non-member"
  >("all");
  const [showPreviousYear, setShowPreviousYear] = useState(false);

  const fetchOrderCounts = async () => {
    try {
      const counts = await getOrderCounts();
      setOrderCounts(counts);
    } catch (error) {
      console.error("Error fetching order counts:", error);
    }
  };

  const fetchOrders = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getOrders(page, itemsPerPage, memberFilter);

      setOrderData({
        orders: data.orders,
        totalCount: data.totalCount,
        totalPages: data.totalPages
      });
      setIsDataFetched(true);

      // Fetch order counts after loading orders
      fetchOrderCounts();
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

  const fetchMonthlyData = async () => {
    setIsChartLoading(true);
    try {
      const data = await getMonthlyOrdersData();
      setMonthlyData(data);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
      toast({
        title: "Error",
        description: "Failed to load monthly sales data",
        variant: "destructive"
      });
    } finally {
      setIsChartLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchOrders(currentPage);
      fetchMonthlyData();
    }
  }, [currentPage, itemsPerPage, isExpanded, memberFilter]);

  const handleSearch = async () => {
    if (!isExpanded) return;

    setIsLoading(true);
    try {
      if (!searchTerm.trim()) {
        await fetchOrders(1);
        setCurrentPage(1);
        return;
      }

      const results = await searchOrders(
        searchTerm,
        1,
        itemsPerPage,
        memberFilter
      );

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

  const handleMemberFilterChange = (value: string) => {
    setMemberFilter(value as "all" | "members" | "non-members");
    setCurrentPage(1); // Reset to page 1 when changing filters
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

  // Update chart options
  const getSalesChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const
        },
        title: {
          display: true,
          text: monthlyData
            ? `Monthly Sales ${monthlyData.year} (CAD)`
            : "Monthly Sales (CAD)"
        },
        tooltip: {
          callbacks: {
            label: (context: any) => `$${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: number) => `$${value}`
          }
        }
      }
    };
  };

  const getCountChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const
        },
        title: {
          display: true,
          text: monthlyData
            ? `Monthly Order Counts ${monthlyData.year}`
            : "Monthly Order Counts"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    };
  };

  const getItemCountChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const
        },
        title: {
          display: true,
          text: monthlyData
            ? `Monthly Items Purchased ${monthlyData.year}`
            : "Monthly Items Purchased"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    };
  };

  const renderSalesChart = () => {
    if (isChartLoading) {
      return (
        <div className="h-72 flex items-center justify-center bg-muted/30 rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (monthlyData) {
      // Create dataset based on the chart type
      let datasets = [];

      if (chartView === "sales") {
        // Show previous year data first if enabled
        if (showPreviousYear) {
          datasets.push({
            label: `${monthlyData.previousYear} Total Sales`,
            data: monthlyData.salesData.prevYearTotal,
            backgroundColor: "rgba(25, 118, 210, 0.2)",
            borderColor: "rgba(25, 118, 210, 1)",
            borderWidth: 1,
            borderDash: [5, 5]
          });
        }

        // Then add current year data
        datasets.push({
          label: `${monthlyData.year} Total Sales`,
          data: monthlyData.salesData.total,
          backgroundColor: "rgba(25, 118, 210, 0.6)",
          borderColor: "rgba(25, 118, 210, 1)",
          borderWidth: 1
        });
      } else if (chartView === "count") {
        // Show previous year data first (if enabled)
        if (showPreviousYear) {
          if (dataView === "all" || dataView === "total") {
            datasets.push({
              label: `${monthlyData.previousYear} Total Orders`,
              data: monthlyData.countData.prevYearTotal,
              backgroundColor: "rgba(25, 118, 210, 0.2)",
              borderColor: "rgba(25, 118, 210, 1)",
              borderWidth: 1,
              borderDash: [5, 5]
            });
          }

          if (dataView === "all" || dataView === "member") {
            datasets.push({
              label: `${monthlyData.previousYear} Member Orders`,
              data: monthlyData.countData.prevYearMember,
              backgroundColor: "rgba(46, 125, 50, 0.2)",
              borderColor: "rgba(46, 125, 50, 1)",
              borderWidth: 1,
              borderDash: [5, 5]
            });
          }

          if (dataView === "all" || dataView === "non-member") {
            datasets.push({
              label: `${monthlyData.previousYear} Non-Member Orders`,
              data: monthlyData.countData.prevYearNonMember,
              backgroundColor: "rgba(211, 47, 47, 0.2)",
              borderColor: "rgba(211, 47, 47, 1)",
              borderWidth: 1,
              borderDash: [5, 5]
            });
          }
        }

        // Then add current year counts based on data view
        if (dataView === "all" || dataView === "total") {
          datasets.push({
            label: `${monthlyData.year} Total Orders`,
            data: monthlyData.countData.total,
            backgroundColor: "rgba(25, 118, 210, 0.6)",
            borderColor: "rgba(25, 118, 210, 1)",
            borderWidth: 1
          });
        }

        if (dataView === "all" || dataView === "member") {
          datasets.push({
            label: `${monthlyData.year} Member Orders`,
            data: monthlyData.countData.member,
            backgroundColor: "rgba(46, 125, 50, 0.6)",
            borderColor: "rgba(46, 125, 50, 1)",
            borderWidth: 1
          });
        }

        if (dataView === "all" || dataView === "non-member") {
          datasets.push({
            label: `${monthlyData.year} Non-Member Orders`,
            data: monthlyData.countData.nonMember,
            backgroundColor: "rgba(211, 47, 47, 0.6)",
            borderColor: "rgba(211, 47, 47, 1)",
            borderWidth: 1
          });
        }
      } else if (chartView === "items") {
        // Show previous year item counts first (if enabled)
        if (showPreviousYear) {
          if (dataView === "all" || dataView === "total") {
            datasets.push({
              label: `${monthlyData.previousYear} Total Items`,
              data: monthlyData.itemCountData.prevYearTotal,
              backgroundColor: "rgba(25, 118, 210, 0.2)",
              borderColor: "rgba(25, 118, 210, 1)",
              borderWidth: 1,
              borderDash: [5, 5]
            });
          }

          if (dataView === "all" || dataView === "member") {
            datasets.push({
              label: `${monthlyData.previousYear} Member Items`,
              data: monthlyData.itemCountData.prevYearMember,
              backgroundColor: "rgba(46, 125, 50, 0.2)",
              borderColor: "rgba(46, 125, 50, 1)",
              borderWidth: 1,
              borderDash: [5, 5]
            });
          }

          if (dataView === "all" || dataView === "non-member") {
            datasets.push({
              label: `${monthlyData.previousYear} Non-Member Items`,
              data: monthlyData.itemCountData.prevYearNonMember,
              backgroundColor: "rgba(211, 47, 47, 0.2)",
              borderColor: "rgba(211, 47, 47, 1)",
              borderWidth: 1,
              borderDash: [5, 5]
            });
          }
        }

        // Then add current year item counts
        if (dataView === "all" || dataView === "total") {
          datasets.push({
            label: `${monthlyData.year} Total Items`,
            data: monthlyData.itemCountData.total,
            backgroundColor: "rgba(25, 118, 210, 0.6)",
            borderColor: "rgba(25, 118, 210, 1)",
            borderWidth: 1
          });
        }

        if (dataView === "all" || dataView === "member") {
          datasets.push({
            label: `${monthlyData.year} Member Items`,
            data: monthlyData.itemCountData.member,
            backgroundColor: "rgba(46, 125, 50, 0.6)",
            borderColor: "rgba(46, 125, 50, 1)",
            borderWidth: 1
          });
        }

        if (dataView === "all" || dataView === "non-member") {
          datasets.push({
            label: `${monthlyData.year} Non-Member Items`,
            data: monthlyData.itemCountData.nonMember,
            backgroundColor: "rgba(211, 47, 47, 0.6)",
            borderColor: "rgba(211, 47, 47, 1)",
            borderWidth: 1
          });
        }
      }

      const chartData = {
        labels: monthlyData.labels,
        datasets
      };

      return (
        <div className="h-72 bg-white p-4 rounded-md border">
          <Bar
            options={
              chartView === "sales"
                ? getSalesChartOptions()
                : chartView === "count"
                  ? getCountChartOptions()
                  : getItemCountChartOptions()
            }
            data={chartData}
          />
        </div>
      );
    }

    return (
      <div className="h-72 flex items-center justify-center bg-muted/30 rounded-md">
        <p className="text-muted-foreground">No sales data available</p>
      </div>
    );
  };

  // Add this to render the chart view buttons
  const renderChartControls = () => {
    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-2">
            <Button
              variant={chartView === "sales" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartView("sales")}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Sales Amount
            </Button>
            <Button
              variant={chartView === "count" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartView("count")}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Order Counts
            </Button>
            <Button
              variant={chartView === "items" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartView("items")}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Item Counts
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Show previous year: </span>
            <Button
              variant={showPreviousYear ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPreviousYear(!showPreviousYear)}
            >
              {showPreviousYear ? "Hide" : "Show"} {monthlyData?.previousYear}{" "}
              Data
            </Button>
          </div>
        </div>

        {/* Only show data type filters for the count chart */}
        {chartView !== "sales" && (
          <div className="flex space-x-2 mt-2">
            <Button
              variant={dataView === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDataView("all")}
            >
              All
            </Button>
            <Button
              variant={dataView === "total" ? "default" : "outline"}
              size="sm"
              onClick={() => setDataView("total")}
              className="border-blue-200 text-blue-800"
            >
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div>
              Total Only
            </Button>
            <Button
              variant={dataView === "member" ? "default" : "outline"}
              size="sm"
              onClick={() => setDataView("member")}
              className="border-green-200 text-green-800"
            >
              <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
              Members Only
            </Button>
            <Button
              variant={dataView === "non-member" ? "default" : "outline"}
              size="sm"
              onClick={() => setDataView("non-member")}
              className="border-red-200 text-red-800"
            >
              <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div>
              Non-Members Only
            </Button>
          </div>
        )}
      </div>
    );
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
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-muted/30 rounded-md flex flex-col">
              <span className="text-sm text-muted-foreground">
                Total Orders
              </span>
              <span className="text-2xl font-bold">
                {orderCounts.totalCount}
              </span>
            </div>
            <div className="p-4 bg-green-50 rounded-md flex flex-col">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Member Orders</span>
              </div>
              <span className="text-2xl font-bold text-green-700">
                {orderCounts.memberCount}
              </span>
              <span className="text-xs text-green-600">
                {orderCounts.totalCount
                  ? Math.round(
                      (orderCounts.memberCount / orderCounts.totalCount) * 100
                    )
                  : 0}
                % of total
              </span>
            </div>
            <div className="p-4 bg-blue-50 rounded-md flex flex-col">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">Non-Member Orders</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">
                {orderCounts.nonMemberCount}
              </span>
              <span className="text-xs text-blue-600">
                {orderCounts.totalCount
                  ? Math.round(
                      (orderCounts.nonMemberCount / orderCounts.totalCount) *
                        100
                    )
                  : 0}
                % of total
              </span>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                {chartView === "sales"
                  ? "Monthly Sales (CAD)"
                  : chartView === "count"
                    ? "Monthly Order Counts"
                    : "Monthly Items Purchased"}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMonthlyData}
                disabled={isChartLoading}
              >
                {isChartLoading && (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                )}
                Refresh
              </Button>
            </div>
            {renderSalesChart()}
            {monthlyData && renderChartControls()}
          </div>

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

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Orders:{" "}
              {memberFilter !== "all" && (
                <Badge
                  variant={memberFilter === "members" ? "success" : "default"}
                  className="ml-2"
                >
                  {memberFilter === "members"
                    ? "Members Only"
                    : "Non-Members Only"}
                </Badge>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by:</span>
              <Select
                value={memberFilter}
                onValueChange={handleMemberFilterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Member status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="members">Members Only</SelectItem>
                  <SelectItem value="non-members">Non-Members Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading && !isDataFetched ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orderData.orders.length > 0 ? (
            <>
              <div className="mt-4">
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
