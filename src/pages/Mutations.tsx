import { triggerAutoSync } from '../lib/sync';
import type { FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Plus, Wallet, Copy, Undo2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CurrencyInput } from '../components/CurrencyInput';

export function Mutations() {
  const mutations = useLiveQuery(async () => {
    const data = await db.mutations.toArray();
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState(0);
  const [flowDirection, setFlowDirection] = useState<'debit' | 'credit'>('debit');
  const [type, setType] = useState('maintenance');
  const [confirmingCorrection, setConfirmingCorrection] = useState<string | null>(null);
  const [location, setLocation] = useState('cash');
  const [desc, setDesc] = useState('');
  const [source, setSource] = useState('');

  // Calculate balances
  const balances = mutations?.reduce((acc, m) => {
    acc[m.location] = (acc[m.location] || 0) + m.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalBalance = Object.values(balances).reduce((sum, val) => sum + val, 0);

  const uniqueSources = Array.from(new Set(mutations?.map(m => m.source) || []));
  const uniqueLocations = Array.from(new Set(mutations?.map(m => m.location) || []));
  const uniqueTypes = Array.from(new Set(mutations?.map(m => m.type) || []));

  
  async function handleCorrection(m: any) {
    await db.mutations.add({
      id: uuidv4(),
      type: m.type,
      source: m.source,
      location: m.location,
      amount: -m.amount,
      description: `Correction for ${m.id}`,
      timestamp: new Date()
    });
    setConfirmingCorrection(null);
    triggerAutoSync();
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (amount === 0 || !source.trim()) return;

    await db.mutations.add({
      id: uuidv4(),
      type,
      source: source.toLowerCase(),
      location: location.toLowerCase(),
      amount: flowDirection === 'credit' ? Math.abs(amount) : -Math.abs(amount),
      description: desc,
      timestamp: new Date()
    });
    triggerAutoSync();

    setAmount(0);
    setDesc('');
    setIsAdding(false);
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24 md:pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Cash Flow</h1>
          <p className="text-stone-500 mt-1">Manage finances and ledger.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Entry</span>
        </button>
      </header>

      {/* Balances Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-sm col-span-full">
          <p className="text-stone-400 text-sm font-medium mb-1">Total Balance</p>
          <p className="text-2xl font-bold font-mono">Rp {totalBalance.toLocaleString()}</p>
        </div>
        {Object.entries(balances).map(([loc, bal]) => (
          <div key={loc} className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
            <p className="text-stone-500 text-sm font-medium capitalize mb-1">{loc}</p>
            <p className="text-xl font-bold font-mono text-stone-800">Rp {bal.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          <div className="col-span-full">
            <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
            <input type="text" required value={desc} onChange={e => setDesc(e.target.value)} className="w-full border border-stone-300 rounded-xl px-4 py-2.5" placeholder="e.g. Bought SD Card" />
          </div>
          <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Amount (Rp)</label>
              <CurrencyInput required value={amount} onChange={setAmount} className="w-full border border-stone-300 rounded-xl px-4 py-2.5 font-mono" />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-stone-700 mb-1">Flow</label>
              <select value={flowDirection} onChange={e => setFlowDirection(e.target.value as 'credit'|'debit')} className="w-full border border-stone-300 rounded-xl px-4 py-2.5 bg-white">
                <option value="debit">Debit (Out)</option>
                <option value="credit">Credit (In)</option>
              </select>
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">Source</label>
            <input type="text" list="sources-list" required value={source} onChange={e => setSource(e.target.value)} className="w-full border border-stone-300 rounded-xl px-4 py-2.5" placeholder="Customer, Investor, etc." />
            <datalist id="sources-list">
              {uniqueSources.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
            <input type="text" list="types-list" required value={type} onChange={e => setType(e.target.value)} className="w-full border border-stone-300 rounded-xl px-4 py-2.5" placeholder="Maintenance, Rent..." />
            <datalist id="types-list">
              <option value="rent" />
              <option value="buy_tool" />
              <option value="maintenance" />
              <option value="investation" />
              {uniqueTypes.filter(t => !['rent', 'buy_tool', 'maintenance', 'investation'].includes(t)).map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
            <input type="text" list="locations-list" required value={location} onChange={e => setLocation(e.target.value)} className="w-full border border-stone-300 rounded-xl px-4 py-2.5" placeholder="Cash, BCA..." />
            <datalist id="locations-list">
              <option value="cash" />
              <option value="bca" />
              <option value="bri" />
              <option value="mandiri" />
              {uniqueLocations.filter(l => !['cash', 'bca', 'bri', 'mandiri'].includes(l)).map(l => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2 lg:col-span-12 flex justify-end">
            <button type="submit" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition-colors">Save Entry</button>
          </div>
        </form>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-stone-100">
          {mutations?.length === 0 ? (
            <li className="px-6 py-12 text-center text-stone-500">No mutations yet.</li>
          ) : mutations?.map(m => (
            <li key={m.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full shrink-0 ${m.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {m.amount > 0 ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900">{m.description || m.type}</h3>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-stone-200 transition-colors" onClick={() => navigator.clipboard.writeText(m.id)} title="Copy ID">
                      {m.id.substring(0, 8)}... <Copy className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 font-medium flex-wrap">
                    <span className="uppercase px-2 py-0.5 bg-stone-100 rounded-full">{m.location}</span>
                    <span className="capitalize px-2 py-0.5 bg-stone-100 rounded-full">{m.type.replace('_', ' ')}</span>
                    <span className="capitalize px-2 py-0.5 bg-stone-100 rounded-full">{m.source}</span>
                    <span>•</span>
                    <span>{format(m.timestamp, 'MMM d, yyyy HH:mm')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`font-bold font-mono text-lg ${m.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.amount > 0 ? '+' : ''}{m.amount.toLocaleString()}
                </div>
                {confirmingCorrection === m.id ? (
                  <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100">
                    <span className="text-xs font-medium text-red-600 px-2">Correct?</span>
                    <button onClick={() => handleCorrection(m)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors">Yes</button>
                    <button onClick={() => setConfirmingCorrection(null)} className="px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingCorrection(m.id)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors" title="Correct this mutation">
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
