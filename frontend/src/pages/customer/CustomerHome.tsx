/**
 * Customer Home Page
 * Section 1: Nearby Stores (with AM/PM timings, no ratings)
 * Section 2: Popular Products (available=ON across stores)
 */
import { useNavigate } from 'react-router-dom';
import { getShop, getProducts } from '@/lib/store';
import { MapPin, Clock, Package, Store } from 'lucide-react';

/** Convert 24h "HH:MM" to "h:mm AM/PM" */
const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const isOpen = (openingTime: string, closingTime: string) => {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = openingTime.split(':').map(Number);
  const [ch, cm] = closingTime.split(':').map(Number);
  return current >= oh * 60 + om && current <= ch * 60 + cm;
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const shop = getShop();
  const stores = shop ? [shop] : [];
  const popularProducts = getProducts().filter(p => p.available).slice(0, 8);

  return (
    <div className="animate-fade-in">
      {/* Section 1: Nearby Stores */}
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">Nearby Stores</h2>
      <p className="text-sm text-muted-foreground mb-3">Discover stores around you</p>

      {stores.length === 0 ? (
        <div className="kc-card-flat p-8 text-center text-muted-foreground text-sm mb-6">
          No stores available yet.
        </div>
      ) : (
        <div className="grid gap-3 mb-6">
          {stores.map((s, i) => {
            const open = isOpen(s.openingTime, s.closingTime);
            return (
              <button key={i} onClick={() => navigate('/customer/products')}
                className="kc-card p-4 text-left w-full focus:outline-none focus:ring-2 focus:ring-ring">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{s.shopName}</h3>
                    <p className="text-xs text-muted-foreground">{s.shopType}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${open ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                    {open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.address.area}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(s.openingTime)} – {formatTime(s.closingTime)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Section 2: Popular Products */}
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">Popular Products</h2>
      <p className="text-sm text-muted-foreground mb-3">Available across nearby stores</p>

      {popularProducts.length === 0 ? (
        <div className="kc-card-flat p-8 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No products available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {popularProducts.map(p => (
            <button key={p.id} onClick={() => navigate('/customer/products')}
              className="kc-card-flat p-3 flex flex-col text-left hover:shadow-md transition-shadow">
              <div className="w-full aspect-square rounded-lg bg-accent/50 flex items-center justify-center mb-3">
                <Package className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="font-medium text-foreground text-sm flex-1 mb-1">{p.name}</h3>
              <p className="font-heading font-bold text-foreground">₹{p.price}</p>
              <span className="mt-2 w-full py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold text-center">
                Select
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
