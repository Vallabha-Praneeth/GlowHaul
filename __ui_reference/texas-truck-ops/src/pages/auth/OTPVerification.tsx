import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Truck } from 'lucide-react';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '(512) 555-0123';

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newOtp.every((digit) => digit) && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (code: string) => {
    // Simulate verification - in real app, call API
    console.log('Verifying code:', code);
    // Navigate to role selection or dashboard
    navigate('/role-select');
  };

  const handleResend = () => {
    setResendTimer(30);
    // Resend OTP logic
  };

  return (
    <div className="mobile-container flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 py-4 flex items-center">
        <button onClick={() => navigate(-1)} className="tap-target -ml-3">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
      </header>

      <div className="flex-1 px-6 py-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">QuantumOps</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">Enter verification code</h2>
        <p className="text-muted-foreground mb-8">
          We sent a 6-digit code to{' '}
          <span className="text-foreground font-medium">+1 {phone}</span>
        </p>

        {/* OTP Input */}
        <div className="flex gap-3 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 bg-secondary border-2 border-border rounded-xl text-center text-xl font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              maxLength={1}
            />
          ))}
        </div>

        {/* Resend */}
        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{' '}
              <span className="text-foreground font-medium">{resendTimer}s</span>
            </p>
          ) : (
            <button onClick={handleResend} className="text-sm text-primary font-medium">
              Resend code
            </button>
          )}
        </div>
      </div>

      {/* Demo shortcuts */}
      <div className="px-6 pb-8">
        <p className="text-xs text-muted-foreground text-center mb-3">Demo: Select a role to continue</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate('/operator')}
            className="py-3 bg-secondary border border-border rounded-xl text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
          >
            Operator
          </button>
          <button
            onClick={() => navigate('/broker')}
            className="py-3 bg-secondary border border-border rounded-xl text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
          >
            Broker
          </button>
          <button
            onClick={() => navigate('/driver')}
            className="py-3 bg-secondary border border-border rounded-xl text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
          >
            Driver
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
