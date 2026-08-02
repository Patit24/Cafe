'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const navLinks = [
  { href: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/employees',  icon: Users,           label: 'Employees' },
  { href: '/attendance', icon: Clock,           label: 'Attendance' },
  { href: '/payroll',    icon: Wallet,          label: 'Payroll' },
  { href: '/leaves',     icon: CalendarDays,    label: 'Leave' },
  { href: '/shifts',     icon: CalendarClock,   label: 'Shifts' },
  { href: '/reports',    icon: BarChart3,        label: 'Reports' },
  { href: '/settings',   icon: Settings,        label: 'Settings' },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`w-[260px] bg-[#1a1f2c] text-white flex flex-col h-screen fixed left-0 top-0 z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'
    }`}>
      
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#2D9CDB]/60 rounded-xl flex items-center justify-center shrink-0 bg-[#2D9CDB]/10">
            <ChefHat size={22} className="text-[#2D9CDB]" />
          </div>
          <div>
            <h1 className="font-bold text-[17px] leading-tight text-white tracking-tight">Evening Light</h1>
            <p className="text-[#2D9CDB] text-[11px] font-semibold tracking-wide">Workforce Manager</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navLinks.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all text-[14px] group ${
                active
                  ? 'bg-[#2D9CDB]/15 text-[#2D9CDB] font-semibold shadow-sm border border-[#2D9CDB]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-colors ${active ? 'text-[#2D9CDB]' : 'text-slate-500 group-hover:text-slate-300'}`}
              />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2D9CDB] animate-pulse"></span>}
            </Link>
          );
        })}
      </nav>

      {/* Promo Card */}
      <div className="px-4 mt-2 mb-4">
        <div className="bg-gradient-to-br from-[#2D9CDB]/20 via-[#1e293b] to-[#0f172a] p-4 rounded-2xl border border-white/8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#2D9CDB]/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="bg-[#1a1f2c]/80 w-full h-12 rounded-xl border border-white/8 mb-3 flex items-center px-3">
            <div className="w-full space-y-1.5">
              <div className="h-1.5 w-1/2 bg-[#2D9CDB]/60 rounded-full animate-pulse"></div>
              <div className="h-1.5 w-3/4 bg-white/15 rounded-full"></div>
            </div>
          </div>
          <h4 className="text-white font-bold text-xs mb-1 relative z-10">Track. Manage. Grow.</h4>
          <p className="text-slate-400 text-[10px] leading-relaxed relative z-10">Smart workforce management for modern kitchens.</p>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 pb-5 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/15 shadow-sm">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600"></div>
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="text-[13px] font-bold text-white truncate">Admin User</h4>
            <p className="text-[11px] text-emerald-400 font-medium truncate">● Super Admin</p>
          </div>
          <span className="text-slate-500 text-xs">❯</span>
        </div>
      </div>
    </aside>
  );
}
