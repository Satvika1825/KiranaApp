/**
 * Product Management Page — Owner
 * Section 1: My Store Products (added products)
 * Section 2: Add from Catalog (full product catalog with toggles)
 * Top: "Add Custom Product" button → modal form
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, Package, Check, X, Pencil, Plus, Trash2, Store, BookOpen } from 'lucide-react';
import { getOwnerProfile, generateId } from '@/lib/store';
import { api } from '@/lib/api';

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  unit: string;
  image: string;
}

interface StoreProduct {
  id: string;
  price: number;
  available: boolean;
}

interface CustomProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  isCustom: true;
}

const EMPTY_CUSTOM = { name: '', price: '', category: '', unit: '' };

const OwnerProducts = () => {
  const owner = getOwnerProfile();
  const ownerId = owner?.id || '';

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([]);
  const [activeMap, setActiveMap] = useState<Record<string, StoreProduct>>({});
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'store' | 'catalog'>('store');

  // Custom product modal state
  const [showModal, setShowModal] = useState(false);
  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM);
  const [savingCustom, setSavingCustom] = useState(false);
  const [customError, setCustomError] = useState('');

  // Load catalog + owner's active products
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await api.products.seedCatalog();
      const [catalogRes, productsRes] = await Promise.all([
        api.products.getCatalog(),
        api.products.getAll(ownerId),
      ]);

      setCatalog(catalogRes.catalog || []);

      const map: Record<string, StoreProduct> = {};
      const customs: CustomProduct[] = [];

      // Catalog IDs (to detect custom products)
      const catalogIds = new Set((catalogRes.catalog || []).map((c: CatalogItem) => c.id));

      (productsRes.products || []).forEach((p: any) => {
        map[p.id] = { id: p.id, price: p.price, available: p.available };
        // If the product ID isn't in the master catalog, it's custom
        if (!catalogIds.has(p.id)) {
          customs.push({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            unit: p.unit || '',
            isCustom: true,
          });
        }
      });

      setActiveMap(map);
      setCustomProducts(customs);
    } catch (err: any) {
      setError('Failed to load products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Toggle catalog product in/out of store
  const handleToggle = async (item: CatalogItem) => {
    const isActive = !!activeMap[item.id];
    setTogglingId(item.id);
    try {
      await api.products.toggleCatalogProduct(item.id, ownerId, !isActive, item.defaultPrice);
      if (isActive) {
        setActiveMap(prev => { const next = { ...prev }; delete next[item.id]; return next; });
      } else {
        setActiveMap(prev => ({ ...prev, [item.id]: { id: item.id, price: item.defaultPrice, available: true } }));
      }
    } catch (err: any) {
      setError(err.message || 'Toggle failed');
    } finally {
      setTogglingId(null);
    }
  };

  // Remove a custom product from store
  const handleRemoveCustom = async (id: string) => {
    setTogglingId(id);
    try {
      await api.products.delete(id);
      setCustomProducts(prev => prev.filter(p => p.id !== id));
      setActiveMap(prev => { const next = { ...prev }; delete next[id]; return next; });
    } catch {
      setError('Failed to remove product');
    } finally {
      setTogglingId(null);
    }
  };

  // Save edited price
  const savePrice = async (itemId: string) => {
    const newPrice = Number(editPrice);
    if (!newPrice || newPrice <= 0) return;
    try {
      await api.products.update(itemId, { price: newPrice });
      setActiveMap(prev => ({ ...prev, [itemId]: { ...prev[itemId], price: newPrice } }));
      setCustomProducts(prev => prev.map(p => p.id === itemId ? { ...p, price: newPrice } : p));
    } catch {
      setError('Failed to update price');
    }
    setEditingId(null);
  };

  // Save custom product
  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError('');
    if (!customForm.name || !customForm.price) {
      setCustomError('Name and price are required.');
      return;
    }
    setSavingCustom(true);
    try {
      const newId = generateId();
      const product = {
        id: newId,
        shopOwnerId: ownerId,
        name: customForm.name.trim(),
        price: Number(customForm.price),
        category: customForm.category.trim() || 'General',
        available: true,
        image: '',
        unit: customForm.unit.trim(),
      };
      await api.products.create(product);
      const newCustom: CustomProduct = { id: newId, name: product.name, category: product.category, price: product.price, unit: product.unit, isCustom: true };
      setCustomProducts(prev => [...prev, newCustom]);
      setActiveMap(prev => ({ ...prev, [newId]: { id: newId, price: product.price, available: true } }));
      setCustomForm(EMPTY_CUSTOM);
      setShowModal(false);
      setActiveTab('store'); // switch to My Store to see the new product
    } catch (err: any) {
      setCustomError(err.message || 'Failed to add product');
    } finally {
      setSavingCustom(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(catalog.map(c => c.category))).sort()];

  // My Store: catalog items that are active + all custom products
  const storeFromCatalog = catalog.filter(item => !!activeMap[item.id]);
  const filteredStore = [
    ...storeFromCatalog,
  ].filter(item => {
    const matchCat = filterCategory === 'All' || item.category === filterCategory;
    return item.name.toLowerCase().includes(search.toLowerCase()) && matchCat;
  });
  const filteredCustom = customProducts.filter(item => {
    const matchCat = filterCategory === 'All' || item.category === filterCategory;
    return item.name.toLowerCase().includes(search.toLowerCase()) && matchCat;
  });

  const totalStoreCount = Object.keys(activeMap).length;

  // Catalog tab: only not-yet-added
  const notAdded = catalog.filter(item => !activeMap[item.id]);
  const filteredCatalog = notAdded.filter(item => {
    const matchCat = catalogCategory === 'All' || item.category === catalogCategory;
    return item.name.toLowerCase().includes(catalogSearch.toLowerCase()) && matchCat;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">Products</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalStoreCount} in your store · {catalog.length} in catalog
          </p>
        </div>
        {/* ── ADD CUSTOM PRODUCT BUTTON ── */}
        <button
          onClick={() => { setShowModal(true); setCustomError(''); setCustomForm(EMPTY_CUSTOM); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Custom
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all
            ${activeTab === 'store' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          <Store className="w-4 h-4" />
          My Store ({totalStoreCount})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all
            ${activeTab === 'catalog' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          <BookOpen className="w-4 h-4" />
          Add from Catalog ({notAdded.length})
        </button>
      </div>

      {/* ══════════ MY STORE SECTION ══════════ */}
      {activeTab === 'store' && (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search your products..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {filteredStore.length === 0 && filteredCustom.length === 0 ? (
            <div className="kc-card-flat p-10 text-center">
              <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-foreground mb-1">No products in your store yet</p>
              <p className="text-sm text-muted-foreground mb-3">
                Add from the catalog or click <strong>"Add Custom"</strong> to create your own.
              </p>
              <button onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90">
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Catalog-sourced products */}
              {filteredStore.map(item => {
                const storeProduct = activeMap[item.id];
                const isEditing = editingId === item.id;
                const isToggling = togglingId === item.id;
                return (
                  <ProductRow key={item.id} name={item.name} category={item.category} unit={(item as any).unit || ''}
                    price={storeProduct.price} isEditing={isEditing} editPrice={editPrice}
                    isToggling={isToggling}
                    onEditStart={() => { setEditingId(item.id); setEditPrice(String(storeProduct.price)); }}
                    onEditChange={setEditPrice}
                    onSave={() => savePrice(item.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onRemove={() => handleToggle(item as CatalogItem)}
                  />
                );
              })}
              {/* Custom products */}
              {filteredCustom.map(item => {
                const isEditing = editingId === item.id;
                const isToggling = togglingId === item.id;
                return (
                  <ProductRow key={item.id} name={item.name} category={item.category} unit={item.unit}
                    price={item.price} isEditing={isEditing} editPrice={editPrice}
                    isToggling={isToggling} isCustom
                    onEditStart={() => { setEditingId(item.id); setEditPrice(String(item.price)); }}
                    onEditChange={setEditPrice}
                    onSave={() => savePrice(item.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onRemove={() => handleRemoveCustom(item.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════ CATALOG SECTION ══════════ */}
      {activeTab === 'catalog' && (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search catalog..." value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <select value={catalogCategory} onChange={e => setCatalogCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="kc-card-flat p-8 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {notAdded.length === 0 ? 'All catalog products are already in your store! 🎉' : 'No products match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCatalog.map(item => {
                const isToggling = togglingId === item.id;
                return (
                  <div key={item.id} className="kc-card-flat p-3 flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.category} · {item.unit}</p>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground flex-shrink-0">₹{item.defaultPrice}</span>
                    <button onClick={() => !isToggling && handleToggle(item)} disabled={isToggling}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════ ADD CUSTOM PRODUCT MODAL ══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-bold text-foreground">Add Custom Product</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Product Name *</label>
                <input type="text" placeholder="e.g. Organic Honey" value={customForm.name}
                  onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Price (₹) *</label>
                  <input type="number" placeholder="e.g. 150" value={customForm.price} min="1"
                    onChange={e => setCustomForm({ ...customForm, price: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Unit</label>
                  <input type="text" placeholder="e.g. 500g, 1L" value={customForm.unit}
                    onChange={e => setCustomForm({ ...customForm, unit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Category</label>
                <input type="text" placeholder="e.g. Organic, Specialty" value={customForm.category}
                  onChange={e => setCustomForm({ ...customForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              {customError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{customError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border text-foreground text-sm font-medium hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingCustom}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingCustom ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Reusable product row for My Store ──
const ProductRow = ({ name, category, unit, price, isEditing, editPrice, isToggling, isCustom,
  onEditStart, onEditChange, onSave, onCancelEdit, onRemove }:
  {
    name: string; category: string; unit: string; price: number; isEditing: boolean; editPrice: string;
    isToggling: boolean; isCustom?: boolean; onEditStart: () => void; onEditChange: (v: string) => void;
    onSave: () => void; onCancelEdit: () => void; onRemove: () => void
  }) => (
  <div className="kc-card-flat p-3 flex items-center gap-3">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium text-sm text-foreground truncate">{name}</p>
        {isCustom && (
          <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Custom</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{category}{unit ? ` · ${unit}` : ''}</p>
    </div>
    <div className="flex-shrink-0">
      {isEditing ? (
        <div className="flex items-center gap-1">
          <span className="text-sm">₹</span>
          <input type="number" value={editPrice} onChange={e => onEditChange(e.target.value)}
            className="w-16 px-2 py-1 rounded border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancelEdit(); }} />
          <button onClick={onSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
          <button onClick={onCancelEdit} className="p-1 text-muted-foreground hover:bg-muted rounded"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <span className="font-bold text-sm text-foreground">₹{price}</span>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {!isEditing && (
        <button onClick={onEditStart}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-accent transition-colors">
          <Pencil className="w-3 h-3" /> Edit Price
        </button>
      )}
      <button onClick={onRemove} disabled={isToggling}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50">
        <Trash2 className="w-3 h-3" /> Remove
      </button>
    </div>
  </div>
);

export default OwnerProducts;
