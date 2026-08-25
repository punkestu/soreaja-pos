import type { FormEvent } from 'react';
import { useState } from 'react';
import { parseTz, getTzDateInput } from '../lib/tz';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CurrencyInput } from '../components/CurrencyInput';

export function NewTransaction() {
  const navigate = useNavigate();
  const assets = useLiveQuery(() => db.assets.toArray());
  const transactions = useLiveQuery(() => db.transactions.toArray());
  const uniqueCustomers = Array.from(new Set(transactions?.map(t => t.customer_name) || []));

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [giveMethod, setGiveMethod] = useState<'self_pickup' | 'antar'>('self_pickup');
  const [takeMethod, setTakeMethod] = useState<'self_pickup' | 'antar'>('self_pickup');
  
  // default dates
  const now = new Date();
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);

  const [startDate, setStartDate] = useState(getTzDateInput(now));
  const [endDate, setEndDate] = useState(getTzDateInput(tmr));
  
  const [selectedItems, setSelectedItems] = useState<{asset_id: string, qty: number}[]>([]);
  const [additionalCost, setAdditionalCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [financialNotes, setFinancialNotes] = useState('');
  
  const packages = useLiveQuery(() => db.packages.toArray());

  const calculatedItemsCost = selectedItems.reduce((acc, item) => {
    const asset = assets?.find(a => a.id === item.asset_id);
    return acc + ((asset?.price || 0) * item.qty);
  }, 0);

  // Duration in days (min 1)
  const start = parseTz(startDate);
  const end = parseTz(endDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const rentDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const totalItemsDurationCost = calculatedItemsCost * rentDays;
  const finalTotal = totalItemsDurationCost + additionalCost - discount;

  function handleAddPackage(packageId: string) {
    const pkg = packages?.find(p => p.id === packageId);
    if (!pkg) return;
    
    const newItems = [...selectedItems];
    for (const pkgItem of pkg.items) {
      const existing = newItems.find(i => i.asset_id === pkgItem.asset_id);
      if (existing) {
        existing.qty += pkgItem.qty;
      } else {
        newItems.push({ ...pkgItem });
      }
    }
    setSelectedItems(newItems);
  }

  function handleAddItem(assetId: string) {
    if (!selectedItems.find(i => i.asset_id === assetId)) {
      setSelectedItems([...selectedItems, { asset_id: assetId, qty: 1 }]);
    }
  }

  function handleUpdateQty(assetId: string, delta: number) {
    setSelectedItems(items => items.map(i => {
      if (i.asset_id === assetId) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  }

  function handleRemoveItem(assetId: string) {
    setSelectedItems(items => items.filter(i => i.asset_id !== assetId));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!customerName || selectedItems.length === 0) return;

    const txId = uuidv4();
    await db.transactions.add({
      id: txId,
      customer_name: customerName,
      customer_phone: customerPhone || undefined,
      customer_address: customerAddress || undefined,
      start_date: parseTz(startDate),
      end_date: parseTz(endDate),
      give_method: giveMethod,
      take_method: takeMethod,
      items: selectedItems,
      status: 'booked',
      financials: {
        extra_fee: additionalCost,
        discount,
        notes: financialNotes || undefined,
        total_cost: finalTotal
      },
      checklists: {
        give: {
          items_given: false,
          payment_fulfilled: false,
          id_card_taken: false,
          tutorial_camera: false,
          tutorial_card: false,
          tutorial_charger: false
        },
        take: {
          id_card_returned: false,
          items_checked: false,
          gdrive_upload_needed: false,
          gdrive_uploaded: false
        }
      }
    });

    navigate(`/transactions/${txId}`);
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 pb-24 md:pb-10">
      <header className="flex items-center gap-4">
        <Link to="/transactions" className="p-2 -ml-2 rounded-full hover:bg-stone-200 transition-colors text-stone-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">New Rental</h1>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg border-b border-stone-100 pb-2">Customer Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <input 
              type="text" 
              required
              list="customer-names"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <datalist id="customer-names">
              {uniqueCustomers.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone (Optional)</label>
              <input 
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Address (Optional)</label>
              <input 
                type="text"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Start Time</label>
              <input 
                type="datetime-local" 
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">End Time (Return)</label>
              <input 
                type="datetime-local" 
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Give Method (Start)</label>
              <select 
                value={giveMethod}
                onChange={e => setGiveMethod(e.target.value as 'self_pickup' | 'antar')}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="self_pickup">Self Pickup</option>
                <option value="antar">Antar (Delivery)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Take Method (Return)</label>
              <select 
                value={takeMethod}
                onChange={e => setTakeMethod(e.target.value as 'self_pickup' | 'antar')}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="self_pickup">Self Drop-off</option>
                <option value="antar">Jemput (Pickup)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-stone-100 pb-2">
            <h2 className="font-semibold text-lg">Equipment</h2>
            
            {packages && packages.length > 0 && (
              <select 
                className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                onChange={e => {
                  if (e.target.value) {
                    handleAddPackage(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>+ Package</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          
          <div className="space-y-3">
            {selectedItems.map(item => {
              const asset = assets?.find(a => a.id === item.asset_id);
              if (!asset) return null;
              return (
                <div key={item.asset_id} className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="font-medium text-stone-800 flex-1">{asset.name}</span>
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
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">Add Item</label>
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
                <option value="" disabled>Select an asset...</option>
                {assets?.filter(a => !selectedItems.find(i => i.asset_id === a.id)).map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.qty_total - a.qty_rented - a.qty_bad} available)</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg border-b border-stone-100 pb-2">Financials</h2>
          
          <div className="flex justify-between text-sm text-stone-600 mb-2">
            <span>Items Subtotal ({rentDays} {rentDays === 1 ? 'day' : 'days'}):</span>
            <span className="font-mono">Rp {totalItemsDurationCost.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Additional Cost (Rp)</label>
              <CurrencyInput 
                value={additionalCost}
                onChange={setAdditionalCost}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Discount (Rp)</label>
              <CurrencyInput 
                value={discount}
                onChange={setDiscount}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Reason (Optional)</label>
            <input 
              type="text"
              value={financialNotes}
              onChange={e => setFinancialNotes(e.target.value)}
              placeholder="Reason for additional cost or discount"
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="pt-4 flex justify-between items-center text-lg">
            <span className="font-medium text-stone-600">Final Total:</span>
            <span className="font-bold text-2xl text-orange-600 font-mono">Rp {finalTotal.toLocaleString()}</span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!customerName || selectedItems.length === 0}
          className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-sm transition-colors"
        >
          Create Rental Booking
        </button>

      </form>
    </div>
  );
}
