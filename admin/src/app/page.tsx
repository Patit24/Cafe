import React from 'react';
import Link from 'next/link';
import { 
  Users, UserCheck, Coffee, UserX, 
  Wallet, CalendarDays, Clock,
  MoreVertical, ChevronRight,
  Timer, Clock3, CalendarX2, ArrowDownCircle, CalendarCheck
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-8 pb-12">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Overview <span className="text-xl">👋</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live Kitchen Staff Attendance • Real-time insights and performance
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <CalendarDays size={16} className="text-gray-400" />
            31 Jul 2026
            <ChevronRight size={16} className="text-gray-400 rotate-90 ml-2" />
          </button>
          <Link href="/payroll" className="bg-gradient-to-r from-teal-400 to-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 flex items-center gap-2">
            <Wallet size={16} />
            Generate Payroll
          </Link>
        </div>
      </header>

      {/* Top Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Employees */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Employees</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">124</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">+4 this month</p>
            {/* Mock Sparkline */}
            <svg className="w-16 h-6" viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 20L18 12L32 16L48 4L62 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Present Today</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">98</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">78.9% of total</p>
            <svg className="w-16 h-6" viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 18L16 10L30 14L46 6L62 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500"></div>
        </div>

        {/* On Break */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
              <Coffee size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">On Break</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">12</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">9.7% of total</p>
            <svg className="w-16 h-6" viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 12L14 16L28 8L42 18L62 4" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500"></div>
        </div>

        {/* Absent */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <UserX size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Absent</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">26</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">20.9% of total</p>
            <svg className="w-16 h-6" viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8L16 16L30 10L46 20L62 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500"></div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/payroll" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Payroll</h3>
              <p className="text-xs text-gray-500 mt-0.5">Generate and view payroll reports</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
            <ChevronRight size={18} />
          </div>
        </Link>
        <Link href="/leaves" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <CalendarDays size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Leave Applications</h3>
              <p className="text-xs text-gray-500 mt-0.5">Review and approve employee leave requests</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
            <ChevronRight size={18} />
          </div>
        </Link>
        <Link href="/attendance" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Attendance Log</h3>
              <p className="text-xs text-gray-500 mt-0.5">View detailed start and end timings for employees</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
            <ChevronRight size={18} />
          </div>
        </Link>
      </section>

      {/* Active Staff Table */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Active Staff (Kitchen)</h2>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live
            </span>
          </div>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Work Time</th>
                <th className="px-6 py-4">Break</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Row 1 */}
              <tr className="hover:bg-gray-50 transition-colors bg-white">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                       <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Rahul Das" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                        Rahul Das <span className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-white text-[8px]">✓</span>
                      </h4>
                      <p className="text-xs text-gray-500">EMP-0012</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-xs font-semibold rounded-md border border-purple-100 inline-block mb-1">
                    Kitchen Staff (12H)
                  </span>
                  <p className="text-xs text-gray-500">08:00 AM - 08:00 PM</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">08:03 AM</p>
                  <p className="text-xs text-gray-500">31 Jul 2026</p>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-100 w-max">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Working
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">06:42:15</p>
                  <p className="text-xs text-gray-500">hrs</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">01:10:00</p>
                  <p className="text-xs text-gray-500">hrs</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded-md hover:bg-gray-100">
                      View Details
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-gray-50 transition-colors bg-white">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                       <img src="https://i.pravatar.cc/150?u=a042581f4e29026703d" alt="Amit Kumar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                        Amit Kumar <span className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center text-white text-[8px]">★</span>
                      </h4>
                      <p className="text-xs text-gray-500">EMP-0014</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-xs font-semibold rounded-md border border-purple-100 inline-block mb-1">
                    Kitchen Staff (12H)
                  </span>
                  <p className="text-xs text-gray-500">08:00 AM - 08:00 PM</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">08:15 AM</p>
                  <p className="text-xs text-gray-500">31 Jul 2026</p>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full border border-orange-100 w-max">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    On Break
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">04:25:30</p>
                  <p className="text-xs text-gray-500">hrs</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">00:45:20</p>
                  <p className="text-xs text-gray-500">hrs</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded-md hover:bg-gray-100">
                      View Details
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Minor Stats */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Stat 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
            <Timer size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Work Hours</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">386h 45m</h4>
            <p className="text-xs text-gray-400 mt-1">Today</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <Clock3 size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Overtime Hours</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">24h 30m</h4>
            <p className="text-xs text-gray-400 mt-1">Today</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
            <CalendarX2 size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Late Arrivals</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">8</h4>
            <p className="text-xs text-gray-400 mt-1">Today</p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
            <ArrowDownCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Early Departures</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">3</h4>
            <p className="text-xs text-gray-400 mt-1">Today</p>
          </div>
        </div>

        {/* Stat 5 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 shrink-0">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Completed Shifts</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">85</h4>
            <p className="text-xs text-gray-400 mt-1">Today</p>
          </div>
        </div>
      </section>

    </div>
  );
}
