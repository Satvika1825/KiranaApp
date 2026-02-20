/**
 * Product Management Page — Owner
 * Connected to backend API for all CRUD operations.
 */
import { useState, useEffect } from 'react';
import { Plus, Pencil, Check, X, Package } from 'lucide-react';
import { getProducts, updateProduct, addProduct, deleteProduct, generateId, getOwnerProfile, saveProducts } from '@/lib/store';
import { api } from '@/lib/api';
import { syncService } from '@/lib/sync';

const OwnerProducts = () => {
  const [products, setProducts] = useState(getProducts());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '' });
  const owner = getOwnerProfile();

  // Fetch products from backend on load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.products.getAll(owner?.id);
        if (data.products && data.products.length > 0) {
          // Map backend products to frontend format
          const mapped = data.products.map((p: any) => ({
            id: p.id,
            shopOwnerId: p.shopOwnerId,
            name: p.name,
            price: p.price,
            available: p.available,
            category: p.category,
            image: p.image || ''
          }));
          saveProducts(mapped);
          setProducts(mapped);
        }
      } catch {
        // Use localStorage products
        setProducts(getProducts());
      }
    };
    fetchProducts();
  }, []);

  const refresh = () => setProducts(getProducts());

  // Toggle product availability
  const handleToggle = async (id: string, current: boolean) => {
    updateProduct(id, { available: !current });
    refresh();
    try {
      await api.products.update(id, { available: !current });
      console.log('Availability synced to cloud');
    } catch {
      // Fallback: full sync if direct update fails
      syncService.syncOwnerData();
    }
  };

  // Start editing price
  const startEdit = (id: string, price: number) => {
    setEditingId(id);
    setEditPrice(String(price));
  };

  // Save edited price
  const saveEdit = async (id: string) => {
    const newPrice = Number(editPrice);
    updateProduct(id, { price: newPrice });
    setEditingId(null);
    refresh();
    try {
      await api.products.update(id, { price: newPrice });
      console.log('Price synced to cloud');
    } catch {
      syncService.syncOwnerData();
    }
  };

  // Add new product
  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.price) return;
    const product = {
      id: generateId(),
      shopOwnerId: owner?.id || 'owner1',
      name: newProduct.name,
      price: Number(newProduct.price),
      available: true,
      category: newProduct.category || 'General',
    };
    addProduct(product);
    setNewProduct({ name: '', price: '', category: '' });
    setShowAdd(false);
    refresh();
    try {
      await api.products.create(product);
      console.log('Product created in cloud');
    } catch {
      syncService.syncOwnerData();
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    deleteProduct(id);
    refresh();
    try {
      await api.products.delete(id);
      console.log('Product deleted from cloud');
    } catch {
      syncService.syncOwnerData();
    }
  };

  return (
    <div className="pb-20 lg:pb-0 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-foreground">Products ({products.length})</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Add New Product Form */}
      {showAdd && (
        <div className="kc-card-flat p-4 mb-4 space-y-3 animate-fade-in">
          <h3 className="font-heading font-bold text-foreground text-sm">New Product</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={newProduct.price}
              onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              placeholder="Category"
              value={newProduct.category}
              onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Product List */}
      {products.length === 0 ? (
        <div className="kc-card-flat p-8 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No products yet. Add your first product!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="kc-card-flat p-3 flex items-center gap-3">
              {/* Availability Toggle */}
              <button
                onClick={() => handleToggle(p.id, p.available)}
                className={`kc-toggle flex-shrink-0 ${p.available ? 'kc-toggle-on' : 'kc-toggle-off'}`}
                title={p.available ? 'Visible to customers' : 'Hidden from customers'}
              >
                <span className={`inline-block w-4 h-4 rounded-full bg-card shadow transform transition-transform ${p.available ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${p.available ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>

              {/* Price (editable) */}
              <div className="flex items-center gap-1.5">
                {editingId === p.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-foreground">₹</span>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="w-16 px-2 py-1 rounded border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(p.id)} className="p-1 text-primary hover:bg-primary/10 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-foreground text-sm">₹{p.price}</span>
                    <button onClick={() => startEdit(p.id, p.price)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Delete */}
              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerProducts;
