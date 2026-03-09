import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const offers = [
  { id: "OFR-301", advertiser: "Coca-Cola", route: "Times Square Loop", trucks: 3, total: "$15,000", status: "Pending", expires: "2 days" },
  { id: "OFR-300", advertiser: "Samsung", route: "Hollywood Blvd", trucks: 2, total: "$12,400", status: "Accepted", expires: "—" },
  { id: "OFR-299", advertiser: "Nike", route: "Magnificent Mile", trucks: 1, total: "$4,200", status: "Expired", expires: "—" },
  { id: "OFR-298", advertiser: "Local Brewery", route: "South Beach Circuit", trucks: 2, total: "$6,800", status: "Rejected", expires: "—" },
  { id: "OFR-297", advertiser: "Tesla", route: "Financial District", trucks: 4, total: "$28,000", status: "Accepted", expires: "—" },
];

const statusConfig: Record<string, { variant: "warning" | "success" | "secondary" | "destructive"; icon: typeof Clock }> = {
  Pending: { variant: "warning", icon: Clock },
  Accepted: { variant: "success", icon: CheckCircle2 },
  Expired: { variant: "secondary", icon: AlertCircle },
  Rejected: { variant: "destructive", icon: XCircle },
};

const Offers = () => (
  <DashboardLayout title="Offers" subtitle="Track and manage sent offers">
    <div className="grid gap-4">
      {offers.map((o) => {
        const cfg = statusConfig[o.status];
        return (
          <div key={o.id} className="card-elevated p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">{o.id}</span>
                <Badge variant={cfg.variant} className="gap-1">
                  <cfg.icon className="h-3 w-3" /> {o.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground">{o.advertiser}</h3>
              <p className="text-sm text-muted-foreground">{o.route} · {o.trucks} truck{o.trucks > 1 ? "s" : ""}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-heading font-bold text-foreground">{o.total}</p>
              {o.expires !== "—" && <p className="text-xs text-muted-foreground">Expires in {o.expires}</p>}
            </div>
          </div>
        );
      })}
    </div>
  </DashboardLayout>
);

export default Offers;
