import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { User, Building2, Phone, Mail, Bell, Shield, LogOut, ChevronRight, Moon } from 'lucide-react';

const mockProfile = {
  name: 'Texas Fleet Co.',
  email: 'fleet@texasfleet.com',
  phone: '+1 (512) 555-0123',
  role: 'operator' as const,
  company: 'Texas Fleet LLC',
  verified: true,
};

const Profile = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    offers: true,
    bookings: true,
    reminders: true,
    marketing: false,
  });

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="mobile-container pb-8">
      <ScreenHeader title="Profile" />

      <div className="screen-padding space-y-6">
        {/* Profile Header */}
        <div className="card-gradient p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{mockProfile.name}</h2>
                {mockProfile.verified && (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground capitalize">{mockProfile.role}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contact</h3>
          <div className="card-gradient divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{mockProfile.phone}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{mockProfile.email}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium text-foreground">{mockProfile.company}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notifications</h3>
          <div className="card-gradient divide-y divide-border">
            {[
              { key: 'offers', label: 'New Offers', description: 'Get notified when you receive offers' },
              { key: 'bookings', label: 'Booking Updates', description: 'Status changes and reminders' },
              { key: 'reminders', label: 'Run Reminders', description: 'Alerts before scheduled runs' },
              { key: 'marketing', label: 'News & Updates', description: 'Product updates and tips' },
            ].map((item) => (
              <div key={item.key} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <button
                  onClick={() => setNotifications({ 
                    ...notifications, 
                    [item.key]: !notifications[item.key as keyof typeof notifications] 
                  })}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Other Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Settings</h3>
          <div className="card-gradient divide-y divide-border">
            <button className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Security</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Appearance</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-status-cancelled-bg border border-status-cancelled/20 rounded-xl font-semibold text-status-cancelled flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          QuantumOps v1.0.0 • LED Truck Network
        </p>
      </div>
    </div>
  );
};

export default Profile;
