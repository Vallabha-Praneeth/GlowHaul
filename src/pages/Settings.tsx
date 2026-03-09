import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { User, Building2, Bell, Shield } from "lucide-react";

const Settings = () => (
  <DashboardLayout title="Settings" subtitle="Manage your account and organization">
    <div className="max-w-3xl space-y-6">
      {/* Profile */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-primary" />
          <h2 className="heading-md">Profile</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-sm mb-1.5 block">First Name</label>
            <Input defaultValue="John" className="bg-secondary border-0" />
          </div>
          <div>
            <label className="label-sm mb-1.5 block">Last Name</label>
            <Input defaultValue="Doe" className="bg-secondary border-0" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-sm mb-1.5 block">Email</label>
            <Input defaultValue="john@lumofleet.com" className="bg-secondary border-0" />
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="heading-md">Organization</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-sm mb-1.5 block">Company Name</label>
            <Input defaultValue="LumoFleet Inc." className="bg-secondary border-0" />
          </div>
          <div>
            <label className="label-sm mb-1.5 block">Industry</label>
            <Input defaultValue="Digital Out-of-Home Advertising" className="bg-secondary border-0" />
          </div>
          <div>
            <label className="label-sm mb-1.5 block">Fleet Size</label>
            <Input defaultValue="50 trucks" className="bg-secondary border-0" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="heading-md">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            ["New booking requests", true],
            ["Offer responses", true],
            ["Proof of service uploads", false],
            ["Weekly analytics digest", true],
            ["Driver status changes", false],
          ].map(([label, checked]) => (
            <div key={label as string} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{label as string}</span>
              <Switch defaultChecked={checked as boolean} />
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="heading-md">Roles & Permissions</h2>
        </div>
        <div className="space-y-3">
          {[
            { role: "Admin", desc: "Full access to all features", count: 2 },
            { role: "Operations Manager", desc: "Manage bookings, trucks, and drivers", count: 4 },
            { role: "Sales Rep", desc: "Handle requests and offers", count: 6 },
            { role: "Viewer", desc: "Read-only access to dashboards", count: 3 },
          ].map((r) => (
            <div key={r.role} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium text-foreground">{r.role}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <span className="text-xs text-muted-foreground">{r.count} users</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default Settings;
