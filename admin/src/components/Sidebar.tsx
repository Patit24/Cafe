import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Wallet, 
  CalendarDays, 
  CalendarClock, 
  BarChart3, 
  Settings,
  ChefHat,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <aside className={`w-[260px] bg-[#1a1f2c] text-white flex flex-col h-screen fixed left-0 top-0 z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'
    }`}>
      {/* Logo Area */}
      <div className="p-6 pb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-white rounded-lg flex items-center justify-center shrink-0 shadow-xs">
            <ChefHat size={24} className="text-[#2D9CDB]" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight text-white tracking-tight">Evening Light</h1>
            <p className="text-[#2D9CDB] text-xs font-medium tracking-wide">Workforce Manager</p>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose} 
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5">
        <Link 
          href="/" 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2D9CDB]/15 text-[#2D9CDB] font-semibold shadow-xs transition-colors"
        >
          <LayoutDashboard size={20} />
          Overview
        </Link>
        <Link 
          href="/" 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link 
          href="/employees" 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
        >
          <Users size={20} />
          Employees
        </Link>
        <Link 
          href="/attendance" 
          onClick={onClose}
          className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock size={20} />
            Attendance
          </div>
          <span className="text-xs text-gray-500">▼</span>
        </Link>
        <Link 
          href="/payroll" 
          onClick={onClose}
          className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wallet size={20} />
            Payroll
          </div>
          <span className="text-xs text-gray-500">▼</span>
        </Link>
        <Link 
          href="/leaves" 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
        >
          <CalendarDays size={20} />
          Leave
        </Link>
        <Link 
          href="/shifts" 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
        >
          <CalendarClock size={20} />
          Shifts
        </Link>
        <Link 
          href="/reports" 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
        >
          <BarChart3 size={20} />
          Reports
        </Link>
        <Link 
          href="/settings" 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
        >
          <Settings size={20} />
          Settings
        </Link>
      </nav>

      {/* Promotional Card */}
      <div className="px-5 mb-6 mt-6">
        <div className="bg-gradient-to-br from-[#2D9CDB]/20 via-[#1e293b] to-[#0f172a] p-5 rounded-2xl border border-white/10 relative overflow-hidden shadow-lg">
          <div className="absolute top-2 right-2 w-16 h-16 bg-[#2D9CDB]/20 rounded-full blur-xl"></div>
          <div className="bg-[#1a1f2c]/80 backdrop-blur-xs w-full h-14 rounded-xl border border-white/10 mb-3 flex items-center p-3 shadow-inner">
            <div className="w-full space-y-2">
              <div className="h-2 w-1/2 bg-[#2D9CDB]/60 rounded-full animate-pulse"></div>
              <div className="h-2 w-3/4 bg-white/20 rounded-full"></div>
            </div>
          </div>
          <h4 className="text-white font-bold text-sm mb-1 relative z-10">Track. Manage. Grow.</h4>
          <p className="text-gray-400 text-[11px] leading-relaxed relative z-10">Smart workforce management for modern enterprise kitchens.</p>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3.5 border-t border-white/10 mx-4 mb-4 rounded-xl hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-white/20 shadow-xs">
             <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600"></div>
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate">Admin User</h4>
            <p className="text-xs text-emerald-400 font-medium truncate">● Super Admin</p>
          </div>
        </div>
        <span className="text-gray-400 text-xs">❯</span>
      </div>
    </aside>
  );
}

