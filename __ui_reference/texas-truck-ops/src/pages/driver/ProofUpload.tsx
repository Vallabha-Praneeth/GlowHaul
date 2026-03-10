import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BottomNav } from '@/components/BottomNav';
import { Camera, MapPin, Upload, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';

const ProofUpload = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [photos, setPhotos] = useState<string[]>([]);
  const [gpsConfirmed, setGpsConfirmed] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPhoto = () => {
    // Simulate photo upload
    const mockPhotoUrl = `https://picsum.photos/seed/${Date.now()}/400/300`;
    setPhotos([...photos, mockPhotoUrl]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // API call
    setTimeout(() => {
      navigate('/driver');
    }, 1500);
  };

  return (
    <div className="mobile-container">
      <ScreenHeader title="Proof of Service" showBack />

      <div className="screen-padding space-y-6">
        {/* GPS Confirmation */}
        <div className="card-gradient p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                gpsConfirmed ? 'bg-status-available' : 'bg-secondary'
              }`}>
                <MapPin className={`w-6 h-6 ${gpsConfirmed ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground">GPS Location</p>
                <p className="text-sm text-muted-foreground">
                  {gpsConfirmed ? 'Location confirmed' : 'Confirm your location'}
                </p>
              </div>
            </div>
            {!gpsConfirmed && (
              <button
                onClick={() => setGpsConfirmed(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
              >
                Confirm
              </button>
            )}
            {gpsConfirmed && (
              <CheckCircle2 className="w-6 h-6 text-status-available" />
            )}
          </div>
          {gpsConfirmed && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                📍 Downtown Dallas, TX • 32.7767° N, 96.7970° W
              </p>
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Photos ({photos.length}/5)
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                <img src={photo} alt={`Proof ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            ))}
            
            {photos.length < 5 && (
              <button
                onClick={handleAddPhoto}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Take photos of the truck at different locations during the run.
          </p>
        </div>

        {/* Photo Requirements */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Required Photos</h3>
          <div className="space-y-2">
            {[
              { label: 'Truck with LED screen visible', required: true },
              { label: 'Campaign content displayed', required: true },
              { label: 'Location landmark (optional)', required: false },
            ].map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  photos.length > index ? 'bg-status-available' : 'border border-muted-foreground'
                }`}>
                  {photos.length > index && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className={photos.length > index ? 'text-foreground' : 'text-muted-foreground'}>
                  {req.label}
                </span>
                {req.required && <span className="text-status-cancelled text-xs">*</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any issues or comments about the run..."
            rows={3}
            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!gpsConfirmed || photos.length < 2 || isSubmitting}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-primary"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Submit Proof
            </>
          )}
        </button>
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default ProofUpload;
