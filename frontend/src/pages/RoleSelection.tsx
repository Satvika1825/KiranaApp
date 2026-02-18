/**
 * Role Selection — Landing Page
 * Users choose between Owner and Customer roles.
 * Card-based selection UI with icons.
 */
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBag } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Hero Section */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Store className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground mb-2">
          Kirana<span className="text-primary">Connect</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-md">
          Your neighborhood kirana store, now digital. Order groceries or manage your shop — all in one place.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg animate-fade-in" style={{ animationDelay: '0.15s' }}>
        {/* Owner Card */}
        <button
          onClick={() => navigate('/owner/login')}
          className="kc-card p-6 text-left group cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-lg text-foreground mb-1">Store Owner</h2>
          <p className="text-muted-foreground text-sm">
            Manage your shop, products, and orders
          </p>
        </button>

        {/* Customer Card */}
        <button
          onClick={() => navigate('/customer/login')}
          className="kc-card p-6 text-left group cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-lg text-foreground mb-1">Customer</h2>
          <p className="text-muted-foreground text-sm">
            Browse stores and order groceries
          </p>
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-8">MVP Demo — No real authentication</p>
    </div>
  );
};

export default RoleSelection;
