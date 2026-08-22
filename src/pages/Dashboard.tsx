import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format, isToday } from 'date-fns';
import { CalendarClock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const transactions = useLiveQuery(async () => {
    const data = await db.transactions.toArray();
    return data.sort((a, b) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.start_date).getTime();
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.start_date).getTime();
      return dateB - dateA;
    });
  });
  
  const mutations = useLiveQuery(async () => {
    const data = await db.mutations.toArray();
    return data.sort((a, b) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.timestamp).getTime();
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.timestamp).getTime();
      return dateB - dateA;
    }).slice(0, 3);
  });

  const activeRentals = transactions?.filter(t => t.status === 'active') || [];
  const todaysPickups = transactions?.filter(t => t.status === 'booked' && isToday(t.start_date)) || [];
  const todaysReturns = transactions?.filter(t => t.status === 'active' && isToday(t.end_date)) || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24 md:pb-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Dashboard</h1>
        <p className="text-stone-500 mt-1">Overview of your rental operations today.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Link to="/transactions" className="bg-white hover:bg-stone-50 p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col transition-colors">
          <span className="text-stone-500 text-sm font-medium">Active Rentals</span>
          <span className="text-3xl font-bold mt-2 text-blue-600">{activeRentals.length}</span>
        </Link>
        <Link to="/transactions" className="bg-white hover:bg-stone-50 p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col transition-colors">
          <span className="text-stone-500 text-sm font-medium">Today's Pickups</span>
          <span className="text-3xl font-bold mt-2 text-amber-600">{todaysPickups.length}</span>
        </Link>
        <Link to="/transactions" className="bg-white hover:bg-stone-50 p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col transition-colors">
          <span className="text-stone-500 text-sm font-medium">Today's Returns</span>
          <span className="text-3xl font-bold mt-2 text-emerald-600">{todaysReturns.length}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-stone-900">Recent Transactions</h2>
              <Link to="/transactions" className="text-sm font-medium text-orange-600 hover:text-orange-700">View All</Link>
            </div>
            <ul className="divide-y divide-stone-100">
              {transactions?.slice(0, 3).map(t => (
                <li key={t.id} className="p-4 sm:px-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-stone-900">{t.customer_name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{format(t.start_date, 'MMM d')} - {format(t.end_date, 'MMM d')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </li>
              ))}
              {!transactions?.length && (
                <li className="p-6 text-center text-stone-500 text-sm">No recent rentals.</li>
              )}
            </ul>
         </div>

         <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-stone-900">Recent Cash Flow</h2>
              <Link to="/mutations" className="text-sm font-medium text-orange-600 hover:text-orange-700">View All</Link>
            </div>
            <ul className="divide-y divide-stone-100">
              {mutations?.map(m => (
                <li key={m.id} className="p-4 sm:px-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${m.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                         {m.amount > 0 ? <ArrowDownRight className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4" />}
                       </div>
                       <div>
                         <p className="font-semibold text-stone-900">{m.description || m.type}</p>
                         <p className="text-xs text-stone-500 mt-0.5 uppercase">{m.location}</p>
                       </div>
                    </div>
                    <span className={`font-mono font-bold ${m.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.amount > 0 ? '+' : ''}{m.amount.toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
              {!mutations?.length && (
                <li className="p-6 text-center text-stone-500 text-sm">No recent transactions.</li>
              )}
            </ul>
         </div>
      </div>
    </div>
  );
}
