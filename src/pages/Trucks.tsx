import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor, Fuel, Wrench } from "lucide-react";

const trucks = [
  { id: "TRK-001", name: "Manhattan Cruiser", city: "New York", led: '10\' x 6\'', mileage: "42,300 mi", status: "Active", maintenance: "Up to date" },
  { id: "TRK-002", name: "LA Showtime", city: "Los Angeles", led: '12\' x 8\'', mileage: "38,100 mi", status: "Active", maintenance: "Up to date" },
  { id: "TRK-003", name: "Windy City Runner", city: "Chicago", led: '8\' x 5\'', mileage: "55,800 mi", status: "Active", maintenance: "Due in 5 days" },
  { id: "TRK-004", name: "Beach Blaster", city: "Miami", led: '10\' x 6\'', mileage: "29,400 mi", status: "Maintenance", maintenance: "In progress" },
  { id: "TRK-005", name: "Bay Area Billboard", city: "San Francisco", led: '14\' x 8\'', mileage: "18,200 mi", status: "Active", maintenance: "Up to date" },
  { id: "TRK-006", name: "Times Square Express", city: "New York", led: '12\' x 8\'', mileage: "61,700 mi", status: "Inactive", maintenance: "Overdue" },
];

const statusVariant = (s: string) => s === "Active" ? "success" : s === "Maintenance" ? "warning" : "secondary";
const maintVariant = (m: string) => m === "Up to date" ? "success" : m === "Overdue" ? "destructive" : "warning";

const Trucks = () => (
  <DashboardLayout title="Trucks" subtitle="Fleet management and truck details">
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            {["Truck", "City", "LED Size", "Mileage", "Status", "Maintenance"].map((h) => (
              <th key={h} className="px-5 py-3 text-left label-sm font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trucks.map((t) => (
            <tr key={t.id} className="border-b border-border hover:bg-secondary/20 transition-colors cursor-pointer">
              <td className="px-5 py-4">
                <p className="font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.id}</p>
              </td>
              <td className="px-5 py-4 text-muted-foreground">{t.city}</td>
              <td className="px-5 py-4 text-muted-foreground">{t.led}</td>
              <td className="px-5 py-4 text-muted-foreground">{t.mileage}</td>
              <td className="px-5 py-4"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></td>
              <td className="px-5 py-4"><Badge variant={maintVariant(t.maintenance)}>{t.maintenance}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </DashboardLayout>
);

export default Trucks;
