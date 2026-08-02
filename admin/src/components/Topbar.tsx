'use client';

import { Search, Bell, Menu, ChefHat } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopbarProps {
  onOpenSidebar?: () => void;
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    );
  }, []);

  return (
    <header className="h-14 sm:h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      
      {/* Left side */}
      <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors lg:hidden shrink-0 border border-slate-700/60"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Brand Name when sidebar is hidden */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 border border-[#2D9CDB]/60 rounded-lg flex items-center justify-center bg-[#2D9CDB]/10 shrink-0">
            <ChefHat size={16} className="text-[#2D9CDB]" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">Evening Light</span>
        </div>

        {/* Desktop Search */}
        <div className="relative w-full max-w-xs md:max-w-md hidden sm:flex">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-700/80 bg-slate-800/60 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-xs text-slate-100 placeholder:text-slate-500 font-medium"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {dateStr && (
          <span className="text-xs font-semibold text-slate-300 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
            📅 {dateStr}
          </span>
        )}
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900"></span>
        </button>
      </div>
    </header>
  );
}
