import { Search, Bell, Calendar, Menu } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-[80px] bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6 flex-1">
        <button className="text-gray-500 hover:text-gray-800 transition-colors hidden md:block">
          <Menu size={24} />
        </button>
        
        <div className="relative max-w-lg w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search employees, ID, reports..." 
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative text-gray-500 hover:text-gray-800 transition-colors">
          <Bell size={22} />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
            3
          </span>
        </button>
        <button className="text-gray-500 hover:text-gray-800 transition-colors">
          <Calendar size={22} />
        </button>
      </div>
    </header>
  );
}
