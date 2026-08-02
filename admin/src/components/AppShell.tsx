'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 w-full overflow-x-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area - Left padding matches sidebar width on desktop, 0 on mobile */}
      <div className="flex-1 w-full lg:pl-[260px] flex flex-col min-h-screen min-w-0 transition-all duration-300">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

