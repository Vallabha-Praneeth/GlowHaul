import { DashboardLayout } from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, Eye, MapPin } from "lucide-react";

const revenueData = [
  { month: "Sep", revenue: 185000 }, { month: "Oct", revenue: 198000 },
  { month: "Nov", revenue: 212000 }, { month: "Dec", revenue: 195000 },
  { month: "Jan", revenue: 228000 }, { month: "Feb", revenue: 241000 },
  { month: "Mar", revenue: 248500 },
];

const impressionsData = [
  { week: "W1", impressions: 1200000 }, { week: "W2", impressions: 1450000 },
  { week: "W3", impressions: 1380000 }, { week: "W4", impressions: 1600000 },
];

const cityData = [
  { name: "New York", value: 35 }, { name: "Los Angeles", value: 25 },
  { name: "Chicago", value: 18 }, { name: "Miami", value: 12 },
  { name: "San Francisco", value: 10 },
];

const COLORS = ["hsl(217, 91%, 60%)", "hsl(217, 91%, 72%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(220, 10%, 70%)"];

const stats = [
  { label: "Total Revenue", value: "$1.51M", change: "+22%", icon: DollarSign },
  { label: "Total Impressions", value: "18.4M", change: "+15%", icon: Eye },
  { label: "Avg. Campaign ROI", value: "3.2x", change: "+0.4x", icon: TrendingUp },
  { label: "Cities Covered", value: "12", change: "+2", icon: MapPin },
];

const Analytics = () => (
  <DashboardLayout title="Analytics" subtitle="Campaign performance and revenue insights">
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="label-sm">{s.label}</span>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-success font-medium mt-1">{s.change} vs last period</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elevated p-6">
          <h2 className="heading-md mb-4">Monthly Revenue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: number) => [`$${(v / 1000).toFixed(0)}k`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h2 className="heading-md mb-4">Weekly Impressions</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impressionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip formatter={(v: number) => [`${(v / 1000000).toFixed(1)}M`, "Impressions"]} />
                <Line type="monotone" dataKey="impressions" stroke="hsl(152, 60%, 40%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(152, 60%, 40%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-elevated p-6">
        <h2 className="heading-md mb-4">Revenue by City</h2>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cityData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" strokeWidth={2} stroke="hsl(0, 0%, 100%)">
                  {cityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {cityData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-sm text-foreground w-32">{c.name}</span>
                <span className="text-sm font-medium text-foreground">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default Analytics;
