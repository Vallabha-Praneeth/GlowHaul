import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Image, CheckCircle2, Clock, Upload } from "lucide-react";

const proofs = [
  { id: "POS-401", route: "Times Square Loop", driver: "Marcus Johnson", date: "Mar 8, 2026", time: "2:34 PM", media: 12, status: "Approved" },
  { id: "POS-400", route: "Hollywood Blvd", driver: "Carlos Rivera", date: "Mar 8, 2026", time: "1:15 PM", media: 8, status: "Pending Review" },
  { id: "POS-399", route: "Magnificent Mile", driver: "David Kim", date: "Mar 7, 2026", time: "5:42 PM", media: 15, status: "Approved" },
  { id: "POS-398", route: "Financial District", driver: "Alex Chen", date: "Mar 7, 2026", time: "3:20 PM", media: 6, status: "Incomplete" },
  { id: "POS-397", route: "South Beach Circuit", driver: "James Williams", date: "Mar 6, 2026", time: "4:10 PM", media: 10, status: "Approved" },
];

const statusMap: Record<string, { variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle2 }> = {
  Approved: { variant: "success", icon: CheckCircle2 },
  "Pending Review": { variant: "warning", icon: Clock },
  Incomplete: { variant: "destructive", icon: Upload },
};

const ProofOfService = () => (
  <DashboardLayout title="Proof of Service" subtitle="Review and approve campaign documentation">
    <div className="grid gap-4">
      {proofs.map((p) => {
        const cfg = statusMap[p.status];
        return (
          <div key={p.id} className="card-elevated p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-16 w-24 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">{p.id}</span>
                <Badge variant={cfg.variant} className="gap-1"><cfg.icon className="h-3 w-3" /> {p.status}</Badge>
              </div>
              <h3 className="font-semibold text-foreground">{p.route}</h3>
              <p className="text-sm text-muted-foreground">{p.driver} · {p.date} at {p.time}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium text-foreground">{p.media} files</p>
              <p className="text-xs text-primary font-medium cursor-pointer">Review →</p>
            </div>
          </div>
        );
      })}
    </div>
  </DashboardLayout>
);

export default ProofOfService;
