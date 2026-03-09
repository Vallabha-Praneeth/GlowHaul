import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Monitor, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const filters = ["All Cities", "New York", "Los Angeles", "Chicago", "Miami", "San Francisco"];

const trucks = [
  { id: "TRK-001", name: "Manhattan Cruiser", city: "New York", ledSize: '10\' x 6\'', status: "Available", rate: "$1,200/day", img: "🚛" },
  { id: "TRK-002", name: "LA Showtime", city: "Los Angeles", ledSize: '12\' x 8\'', status: "Booked", rate: "$1,500/day", img: "🚛" },
  { id: "TRK-003", name: "Windy City Runner", city: "Chicago", ledSize: '8\' x 5\'', status: "Available", rate: "$950/day", img: "🚛" },
  { id: "TRK-004", name: "Beach Blaster", city: "Miami", ledSize: '10\' x 6\'', status: "Maintenance", rate: "$1,100/day", img: "🚛" },
  { id: "TRK-005", name: "Bay Area Billboard", city: "San Francisco", ledSize: '14\' x 8\'', status: "Available", rate: "$1,800/day", img: "🚛" },
  { id: "TRK-006", name: "Times Square Express", city: "New York", ledSize: '12\' x 8\'', status: "Booked", rate: "$2,000/day", img: "🚛" },
];

const statusVariant = (s: string) => s === "Available" ? "success" : s === "Booked" ? "info" : "warning";

const Marketplace = () => (
  <DashboardLayout title="Marketplace" subtitle="Browse available LED trucks">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search trucks, cities, routes..." className="pl-9 bg-card border-border" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f, i) => (
          <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {trucks.map((truck) => (
          <div key={truck.id} className="card-elevated p-5 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{truck.name}</h3>
                <p className="text-xs text-muted-foreground">{truck.id}</p>
              </div>
              <Badge variant={statusVariant(truck.status)}>{truck.status}</Badge>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {truck.city}</div>
              <div className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5" /> LED: {truck.ledSize}</div>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{truck.rate}</span>
              <span className="text-xs text-primary font-medium">View Details →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default Marketplace;
