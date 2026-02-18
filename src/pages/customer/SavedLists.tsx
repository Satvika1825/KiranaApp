/**
 * Saved Lists Page — Customer
 * Create named shopping lists and quickly add items to cart.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSavedLists, addSavedList, deleteSavedList, generateId,
  getCustomerProfile, getProducts, getCart, saveCart,
} from '@/lib/store';
import { List, Plus, Trash2, ShoppingCart, Package } from 'lucide-react';

const SavedLists = () => {
  const navigate = useNavigate();
  const customer = getCustomerProfile();
  const products = getProducts().filter(p => p.available);
  const [lists, setLists] = useState(getSavedLists());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const handleCreate = () => {
    if (!newName || selectedProducts.length === 0) return;
    const list = {
      id: generateId(),
      customerId: customer?.id || 'guest',
      name: newName,
      productIds: selectedProducts,
      createdAt: new Date().toISOString(),
    };
    addSavedList(list);
    setLists([...lists, list]);
    setNewName('');
    setSelectedProducts([]);
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    deleteSavedList(id);
    setLists(lists.filter(l => l.id !== id));
  };

  const addListToCart = (productIds: string[]) => {
    const cart = getCart();
    productIds.forEach(pid => {
      const prod = products.find(p => p.id === pid);
      if (!prod) return;
      const existing = cart.find(c => c.product.id === pid);
      if (existing) existing.quantity += 1;
      else cart.push({ product: prod, quantity: 1 });
    });
    saveCart(cart);
    navigate('/customer/cart');
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">Saved Lists</h2>
          <p className="text-sm text-muted-foreground">Quick reorder lists</p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New List
          </button>
        )}
      </div>

      {showCreate && (
        <div className="kc-card-flat p-4 mb-4 space-y-3">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="List name (e.g. Monthly Groceries)" />
          <p className="text-xs text-muted-foreground">Select products:</p>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {products.map(p => (
              <button key={p.id} onClick={() => toggleProduct(p.id)}
                className={`p-2 rounded-lg border text-left text-xs transition-colors ${selectedProducts.includes(p.id) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <p className="font-medium text-foreground truncate">{p.name}</p>
                <p className="text-muted-foreground">₹{p.price}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
              Save List ({selectedProducts.length} items)
            </button>
            <button onClick={() => { setShowCreate(false); setSelectedProducts([]); }}
              className="px-4 py-2.5 bg-muted text-muted-foreground rounded-lg font-semibold text-sm">Cancel</button>
          </div>
        </div>
      )}

      {lists.length === 0 && !showCreate ? (
        <div className="kc-card-flat p-8 text-center">
          <List className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No saved lists yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(l => {
            const listProducts = l.productIds.map(id => products.find(p => p.id === id)).filter(Boolean);
            return (
              <div key={l.id} className="kc-card-flat p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-bold text-foreground text-sm">{l.name}</h3>
                  <button onClick={() => handleDelete(l.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {listProducts.length} item{listProducts.length !== 1 ? 's' : ''}
                  {listProducts.length > 0 && ` · ${listProducts.map(p => p!.name).slice(0, 3).join(', ')}${listProducts.length > 3 ? '...' : ''}`}
                </p>
                <button onClick={() => addListToCart(l.productIds)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
                  <ShoppingCart className="w-3 h-3" /> Add All to Cart
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedLists;
