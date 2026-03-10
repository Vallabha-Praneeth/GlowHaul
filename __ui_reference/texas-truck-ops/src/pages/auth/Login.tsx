import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Truck } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      navigate('/auth/verify', { state: { phone } });
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  return (
    <div className="mobile-container flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-primary">
            <Truck className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">QuantumOps</h1>
            <p className="text-sm text-muted-foreground">LED Truck Network</p>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground">
            Sign in to manage your LED truck operations across Texas.
          </p>
        </div>

        {/* Phone Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
                <Phone className="w-5 h-5" />
                <span className="text-sm">+1</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(512) 555-0123"
                className="w-full pl-20 pr-4 py-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                maxLength={14}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={phone.replace(/\D/g, '').length < 10}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity glow-primary"
          >
            Continue
          </button>
        </form>

        {/* Terms */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to our{' '}
          <span className="text-primary">Terms of Service</span> and{' '}
          <span className="text-primary">Privacy Policy</span>
        </p>
      </div>

      {/* Texas Regions Badge */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-secondary/50 rounded-xl">
          <span className="text-xs text-muted-foreground">Serving</span>
          <div className="flex flex-wrap gap-1 justify-center">
            {['DFW', 'Houston', 'Austin', 'San Antonio'].map((region) => (
              <span key={region} className="text-xs text-primary font-medium">
                {region}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
