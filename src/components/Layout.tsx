import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, RefreshCw, Wallet, Settings, Camera, Layers, ChevronLeft, ChevronRight, HandCoins, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { SyncFAB } from './SyncFAB';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assets', icon: Package, label: 'Inventory' },
  { to: '/packages', icon: Layers, label: 'Packages' },
  { to: '/transactions', icon: RefreshCw, label: 'Rentals' },
  { to: '/mutations', icon: Wallet, label: 'Cash-Flow' },
  { to: '/loans', icon: HandCoins, label: 'Loans' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/docs', icon: BookOpen, label: 'Docs' },
];

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const brandNameSetting = useLiveQuery(() => db.settings.get('brandName'));
  const brandName = brandNameSetting?.value || 'SoreAja';
  
  const brandLogoSetting = useLiveQuery(() => db.settings.get('brandLogo'));
  const brandLogo = brandLogoSetting?.value || '';

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans text-stone-900">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-stone-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-6 flex items-center border-b border-stone-100 h-[88px] ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 shrink-0 rounded-full bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-xl">
            {brandLogo ? <img src={brandLogo} alt="Logo" className="w-full h-full object-cover rounded-full" /> : <Camera className="text-white w-5 h-5" />}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-bold text-lg tracking-tight text-stone-800">{brandName}</h1>
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Rental POS</p>
            </div>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'} ${
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-100 flex justify-center">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
        
        <SyncFAB />
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex justify-around p-2 pb-safe overflow-auto z-40">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg text-xs font-medium w-fit text-nowrap ${
                isActive ? 'text-orange-600' : 'text-stone-500 hover:text-stone-900'
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-1" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
