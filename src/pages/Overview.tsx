import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Truck, CalendarDays, DollarSign, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const kpis = [
  { label: "Active Bookings", value: "127", change: "+12%", up: true, icon: CalendarDays },
  { label: "Fleet Utilization", value: "84%", change: "+3.2%", up: true, icon: Truck },
  { label: "Revenue (MTD)", value: "$248,500", change: "+18%", up: true, icon: DollarSign },
  { label: "Open Requests", value: "34", change: "-8%", up: false, icon: Activity },
];

const chartData = [
  { month: "Jan", bookings: 65 }, { month: "Feb", bookings: 78 },
  { month: "Mar", bookings: 90 }, { month: "Apr", bookings: 81 },
  { month: "May", bookings: 105 }, { month: "Jun", bookings: 127 },
  { month: "Jul", bookings: 118 }, { month: "Aug", bookings: 134 },
];

const recentActivity = [
  { action: "New booking confirmed", detail: "NYC Times Square Route — Coca-Cola", time: "2 min ago", type: "success" as const },
  { action: "Offer sent", detail: "LA Downtown Loop — Samsung", time: "18 min ago", type: "info" as const },
  { action: "Proof uploaded", detail: "Chicago Magnificent Mile — Nike", time: "1 hr ago", type: "info" as const },
  { action: "Request received", detail: "Miami Beach Blvd — Local Brewery", time: "2 hr ago", type: "warning" as const },
  { action: "Driver assigned", detail: "SF Financial District — Tesla", time: "3 hr ago", type: "info" as const },
];

const quickActions = [
  "Create New Booking", "Send Offer", "Add Truck", "View Requests",
];

const Overview = () => (
  <DashboardLayout title="Overview" subtitle="Welcome back, John">
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="label-sm">{kpi.label}</span>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-heading font-bold text-foreground">{kpi.value}</span>
              <span className={`flex items-center text-xs font-medium mb-0.5 ${kpi.up ? "text-success" : "text-destructive"}`}>
                {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card-elevated p-6">
          <h2 className="heading-md mb-4">Booking Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#bookingGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Utilization */}
        <div className="card-elevated p-6 flex flex-col">
          <h2 className="heading-md mb-4">Fleet Utilization</h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(220, 14%, 96%)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(217, 91%, 60%)" strokeWidth="3" strokeDasharray="84 100" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-heading font-bold text-foreground">84%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">42 of 50 trucks active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 card-elevated p-6">
          <h2 className="heading-md mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${item.type === "success" ? "bg-success" : item.type === "warning" ? "bg-warning" : "bg-primary"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-elevated p-6">
          <h2 className="heading-md mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button key={action} className="w-full text-left px-4 py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary/50 hover:border-primary/30 transition-all">
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default Overview;
