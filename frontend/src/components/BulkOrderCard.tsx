import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp, Plus } from "lucide-react";

interface BulkOrderCardProps {
  apartmentName: string;
  participatingFamilies: number;
  timeRemaining: number; // in minutes
  deliveryDiscount: number;
  onJoin: () => void;
  isActive: boolean;
  windowStart: string;
  windowEnd: string;
}

const BulkOrderCard: React.FC<BulkOrderCardProps> = ({
  apartmentName,
  participatingFamilies,
  timeRemaining,
  deliveryDiscount,
  onJoin,
  isActive,
  windowStart,
  windowEnd,
}) => {
  const [displayTime, setDisplayTime] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const hours = Math.floor(timeRemaining / 60);
      const minutes = timeRemaining % 60;
      if (hours > 0) {
        setDisplayTime(`${hours}h ${minutes}m`);
      } else {
        setDisplayTime(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  return (
    <div
      className="bg-gradient-to-br from-indigo-50 via-purple-50 to-background rounded-3xl p-6 border-2 border-indigo-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]"
      style={{ animation: "slideUpCardBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both" }}
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full inline-flex items-center gap-1">
          <TrendingUp size={14} />
          BULK ORDER ACTIVE
        </span>
        {isActive && (
          <div
            className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />
        )}
      </div>

      {/* Apartment Name & Discount */}
      <div className="mb-5">
        <h3 className="text-2xl font-bold text-card-foreground font-display mb-2">
          {apartmentName}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full inline-flex items-center gap-1">
            💚 Save ₹{deliveryDiscount} on delivery
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Participating Families */}
        <div className="bg-white/60 backdrop-blur rounded-xl p-3 border border-indigo-100 hover:border-indigo-300 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-indigo-600" />
            <span className="text-xs font-semibold text-muted-foreground">Families</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{participatingFamilies}</p>
        </div>

        {/* Time Remaining */}
        <div className="bg-white/60 backdrop-blur rounded-xl p-3 border border-orange-100 hover:border-orange-300 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-orange-600" />
            <span className="text-xs font-semibold text-muted-foreground">Time Left</span>
          </div>
          <p className={`text-2xl font-bold ${timeRemaining <= 15 ? "text-red-600" : "text-orange-600"}`}>
            {displayTime}
          </p>
        </div>
      </div>

      {/* Order Window */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
        <p className="text-xs text-muted-foreground mb-1">Active Ordering Hours</p>
        <p className="text-sm font-bold text-card-foreground">
          {windowStart} – {windowEnd}
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onJoin}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Join Order
        </button>
        <button className="flex-1 bg-white border-2 border-indigo-200 text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-all">
          View Details
        </button>
      </div>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        ✨ Place your order during this window to save on delivery fees! Bundle with neighbors. 🏘️
      </p>
    </div>
  );
};

export default BulkOrderCard;
