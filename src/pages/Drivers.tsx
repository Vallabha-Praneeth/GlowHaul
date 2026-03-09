import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Star } from "lucide-react";

const drivers = [
  { name: "Marcus Johnson", phone: "+1 212-555-0142", city: "New York", truck: "Manhattan Cruiser", status: "On Route", rating: 4.9, runs: 234 },
  { name: "Carlos Rivera", phone: "+1 310-555-0198", city: "Los Angeles", truck: "LA Showtime", status: "On Route", rating: 4.8, runs: 189 },
  { name: "David Kim", phone: "+1 312-555-0167", city: "Chicago", truck: "Windy City Runner", status: "Available", rating: 4.7, runs: 312 },
  { name: "James Williams", phone: "+1 305-555-0123", city: "Miami", truck: "Beach Blaster", status: "Off Duty", rating: 4.6, runs: 156 },
  { name: "Alex Chen", phone: "+1 415-555-0156", city: "San Francisco", truck: "Bay Area Billboard", status: "On Route", rating: 4.9, runs: 278 },
];

const statusVariant = (s: string) => s === "On Route" ? "success" : s === "Available" ? "info" : "secondary";

const Drivers = () => (
  <DashboardLayout title="Drivers" subtitle="Driver profiles and assignments">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {drivers.map((d) => (
        <div key={d.name} className="card-elevated p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {d.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{d.name}</h3>
                <p className="text-xs text-muted-foreground">{d.truck}</p>
              </div>
            </div>
            <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {d.city}</div>
            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {d.phone}</div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-warning"><Star className="h-3.5 w-3.5 fill-current" /> {d.rating}</span>
            <span className="text-muted-foreground">{d.runs} runs completed</span>
          </div>
        </div>
      ))}
    </div>
  </DashboardLayout>
);

export default Drivers;
