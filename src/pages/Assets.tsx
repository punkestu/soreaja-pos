import type { FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useState } from 'react';
import { Plus, Camera, Wrench, Trash2, Edit2, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Asset } from '../db';
import { CurrencyInput } from '../components/CurrencyInput';

export function Assets() {
  const assets = useLiveQuery(() => db.assets.toArray());
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'camera' | 'tool'>('camera');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    
    await db.assets.add({
      id: uuidv4(),
      name,
      type,
      qty_total: qty,
      qty_bad: 0,
      qty_rented: 0,
      price
    });
    
    setName('');
    setQty(1);
    setPrice(0);
    setIsAdding(false);
  }

  async function handleUpdateAsset(e: FormEvent) {
    e.preventDefault();
    if (!editingAsset) return;
    await db.assets.update(editingAsset.id, {
      qty_total: editingAsset.qty_total,
      qty_bad: editingAsset.qty_bad,
      price: editingAsset.price
    });
    setEditingAsset(null);
  }

  async function confirmDelete() {
    if (assetToDelete) {
      await db.assets.delete(assetToDelete);
      setAssetToDelete(null);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24 md:pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Inventory</h1>
          <p className="text-stone-500 mt-1">Manage cameras and tools.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Asset</span>
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">Asset Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Canon EOS 700D"
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as 'camera' | 'tool')}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="camera">Camera</option>
              <option value="tool">Tool / Acc</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">Qty</label>
            <input 
              type="number"
              min="0"
              required
              value={qty}
              onChange={e => setQty(parseInt(e.target.value) || 0)}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-stone-700 mb-1">Price (Rp)</label>
            <CurrencyInput 
              value={price}
              onChange={setPrice}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <button type="submit" className="w-full h-[46px] bg-stone-900 hover:bg-stone-800 text-white px-4 rounded-xl font-medium transition-colors">
              Save
            </button>
          </div>
        </form>
      )}

      {editingAsset && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit {editingAsset.name}</h3>
              <button onClick={() => setEditingAsset(null)} className="p-2 hover:bg-stone-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleUpdateAsset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Total Qty</label>
                <input 
                  type="number" 
                  required min="1"
                  value={editingAsset.qty_total}
                  onChange={e => setEditingAsset({...editingAsset, qty_total: parseInt(e.target.value) || 1})}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Bad / Maintenance Qty</label>
                <input 
                  type="number" 
                  required min="0"
                  value={editingAsset.qty_bad}
                  onChange={e => setEditingAsset({...editingAsset, qty_bad: parseInt(e.target.value) || 0})}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Price (Rp)</label>
                <CurrencyInput 
                  value={editingAsset.price || 0}
                  onChange={val => setEditingAsset({...editingAsset, price: val})}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-sm">
                <th className="px-6 py-4 font-medium w-42">Asset</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-center">Total</th>
                <th className="px-6 py-4 font-medium text-center">Available</th>
                <th className="px-6 py-4 font-medium text-center">Rented</th>
                <th className="px-6 py-4 font-medium text-center">Bad/Maint</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {assets?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    No assets found. Add one above.
                  </td>
                </tr>
              ) : assets?.map(asset => {
                const available = asset.qty_total - asset.qty_rented - asset.qty_bad;
                return (
                  <tr key={asset.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${asset.type === 'camera' ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-600'}`}>
                          {asset.type === 'camera' ? <Camera className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                        </div>
                        <span className="font-medium text-stone-900">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-stone-600">Rp {(asset.price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-medium text-stone-900">{asset.qty_total}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${available > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {available}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-stone-600">{asset.qty_rented}</td>
                    <td className="px-6 py-4 text-center text-stone-600">{asset.qty_bad}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => setEditingAsset(asset)}
                          className="text-stone-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setAssetToDelete(asset.id)}
                          className="text-stone-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {assetToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-2 text-red-600">Delete Asset</h3>
            <p className="text-stone-600 mb-6">Are you sure you want to delete this asset? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setAssetToDelete(null)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
