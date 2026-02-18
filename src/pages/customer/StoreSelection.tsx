/**
 * Store Selection Page — Customer
 * Shows available stores with shop info, AM/PM timings, and open/closed indicator.
 * No ratings.
 */
import { useNavigate } from 'react-router-dom';
import { getShop } from '@/lib/store';
import { MapPin, Clock } from 'lucide-react';

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const StoreSelection = () => {
  const navigate = useNavigate();
  const shop = getShop();
  const stores = shop ? [shop] : [];

  const isOpen = (s: typeof shop) => {
    if (!s) return false;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = s.openingTime.split(':').map(Number);
    const [ch, cm] = s.closingTime.split(':').map(Number);
    return current >= oh * 60 + om && current <= ch * 60 + cm;
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">Nearby Stores</h2>
      <p className="text-sm text-muted-foreground mb-4">Select a store to browse products</p>

      {stores.length === 0 ? (
        <div className="kc-card-flat p-8 text-center text-muted-foreground text-sm">
          No stores available yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {stores.map((s, i) => {
            const open = isOpen(s);
            return (
              <button key={i} onClick={() => navigate('/customer/products')}
                className="kc-card p-4 text-left w-full focus:outline-none focus:ring-2 focus:ring-ring">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{s!.shopName}</h3>
                    <p className="text-xs text-muted-foreground">{s!.shopType}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${open ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                    {open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s!.address.area}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(s!.openingTime)} – {formatTime(s!.closingTime)}</span>
                  <span className="text-xs">~1.2 km</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoreSelection;
