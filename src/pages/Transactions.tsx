import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useState } from 'react';
import { Plus, Search, CalendarClock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export function Transactions() {
  const transactions = useLiveQuery(async () => {
    const data = await db.transactions.toArray();
    return data.sort((a, b) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.start_date).getTime();
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.start_date).getTime();
      return dateB - dateA;
    });
  });
  const [search, setSearch] = useState('');

  const filtered = transactions?.filter(t => 
    t.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24 md:pb-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Rentals</h1>
          <p className="text-stone-500 mt-1">Manage active and past bookings.</p>
        </div>
        <Link
          to="/transactions/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>New Rental</span>
        </Link>
      </header>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-stone-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
        </div>

        <ul className="divide-y divide-stone-100">
          {filtered?.length === 0 ? (
            <li className="px-6 py-12 text-center text-stone-500">
              No rentals found.
            </li>
          ) : filtered?.map(t => (
            <li key={t.id}>
              <Link to={`/transactions/${t.id}`} className="flex items-center justify-between p-4 sm:p-6 hover:bg-stone-50 transition-colors">
                <div className="flex items-start sm:items-center gap-4">
                  <div className={`p-3 rounded-full shrink-0 ${
                    t.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                    t.status === 'active' ? 'bg-blue-100 text-blue-600' :
                    t.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <CalendarClock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 text-lg">{t.customer_name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-sm text-stone-500">
                      <span>{format(t.start_date, 'MMM d, yyyy HH:mm')} - {format(t.end_date, 'MMM d, yyyy HH:mm')}</span>
                      <span className="hidden sm:inline text-stone-300">•</span>
                      <span>{t.items.reduce((acc, item) => acc + item.qty, 0)} items</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    t.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    t.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {t.status}
                  </span>
                  <div className="flex items-center text-stone-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
