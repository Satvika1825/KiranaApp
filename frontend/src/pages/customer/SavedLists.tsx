import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerProfile } from '@/lib/store';
import { api } from '@/lib/api';
import { List, Plus, Trash2, ShoppingCart, Package, Loader2, AlertCircle } from 'lucide-react';

const SavedLists = () => {
  const navigate = useNavigate();
  const customer = getCustomerProfile();
  const userId = customer?.id || 'guest';

  const [products, setProducts] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, listsData] = await Promise.all([
        api.products.getAll(),
        api.customer.getSavedLists(userId)
      ]);
      setProducts((productsData.products || []).filter((p: any) => p.available));
      setLists(listsData.savedLists || []);
    } catch (err) {
      setError('Failed to load saved lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleCreate = async () => {
    if (!newName || selectedProducts.length === 0) return;
    setActionLoading(true);
    try {
      await api.customer.addSavedList({
        userId,
        name: newName,
        productIds: selectedProducts
      });
      setNewName('');
      setSelectedProducts([]);
      setShowCreate(false);
      fetchData();
    } catch (err) {
      alert('Failed to create list');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;
    try {
      await api.customer.deleteSavedList(userId, id);
      setLists(lists.filter(l => l._id !== id));
    } catch (err) {
      alert('Failed to delete list');
    }
  };

  const addListToCart = async (productIds: string[]) => {
    setActionLoading(true);
    try {
      const cartRes = await api.cart.get(userId);
      const currentItems = cartRes.items || [];
      const updatedItems = [...currentItems];

      productIds.forEach(pid => {
        const prod = products.find(p => (p._id || p.id) === pid);
        if (!prod) return;

        const existing = updatedItems.find(c => c.productId === pid);
        if (existing) {
          existing.quantity += 1;
        } else {
          updatedItems.push({
            productId: pid,
            name: prod.name,
            price: prod.price,
            shopOwnerId: prod.shopOwnerId,
            quantity: 1
          });
        }
      });

      await api.cart.update(userId, updatedItems);
      navigate('/customer/cart');
    } catch (err) {
      alert('Failed to add items to cart');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading your saved lists...</p>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Saved Lists</h2>
          <p className="text-sm text-muted-foreground">Quick reorder lists</p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition-all">
            <Plus className="w-4 h-4" /> New List
          </button>
        )}
      </div>

      {showCreate && (
        <div className="kc-card p-5 mb-6 space-y-4 animate-in slide-in-from-top-4 duration-300 shadow-xl border-primary/20">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary bg-background text-sm font-medium outline-none transition-all"
            placeholder="List name (e.g. Weekly Groceries)" />

          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Select products ({selectedProducts.length} selected)</p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {products.map(p => (
                <button key={p._id || p.id} onClick={() => toggleProduct(p._id || p.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${selectedProducts.includes(p._id || p.id) ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-border bg-white hover:border-muted-foreground/30'}`}>
                  <p className="font-bold text-foreground text-xs truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">₹{p.price}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={actionLoading || !newName || selectedProducts.length === 0}
              className="flex-1 bg-primary text-primary-foreground h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-95 transition-all flex items-center justify-center disabled:opacity-50">
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save List'}
            </button>
            <button onClick={() => { setShowCreate(false); setSelectedProducts([]); }}
              className="px-6 h-12 bg-muted text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {lists.length === 0 && !showCreate ? (
        <div className="kc-card p-12 text-center text-muted-foreground bg-muted/30 border-dashed border-2">
          <List className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No saved lists yet</p>
          <p className="text-[11px] mt-1">Create lists for items you buy often</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map(l => (
            <div key={l._id} className="kc-card p-5 group hover:border-primary/50 transition-all border-2 border-transparent shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <List className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-foreground">{l.name}</h3>
                </div>
                <button onClick={() => handleDelete(l._id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {l.productIds.slice(0, 4).map((pid: string) => {
                  const p = products.find(prod => (prod._id || prod.id) === pid);
                  return p ? (
                    <span key={pid} className="bg-muted px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground">{p.name}</span>
                  ) : null;
                })}
                {l.productIds.length > 4 && <span className="bg-muted px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground">+{l.productIds.length - 4} more</span>}
              </div>

              <button onClick={() => addListToCart(l.productIds)} disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition-all disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4" /> Add All to Cart</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedLists;
