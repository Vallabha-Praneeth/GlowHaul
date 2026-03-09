import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

const days = ["Mon 10", "Tue 11", "Wed 12", "Thu 13", "Fri 14", "Sat 15", "Sun 16"];

const bookings = [
  { id: "BK-2001", advertiser: "Coca-Cola", truck: "Manhattan Cruiser", route: "Times Square Loop", start: 0, span: 5, status: "Active", color: "bg-primary/15 border-primary/30 text-primary" },
  { id: "BK-2002", advertiser: "Samsung", truck: "LA Showtime", route: "Hollywood Blvd", start: 2, span: 4, status: "Upcoming", color: "bg-success/10 border-success/30 text-success" },
  { id: "BK-2003", advertiser: "Nike", truck: "Windy City Runner", route: "Magnificent Mile", start: 1, span: 3, status: "Active", color: "bg-primary/15 border-primary/30 text-primary" },
  { id: "BK-2004", advertiser: "Tesla", truck: "Bay Area Billboard", route: "Financial District", start: 0, span: 7, status: "Active", color: "bg-warning/10 border-warning/30 text-warning" },
];

const Bookings = () => (
  <DashboardLayout title="Bookings" subtitle="Schedule and manage active bookings">
    <div className="card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-border bg-secondary/30">
            <div className="px-5 py-3 label-sm">Truck / Route</div>
            {days.map((d) => (
              <div key={d} className="px-3 py-3 text-center label-sm">{d}</div>
            ))}
          </div>
          {/* Rows */}
          {bookings.map((b) => (
            <div key={b.id} className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-border hover:bg-secondary/10 transition-colors">
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-foreground">{b.truck}</p>
                <p className="text-xs text-muted-foreground">{b.advertiser}</p>
              </div>
              {days.map((_, i) => (
                <div key={i} className="px-1 py-3 flex items-center">
                  {i === b.start && (
                    <div
                      className={`rounded-md border px-2 py-1.5 text-xs font-medium ${b.color} truncate`}
                      style={{ width: `calc(${b.span * 100}% + ${(b.span - 1) * 0.25}rem)` }}
                    >
                      {b.route}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default Bookings;
