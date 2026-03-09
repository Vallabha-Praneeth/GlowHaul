import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

const requests = [
  { id: "REQ-1042", advertiser: "Coca-Cola", campaign: "Summer Refresh 2026", city: "New York", dates: "Mar 15 – Apr 15", status: "New", budget: "$45,000" },
  { id: "REQ-1041", advertiser: "Samsung", campaign: "Galaxy S27 Launch", city: "Los Angeles", dates: "Mar 20 – Apr 5", status: "In Review", budget: "$38,000" },
  { id: "REQ-1040", advertiser: "Nike", campaign: "Air Max Day", city: "Chicago", dates: "Mar 26 – Mar 28", status: "Quoted", budget: "$12,000" },
  { id: "REQ-1039", advertiser: "Local Brewery Co.", campaign: "Spring Festival", city: "Miami", dates: "Apr 1 – Apr 7", status: "New", budget: "$8,500" },
  { id: "REQ-1038", advertiser: "Tesla", campaign: "Model Y Promo", city: "San Francisco", dates: "Mar 10 – Mar 30", status: "Accepted", budget: "$62,000" },
  { id: "REQ-1037", advertiser: "Spotify", campaign: "Wrapped OOH", city: "New York", dates: "Apr 10 – May 10", status: "Declined", budget: "$55,000" },
];

const statusMap: Record<string, "success" | "info" | "warning" | "destructive" | "secondary"> = {
  New: "info", "In Review": "warning", Quoted: "secondary", Accepted: "success", Declined: "destructive",
};

const Requests = () => (
  <DashboardLayout title="Requests" subtitle="Manage advertiser and broker requests">
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {["Request ID", "Advertiser", "Campaign", "City", "Dates", "Budget", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-left label-sm font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer">
                <td className="px-5 py-4 font-medium text-foreground">{r.id}</td>
                <td className="px-5 py-4 text-foreground">{r.advertiser}</td>
                <td className="px-5 py-4 text-muted-foreground">{r.campaign}</td>
                <td className="px-5 py-4 text-muted-foreground">{r.city}</td>
                <td className="px-5 py-4 text-muted-foreground">{r.dates}</td>
                <td className="px-5 py-4 font-medium text-foreground">{r.budget}</td>
                <td className="px-5 py-4"><Badge variant={statusMap[r.status]}>{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
);

export default Requests;
