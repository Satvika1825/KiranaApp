import { Store, MapPin, Clock } from "lucide-react";

interface FavouriteStore {
  _id: string;
  ownerId?: string;
  shopName: string;
  address?: { area?: string };
  openingTime?: string;
  closingTime?: string;
  shopPhoto?: string | null;
}

interface FavStoreCardProps {
  store: FavouriteStore;
  onClick: () => void;
  index: number;
}

const FavStoreCard = ({ store, onClick, index }: FavStoreCardProps) => (
  <div
    onClick={onClick}
    className="min-w-[260px] bg-card rounded-2xl border border-border overflow-hidden flex-shrink-0 snap-start cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-slide-in"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <div className="relative h-32 bg-secondary overflow-hidden">
      {store.shopPhoto ? (
        <img src={store.shopPhoto} alt={store.shopName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <Store className="w-12 h-12 text-primary/40" />
        </div>
      )}
      <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow-md">
        Open
      </span>
    </div>
    <div className="p-4 space-y-2">
      <h3 className="font-bold text-card-foreground truncate">{store.shopName}</h3>
      <div className="space-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> {store.address?.area || "Local Market"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> {store.openingTime || "7:00 AM"} – {store.closingTime || "9:00 PM"}
        </span>
      </div>
    </div>
  </div>
);

export default FavStoreCard;
