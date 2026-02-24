import { useState, useEffect } from "react";
import { X, MapPin, Users, Check } from "lucide-react";

interface JoinBulkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentName: string;
  onConfirm: () => void;
  participatingFamilies: number;
  deliveryDiscount: number;
}

const JoinBulkOrderModal: React.FC<JoinBulkOrderModalProps> = ({
  isOpen,
  onClose,
  apartmentName,
  onConfirm,
  participatingFamilies,
  deliveryDiscount,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUpEnhanced 0.5s ease-out both" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-card-foreground transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-card-foreground mb-2 font-display">Join Bulk Order?</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Place orders together with your neighbors and save on delivery!
        </p>

        {/* Apartment Info */}
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Your Apartment</p>
              <p className="font-bold text-card-foreground">{apartmentName}</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <h3 className="font-bold text-card-foreground text-sm">Your Benefits:</h3>

          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Check size={18} className="text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-green-800">Save ₹{deliveryDiscount}</p>
              <p className="text-xs text-green-700">Bulk ordering discount</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <Users size={18} className="text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-purple-800">{participatingFamilies} families</p>
              <p className="text-xs text-purple-700">Already ordering together</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              ⚡
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-800">Faster Delivery</p>
              <p className="text-xs text-blue-700">Multi-order batch optimization</p>
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-primary mt-1 accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            I agree to participate in this bulk order and accept the delivery window for my apartment
          </span>
        </label>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-secondary text-card-foreground font-bold rounded-xl hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              setConfirmed(false);
            }}
            disabled={!confirmed}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold rounded-xl hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Yes, Join Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinBulkOrderModal;
