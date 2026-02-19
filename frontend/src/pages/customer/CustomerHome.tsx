/**
 * Customer Home Page
 * Fetches ALL stores from the backend and displays them.
 * Clicking a store navigates to its products page.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Package, Store, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

/** Convert 24h "HH:MM" to "h:mm AM/PM" */
const formatTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const isOpen = (openingTime: string, closingTime: string) => {
  if (!openingTime || !closingTime) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = openingTime.split(':').map(Number);
  const [ch, cm] = closingTime.split(':').map(Number);
  return current >= oh * 60 + om && current <= ch * 60 + cm;
};

interface StoreData {
  _id: string;
  shopName: string;
  shopType: string;
  shopPhoto?: string;
  address: { area?: string; houseNumber?: string; pinCode?: string };
  openingTime: string;
  closingTime: string;
  ownerId: string;
}

const CustomerHome = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await api.stores.getAll();
        setStores(data.stores || []);
      } catch (err) {
        setError('Could not load stores. Please try again.');
        console.error('Failed to fetch stores:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Section 1: Nearby Stores */}
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">Nearby Stores</h2>
      <p className="text-sm text-muted-foreground mb-3">Discover stores around you</p>

      {loading ? (
        <div className="grid gap-3 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="kc-card-flat p-4 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-1/4 mb-3" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="kc-card-flat p-6 text-center text-destructive text-sm mb-6">
          {error}
        </div>
      ) : stores.length === 0 ? (
        <div className="kc-card-flat p-8 text-center mb-6">
          <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No stores available yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 mb-6">
          {stores.map((s) => {
            const open = isOpen(s.openingTime, s.closingTime);
            return (
              <button
                key={s._id}
                onClick={() => navigate(`/customer/products?storeId=${s._id}&ownerId=${s.ownerId}`)}
                className="kc-card p-4 text-left w-full focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {s.shopPhoto ? (
                      <img src={s.shopPhoto} alt={s.shopName} className="w-12 h-12 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-heading font-bold text-foreground">{s.shopName}</h3>
                      <p className="text-xs text-muted-foreground">{s.shopType}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${open ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                    {open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  {s.address?.area && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.address.area}</span>
                  )}
                  {s.openingTime && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(s.openingTime)} – {formatTime(s.closingTime)}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Section 2: Info when no store selected */}
      {!loading && stores.length > 0 && (
        <>
          <h2 className="text-xl font-heading font-bold text-foreground mb-1">Browse Products</h2>
          <p className="text-sm text-muted-foreground mb-3">Select a store above to see its products</p>
          <div className="kc-card-flat p-6 text-center">
            <Package className="w-10 h-10 text-primary/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Tap a store to browse its products and add items to your cart.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerHome;
