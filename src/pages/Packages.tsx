import type { FormEvent } from 'react';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2, Package as PackageIcon, Minus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function Packages() {
  const packages = useLiveQuery(() => db.packages.toArray());
  const assets = useLiveQuery(() => db.assets.toArray());

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<{asset_id: string, qty: number}[]>([]);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);

  function handleAddItem(assetId: string) {
    if (!selectedItems.find(i => i.asset_id === assetId)) {
      setSelectedItems([...selectedItems, { asset_id: assetId, qty: 1 }]);
    }
  }

  function handleUpdateQty(assetId: string, delta: number) {
    setSelectedItems(items => items.map(i => {
      if (i.asset_id === assetId) {
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    }));
  }

  function handleRemoveItem(assetId: string) {
    setSelectedItems(items => items.filter(i => i.asset_id !== assetId));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || selectedItems.length === 0) return;

    await db.packages.add({
      id: uuidv4(),
      name,
      items: selectedItems
    });

    setName('');
    setSelectedItems([]);
    setIsAdding(false);
  }

  async function confirmDelete() {
    if (packageToDelete) {
      await db.packages.delete(packageToDelete);
      setPackageToDelete(null);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24 md:pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Packages</h1>
          <p className="text-stone-500 mt-1">Manage rental item bundles.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Create Package</span>
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Package Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Wedding Kit Basic"
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-stone-800">Package Items</h3>
            {selectedItems.map(item => {
              const asset = assets?.find(a => a.id === item.asset_id);
              if (!asset) return null;
              return (
                <div key={item.asset_id} className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="font-medium text-stone-800">{asset.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                      <button type="button" onClick={() => handleUpdateQty(item.asset_id, -1)} className="p-1.5 hover:bg-stone-100"><Minus className="w-4 h-4"/></button>
                      <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                      <button type="button" onClick={() => handleUpdateQty(item.asset_id, 1)} className="p-1.5 hover:bg-stone-100"><Plus className="w-4 h-4"/></button>
                    </div>
                    <button type="button" onClick={() => handleRemoveItem(item.asset_id)} className="text-stone-400 hover:text-red-500 p-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
            
            <div className="mt-2">
              <select 
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                onChange={e => {
                  if (e.target.value) {
                    handleAddItem(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>+ Add Asset to Package...</option>
                {assets?.filter(a => !selectedItems.find(i => i.asset_id === a.id)).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors">Cancel</button>
            <button type="submit" disabled={!name || selectedItems.length === 0} className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Save Package</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages?.length === 0 && !isAdding ? (
          <div className="col-span-full py-12 text-center text-stone-500 bg-white border border-stone-200 rounded-2xl border-dashed">
            No packages created yet.
          </div>
        ) : packages?.map(pkg => (
          <div key={pkg.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <PackageIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900">{pkg.name}</h3>
              </div>
              <button onClick={() => setPackageToDelete(pkg.id)} className="text-stone-400 hover:text-red-500 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1">
              <ul className="space-y-2">
                {pkg.items.map(item => {
                  const asset = assets?.find(a => a.id === item.asset_id);
                  return (
                    <li key={item.asset_id} className="text-sm flex justify-between text-stone-600">
                      <span className="truncate pr-2">{asset?.name || 'Unknown Asset'}</span>
                      <span className="font-medium text-stone-900 shrink-0">x{item.qty}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {packageToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-2 text-red-600">Delete Package</h3>
            <p className="text-stone-600 mb-6">Are you sure you want to delete this package? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setPackageToDelete(null)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
