/**
 * Store Selection Page — Customer
 * Fetches stores from backend API with localStorage fallback.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getShop } from '@/lib/store';
import { api } from '@/lib/api';
import { MapPin, Clock, Store } from 'lucide-react';

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const StoreSelection = () => {
  const navigate = useNavigate();
  const localShop = getShop();
  const [stores, setStores] = useState<any[]>(localShop ? [localShop] : []);

  // Fetch from backend
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await api.stores.getAll();
        if (data.stores && data.stores.length > 0) {
          setStores(data.stores);
        }
      } catch {
        // Fallback: use local shop
        if (localShop) setStores([localShop]);
      }
    };
    fetchStores();
  }, []);

  const isOpen = (s: any) => {
    if (!s) return false;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const open = s.openingTime || '07:00';
    const close = s.closingTime || '21:00';
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    return current >= oh * 60 + om && current <= ch * 60 + cm;
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">Nearby Stores</h2>
      <p className="text-sm text-muted-foreground mb-4">Select a store to browse products</p>

      {stores.length === 0 ? (
        <div className="kc-card-flat p-8 text-center">
          <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No stores available yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {stores.map((s, i) => {
            const open = isOpen(s);
            return (
              <button key={s._id || s.ownerId || i} onClick={() => navigate('/customer/products')}
                className="kc-card p-4 text-left w-full focus:outline-none focus:ring-2 focus:ring-ring">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{s.shopName}</h3>
                    <p className="text-xs text-muted-foreground">{s.shopType || 'Kirana'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${open ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                    {open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.address?.area || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(s.openingTime || '07:00')} – {formatTime(s.closingTime || '21:00')}</span>
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
