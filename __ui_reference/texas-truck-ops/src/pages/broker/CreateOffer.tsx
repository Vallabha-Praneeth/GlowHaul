import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { RegionChip } from '@/components/RegionChip';
import { DollarSign, Truck, Calendar, Clock, Send } from 'lucide-react';

const mockSlot = {
  truckName: 'LED-TX-001',
  screenSize: '20x10 ft',
  region: 'DFW' as const,
  date: 'January 15, 2025',
  timeWindow: '6:00 PM - 10:00 PM',
  askingPrice: 2500,
};

const CreateOffer = () => {
  const navigate = useNavigate();
  const { slotId } = useParams();

  const [formData, setFormData] = useState({
    amount: '',
    message: '',
    expiresIn: '24',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // API call
    navigate('/broker/offers');
  };

  const offerAmount = parseInt(formData.amount) || 0;
  const difference = mockSlot.askingPrice - offerAmount;
  const percentDiff = offerAmount > 0 ? Math.round((difference / mockSlot.askingPrice) * 100) : 0;

  return (
    <div className="mobile-container">
      <ScreenHeader title="Make Offer" showBack />

      <form onSubmit={handleSubmit} className="screen-padding space-y-6">
        {/* Slot Summary */}
        <div className="card-gradient p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{mockSlot.truckName}</h3>
              <p className="text-sm text-muted-foreground">{mockSlot.screenSize}</p>
            </div>
            <RegionChip region={mockSlot.region} />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{mockSlot.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{mockSlot.timeWindow}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Asking price</span>
            <span className="font-semibold text-foreground">${mockSlot.askingPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Offer Amount */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Your Offer</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder={mockSlot.askingPrice.toString()}
              className="w-full pl-12 pr-4 py-4 bg-secondary border-2 border-primary/20 rounded-xl text-foreground text-2xl font-bold focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>
          {offerAmount > 0 && (
            <p className={`text-sm ${difference > 0 ? 'text-status-available' : difference < 0 ? 'text-status-cancelled' : 'text-muted-foreground'}`}>
              {difference > 0 ? `$${difference} below asking (${percentDiff}% discount)` : 
               difference < 0 ? `$${Math.abs(difference)} above asking` : 
               'At asking price'}
            </p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2">
          {[0.9, 0.95, 1].map((multiplier) => {
            const amount = Math.round(mockSlot.askingPrice * multiplier);
            return (
              <button
                key={multiplier}
                type="button"
                onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  formData.amount === amount.toString()
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary text-foreground border-border hover:border-primary/50'
                }`}
              >
                ${amount.toLocaleString()}
                <span className="block text-xs opacity-70">
                  {multiplier === 1 ? 'Full' : `${Math.round((1 - multiplier) * 100)}% off`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Message (Optional)</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Introduce yourself or add details about your campaign..."
            rows={3}
            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Expiry */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Offer Expires In</label>
          <div className="flex gap-2">
            {['12', '24', '48'].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setFormData({ ...formData, expiresIn: hours })}
                className={`flex-1 py-3 text-sm font-medium rounded-lg border transition-colors ${
                  formData.expiresIn === hours
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary text-foreground border-border hover:border-primary/50'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!formData.amount}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-primary"
        >
          <Send className="w-5 h-5" />
          Send Offer
        </button>
      </form>

      <BottomNav role="broker" />
    </div>
  );
};

export default CreateOffer;
