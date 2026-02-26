import { useState, useEffect } from "react";
import { fetchReportDashboard, fetchStaffReport } from "@/api/index.js";
import { getCurrentUser } from "../../auth/auth";
import { toast } from "sonner";
import {
  Download,
  FileText,
  TrendingUp,
  Printer,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";



export default function AdminReports() {
  const user = getCurrentUser();
  const [reportData, setReportData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [missingBranch, setMissingBranch] = useState(false);

  useEffect(() => {
    loadReportData();
    loadStaffData();
  }, [user?.branch_id]);

  const loadReportData = async () => {
    setLoading(true);
    setMissingBranch(false);
    try {
      // api.md spec: admin/superadmin must supply a branch_id for report endpoint.
      // Branch managers call the URL without an id (their branch is inferred from JWT).
      const isSuperOrAdmin = user?.is_superuser || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
      if (isSuperOrAdmin && !user?.branch_id) {
        // Global admin has no branch assigned — cannot show branch report.
        setMissingBranch(true);
        setLoading(false);
        return;
      }
      const branchId = isSuperOrAdmin ? user?.branch_id : null;
      const data = await fetchReportDashboard(branchId);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch report dashboard:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const loadStaffData = async () => {
    setStaffLoading(true);
    try {
      const isSuperOrAdmin = user?.is_superuser || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
      if (isSuperOrAdmin && !user?.branch_id) {
        setStaffLoading(false);
        return;
      }
      const branchId = isSuperOrAdmin ? user?.branch_id : null;
      const data = await fetchStaffReport(branchId);
      setStaffData(data?.staff_performance || []);
    } catch (error) {
      console.error("Failed to fetch staff report:", error);
      toast.error("Failed to load staff data");
    } finally {
      setStaffLoading(false);
    }
  };

  // Build weekly chart data from API Weekly_sales field
  const weeklySalesRaw = reportData?.Weekly_sales || {};
  const weeklyChartData = [
    { day: 'Mon', sales: weeklySalesRaw.monday || 0 },
    { day: 'Tue', sales: weeklySalesRaw.tuesday || 0 },
    { day: 'Wed', sales: weeklySalesRaw.wednesday || 0 },
    { day: 'Thu', sales: weeklySalesRaw.thursday || 0 },
    { day: 'Fri', sales: weeklySalesRaw.friday || 0 },
    { day: 'Sat', sales: weeklySalesRaw.saturday || 0 },
    { day: 'Sun', sales: weeklySalesRaw.sunday || 0 },
  ];

  // Real top-selling items from API
  const topItems: any[] = reportData?.top_selling_items_count || [];

  // Build hourly chart data from API Hourly_sales field
  const hourlyChartData = reportData?.Hourly_sales || [];

  return (
    <div className="p-6 space-y-6">
      {/* Show message if global admin has no branch */}
      {missingBranch && (
        <div className="card-elevated p-6 border border-amber-200 bg-amber-50 rounded-xl">
          <p className="text-amber-800 font-semibold">Select a specific branch to view its reports. Your global admin account is not assigned to a branch.</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 hover:shadow-warm-lg cursor-pointer transition-all">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Daily Report</h3>
              <p className="text-sm text-muted-foreground">Today's summary</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-warm-lg cursor-pointer transition-all">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Weekly Report</h3>
              <p className="text-sm text-muted-foreground">This week's analysis</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-warm-lg cursor-pointer transition-all">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-info" />
            </div>
            <div>
              <h3 className="font-semibold">Monthly Report</h3>
              <p className="text-sm text-muted-foreground">Monthly overview</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="items">Item Report</TabsTrigger>
          <TabsTrigger value="staff">Staff Report</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="card-elevated p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Weekly Sales Trend</h3>
                <p className="text-xs text-muted-foreground">Performance overview for the current week</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">This Week</Button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={weeklyChartData}>
                <defs>
                  <linearGradient id="colorSalesReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `Rs.${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`Rs.${value.toLocaleString()}`, 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSalesReports)"
                  dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Month Sales</p>
              <p className="text-2xl font-bold text-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Rs.${reportData?.total_month_sales?.toLocaleString() || 0}`}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Month Orders</p>
              <p className="text-2xl font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (reportData?.total_month_orders || 0)}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground">Avg Order (Month)</p>
              <p className="text-2xl font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Rs.${reportData?.total_month_sales && reportData?.total_month_orders ? (reportData.total_month_sales / reportData.total_month_orders).toFixed(0) : 0}`}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground">Monthy Growth</p>
              <p className={`text-2xl font-bold ${(reportData?.growth_percent || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `${(reportData?.growth_percent || 0).toFixed(1)}%`}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-6">Top Selling Items</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="product__name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="total_orders" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-elevated overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Rank</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Item</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Orders</th>
                  <th className="px-6 py-4 text-right font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'No data available'}
                    </td>
                  </tr>
                ) : topItems.map((item, index) => (
                  <tr key={item.product__name} className="border-t">
                    <td className="px-6 py-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{item.product__name}</td>
                    <td className="px-6 py-4">{item.total_orders}</td>
                    <td className="px-6 py-4 text-right font-semibold text-primary">
                      Rs.{Number(item.total_sales || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-6">Staff Performance</h3>
            {staffLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : staffData.length === 0 ? (
              <div className="flex justify-center items-center h-[300px] text-muted-foreground">
                No staff data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) =>
                      name === 'total_sales' ? `Rs.${value.toLocaleString()}` : value
                    }
                  />
                  <Bar dataKey="total_orders" name="Orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card-elevated overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Staff</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Total Orders</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Month Orders</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Total Sales</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Month Sales</th>
                </tr>
              </thead>
              <tbody>
                {staffLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : staffData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No staff data available
                    </td>
                  </tr>
                ) : staffData.map((staff) => (
                  <tr key={staff.id} className="border-t">
                    <td className="px-6 py-4 font-medium">{staff.name}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm capitalize">{staff.role?.toLowerCase().replace('_', ' ')}</td>
                    <td className="px-6 py-4">{staff.total_orders}</td>
                    <td className="px-6 py-4">{staff.current_month_orders}</td>
                    <td className="px-6 py-4 font-semibold text-primary">Rs.{Number(staff.total_sales).toLocaleString()}</td>
                    <td className="px-6 py-4">Rs.{Number(staff.current_month_sales).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
