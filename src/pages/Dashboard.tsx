import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getJakartaLocal, formatTz } from '../lib/tz';
import { format, isToday, startOfMonth, subDays, subMonths, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export function Dashboard() {
  const [timeWindow, setTimeWindow] = useState('this_month');

  const transactions = useLiveQuery(async () => {
    const data = await db.transactions.toArray();
    return data.sort((a, b) => {
      const dateA = a.last_updated ? getJakartaLocal(a.last_updated).getTime() : getJakartaLocal(a.start_date).getTime();
      const dateB = b.last_updated ? getJakartaLocal(b.last_updated).getTime() : getJakartaLocal(b.start_date).getTime();
      return dateB - dateA;
    });
  });
  
  const allMutations = useLiveQuery(() => db.mutations.toArray());
  const assets = useLiveQuery(() => db.assets.toArray());

  const mutations = allMutations?.sort((a, b) => getJakartaLocal(b.timestamp).getTime() - getJakartaLocal(a.timestamp).getTime()).slice(0, 3) || [];
  
  const activeRentals = transactions?.filter(t => t.status === 'active') || [];
  const todaysPickups = transactions?.filter(t => t.status === 'booked' && isToday(t.start_date)) || [];
  const todaysReturns = transactions?.filter(t => t.status === 'active' && isToday(t.end_date)) || [];

  // Performance Data Memoization to avoid recalculating every render
  const { periodIncome, periodExpense, cashflowData, topAssets } = useMemo(() => {
    const now = getJakartaLocal(new Date());
    let startDate = startOfMonth(now);
    let grouping: 'day' | 'week' | 'month' = 'day';

    switch (timeWindow) {
      case 'this_week':
        startDate = subDays(now, 7);
        grouping = 'day';
        break;
      case 'this_month':
        startDate = startOfMonth(now);
        grouping = 'day';
        break;
      case '3_month':
        startDate = subMonths(now, 3);
        grouping = 'week';
        break;
      case '6_month':
        startDate = subMonths(now, 6);
        grouping = 'month';
        break;
      case 'this_year':
        startDate = startOfYear(now);
        grouping = 'month';
        break;
    }

    const periodMutations = allMutations?.filter(m => getJakartaLocal(m.timestamp) >= startDate) || [];
    
    const income = periodMutations.filter(m => m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
    const expense = Math.abs(periodMutations.filter(m => m.amount < 0).reduce((sum, m) => sum + m.amount, 0));

    let timeSteps: Date[] = [];
    if (grouping === 'day') timeSteps = eachDayOfInterval({ start: startDate, end: now });
    else if (grouping === 'week') timeSteps = eachWeekOfInterval({ start: startDate, end: now });
    else if (grouping === 'month') timeSteps = eachMonthOfInterval({ start: startDate, end: now });

    const flowData = timeSteps.map(date => {
      const stepMutations = periodMutations.filter(m => {
        const mDate = getJakartaLocal(m.timestamp);
        if (grouping === 'day') return isSameDay(mDate, date);
        if (grouping === 'week') return isSameWeek(mDate, date);
        if (grouping === 'month') return isSameMonth(mDate, date);
        return false;
      });
      const stepIncome = stepMutations.filter(m => m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
      const stepExpense = Math.abs(stepMutations.filter(m => m.amount < 0).reduce((sum, m) => sum + m.amount, 0));
      
      let label = '';
      if (grouping === 'day') label = format(date, 'MMM dd');
      else if (grouping === 'week') label = format(date, 'MMM dd');
      else if (grouping === 'month') label = format(date, 'MMM yyyy');

      return { date: label, income: stepIncome, expense: stepExpense };
    });

    const assetCounts: Record<string, number> = {};
    transactions?.filter(t => getJakartaLocal(t.start_date) >= startDate).forEach(t => {
      t.items.forEach(item => {
        const asset = assets?.find(a => a.id === item.asset_id);
        if (asset?.type === 'camera') {
          assetCounts[item.asset_id] = (assetCounts[item.asset_id] || 0) + item.qty;
        }
      });
    });

    const top = Object.entries(assetCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const asset = assets?.find(a => a.id === id);
        return {
          name: asset?.name || 'Unknown Asset',
          value: count
        };
      });

    return { periodIncome: income, periodExpense: expense, cashflowData: flowData, topAssets: top };
  }, [timeWindow, allMutations, transactions, assets]);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

  const windows = [
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: '3_month', label: '3 Months' },
    { id: '6_month', label: '6 Months' },
    { id: 'this_year', label: 'This Year' },
  ];

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

      {/* Performance Dashboard */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Performance Dashboard
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            {windows.map(w => (
              <button
                key={w.id}
                onClick={() => setTimeWindow(w.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${timeWindow === w.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-4 sm:gap-8">
              <div>
                <p className="text-sm font-medium text-stone-500">Period Inflow</p>
                <p className="text-2xl font-bold font-mono text-emerald-600">Rp {periodIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500">Period Outflow</p>
                <p className="text-2xl font-bold font-mono text-red-600">Rp {periodExpense.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500">Net Flow</p>
                <p className={`text-2xl font-bold font-mono ${(periodIncome - periodExpense) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  Rp {(periodIncome - periodExpense).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f4' }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                  />
                  <Bar dataKey="income" name="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Outflow" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-stone-500 mb-4">Top Cameras (Period)</h3>
            {topAssets.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="h-[180px] w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topAssets}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {topAssets.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} Rentals`, 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full space-y-2">
                  {topAssets.map((asset, i) => (
                    <li key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-stone-700 truncate">{asset.name}</span>
                      </div>
                      <span className="font-semibold text-stone-900 ml-2">{asset.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-stone-500 text-sm text-center py-10">No rentals recorded in this period.</p>
            )}
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-stone-900">Recent Transactions</h2>
              <Link to="/transactions" className="text-sm font-medium text-orange-600 hover:text-orange-700">View All</Link>
            </div>
            <ul className="divide-y divide-stone-100">
              {transactions?.slice(0, 3).map(t => (
                <li key={t.id} className="p-4 sm:px-6 hover:bg-stone-50 transition-colors">
                  <Link to={`/transactions/${t.id}`} className="flex justify-between items-center w-full">
                    <div>
                      <p className="font-semibold text-stone-900">{t.customer_name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{formatTz(t.start_date, 'MMM d')} - {formatTz(t.end_date, 'MMM d')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {t.status}
                    </span>
                  </Link>
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
