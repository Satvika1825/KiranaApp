/**
 * Customer Home Page
 * Fetches ALL stores from the backend and displays them as rich cards.
 * Includes Search, Filter, and Map/List View toggle.
 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Package, Store, Loader2, Star, Truck, Search, Filter, List, Map as MapIcon, ChevronDown, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Import CSS and Assets
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { api } from '@/lib/api';

// Globally configure Leaflet icons
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

/** Helper to convert 24h "HH:MM" to "h:mm AM/PM" */
const formatTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const isOpenNow = (openingTime: string, closingTime: string) => {
  if (!openingTime || !closingTime) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = openingTime.split(':').map(Number);
  const [ch, cm] = closingTime.split(':').map(Number);
  return current >= oh * 60 + om && current <= ch * 60 + cm;
};

/** Component to fix Leaflet's grey/blank tiles issue */
const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
    // Force tile redraw
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [center, map]);
  return null;
};

const getPopularTags = (shopType: string): string[] => {
  const map: Record<string, string[]> = {
    'Kirana': ['Milk', 'Snacks', 'Eggs'],
    'Grocery': ['Vegetables', 'Fruits', 'Dal'],
    'Pharmacy': ['Medicines', 'Vitamins', 'Masks'],
    'Bakery': ['Bread', 'Cakes', 'Pastries'],
    'Dairy': ['Milk', 'Paneer', 'Curd'],
    'Supermarket': ['FMCG', 'Beverages', 'Grains'],
  };
  return map[shopType] || ['Groceries', 'Essentials', 'Daily Needs'];
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
  lat: number;
  lng: number;
}

const CustomerHome = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Default center: Bangalore
  const mapCenter: [number, number] = [12.9716, 77.5946];

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await api.stores.getAll();

        // Mocking coordinates for the map
        const storesWithCoords = (data.stores || []).map((s: any) => ({
          ...s,
          lat: mapCenter[0] + (Math.random() - 0.5) * 0.04,
          lng: mapCenter[1] + (Math.random() - 0.5) * 0.04,
        }));

        setStores(storesWithCoords);
      } catch (err) {
        setError('Could not load stores. Please try again.');
        console.error('Failed to fetch stores:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    const q = (searchQuery || '').toLowerCase();

    return stores.filter(s => {
      if (!s) return false;
      const name = (s.shopName || '').toLowerCase();
      const type = (s.shopType || '').toLowerCase();

      const matchesSearch = name.includes(q) || type.includes(q);
      const matchesOpen = filterOpenOnly ? isOpenNow(s.openingTime, s.closingTime) : true;
      return matchesSearch && matchesOpen;
    });
  }, [stores, searchQuery, filterOpenOnly]);

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-1">Nearby Stores</h2>
          <p className="text-sm text-muted-foreground">Discover stores around you</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-input h-10 pl-9 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-medium transition-all shadow-sm ${showFilters ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-input text-foreground hover:bg-muted'}`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-muted rounded-xl border border-input shadow-sm h-10">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="mb-6 p-4 bg-muted/40 border border-input rounded-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Active Filters</p>
            <button onClick={() => { setSearchQuery(''); setFilterOpenOnly(false); setShowFilters(false); }} className="text-xs text-primary font-medium hover:underline">Clear all</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterOpenOnly(!filterOpenOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterOpenOnly ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200' : 'bg-white border-input text-muted-foreground hover:border-primary/50'}`}
            >
              Open Now
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="kc-card-flat p-4 animate-pulse min-h-[260px]">
              <div className="w-full h-20 bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-2 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="kc-card-flat p-12 text-center text-destructive text-sm bg-destructive/5 border-destructive/20">
          <p>{error}</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="kc-card-flat p-12 text-center">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-heading font-bold text-lg mb-1">No stores found</p>
          <p className="text-muted-foreground text-sm">Try changing your search terms</p>
        </div>
      ) : (
        <div className="relative">
          {/* List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {filteredStores.map((s) => {
                const open = isOpenNow(s.openingTime, s.closingTime);
                const tags = getPopularTags(s.shopType);
                return (
                  <div key={s._id} className="kc-card flex flex-col overflow-hidden min-h-[260px] group">
                    <div className="relative w-full h-24 bg-primary/10 flex items-center justify-center overflow-hidden">
                      {s.shopPhoto ? (
                        <img src={s.shopPhoto} alt={s.shopName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <Store className="w-10 h-10 text-primary/50" />
                      )}
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold shadow ${open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {open ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1 p-3 gap-2">
                      <div>
                        <p className="font-heading font-bold text-foreground text-base leading-tight line-clamp-1">{s.shopName}</p>
                        <p className="text-[11px] text-muted-foreground">{s.shopType}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-primary" /> ₹15</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> 30m</span>
                        {s.address?.area && <span className="flex items-center gap-1 border-l pl-2"><MapPin className="w-3 h-3" /> {s.address.area}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {tags.slice(0, 3).map(tag => (
                          <span key={tag} className="bg-muted text-muted-foreground text-[9px] px-2 py-0.5 rounded-md font-medium">{tag}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => navigate(`/customer/products?storeId=${s._id}&ownerId=${s.ownerId}`)}
                        className="mt-3 w-full bg-primary text-primary-foreground text-xs font-bold py-2 rounded-xl hover:bg-primary/90 transition-all font-heading"
                      >
                        View Store
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-input shadow-lg bg-muted animate-in fade-in slide-in-from-bottom-5 duration-500 z-0">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '500px', width: '100%' }}
                scrollWheelZoom={true}
                key="customer-map"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap center={mapCenter} />

                {filteredStores.map(s => (
                  <Marker key={s._id} position={[s.lat, s.lng]}>
                    <Popup className="store-popup">
                      <div className="p-1 min-w-[140px] text-center">
                        <p className="font-heading font-bold text-foreground mb-0.5">{s.shopName}</p>
                        <p className="text-[10px] text-muted-foreground mb-2">{s.shopType}</p>
                        <button
                          onClick={() => navigate(`/customer/products?storeId=${s._id}&ownerId=${s.ownerId}`)}
                          className="w-full bg-primary text-white text-[10px] py-1.5 rounded-lg font-bold hover:bg-primary/90 transition-colors"
                        >
                          Open Store
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
