import { Search, Bell, Calendar, Menu } from 'lucide-react';

interface TopbarProps {
  onOpenSidebar?: () => void;
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  return (
    <header className="h-16 sm:h-[80px] bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3.5 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-all">
      <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
        <button 
          onClick={onOpenSidebar}
          className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors lg:hidden shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>
        
        <div className="relative max-w-[190px] sm:max-w-xs md:max-w-lg w-full">
          <Search size={16} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search employees, ID..." 
            className="w-full pl-9 sm:pl-11 pr-3 py-2 sm:py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/60 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
          <Bell size={20} className="sm:w-[22px] sm:h-[22px]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-slate-900 flex items-center justify-center text-[9px] font-extrabold text-white shadow-xs">
            3
          </span>
        </button>
        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
          <Calendar size={20} className="sm:w-[22px] sm:h-[22px]" />
        </button>
      </div>
    </header>
  );
}


