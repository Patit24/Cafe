'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserCheck, Coffee, UserX, 
  Wallet, CalendarDays, Clock,
  ChevronRight, Timer, Clock3, CalendarX2, CalendarCheck,
  RefreshCw, Camera, Sparkles, Activity
} from 'lucide-react';
import { API_BASE_URL, fastFetch } from '@/lib/api';

export default function Dashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(false), 15000); // Silent auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        fastFetch(`${API_BASE_URL}/employees`),
        fastFetch(`${API_BASE_URL}/attendance`)
      ]);

      const empData = await empRes.json();
      const attData = await attRes.json();

      setEmployees(Array.isArray(empData) ? empData : []);
      setAttendances(Array.isArray(attData) ? attData : []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Calculations
  const totalEmployees = employees.length;
  
  // Filter today's attendance records
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter((att) => {
    if (!att.date) return false;
    const attDate = new Date(att.date).toISOString().split('T')[0];
    return attDate === todayStr;
  });

  const workingToday = todayAttendances.filter((a) => a.status === 'working');
  const onBreakToday = todayAttendances.filter((a) => a.status === 'on_break');
  const completedToday = todayAttendances.filter((a) => a.status === 'completed');

  const uniquePresentIds = new Set(
    todayAttendances
      .filter((a) => a.status === 'working' || a.status === 'on_break' || a.status === 'completed')
      .map((a) => a.employee?.id || a.employee?._id || a.employeeId || a.employee?.employeeCode || JSON.stringify(a.employee) || a.id)
  );
  const presentCount = Math.min(totalEmployees > 0 ? totalEmployees : uniquePresentIds.size, uniquePresentIds.size);
  const onBreakCount = Math.min(presentCount, onBreakToday.length);
  const absentCount = Math.max(0, totalEmployees - presentCount);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWorkDuration = (checkInStr: string | null, checkOutStr?: string | null) => {
    if (!checkInStr) return '--';
    const start = new Date(checkInStr).getTime();
    const end = checkOutStr ? new Date(checkOutStr).getTime() : new Date().getTime();
    const diffMs = Math.max(0, end - start);
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 pb-14 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 sm:mb-8 gap-4 pb-4 border-b border-slate-800/70">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Executive Overview <span className="text-xl sm:text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap font-medium">
            <span>Live Kitchen Staff Attendance</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Real-time AI verification active
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto">
          <a
            href="https://evening-light-attendance.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
          >
            📱 Launch Face Verification App ↗
          </a>
          <button 
            onClick={() => fetchDashboardData(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 shadow-sm hover:bg-slate-700 transition-all flex-1 sm:flex-initial shrink-0 whitespace-nowrap"
          >
            <RefreshCw size={15} className={`text-slate-400 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh{mounted ? ` (${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
          </button>
          <Link 
            href="/employees/new" 
            className="bg-purple-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:bg-purple-500 transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shrink-0 whitespace-nowrap"
          >
            <Users size={16} />
            <span>+ Add Employee</span>
          </Link>
          <Link 
            href="/payroll" 
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shrink-0 whitespace-nowrap"
          >
            <Wallet size={16} />
            <span>Payroll</span>
          </Link>
        </div>
      </header>

      {/* Top Stats Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {/* Total Employees */}
        <Link href="/employees" className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-lg relative overflow-hidden group hover:border-slate-600 hover:shadow-xl transition-all flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 hidden sm:block group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Total Employees</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{totalEmployees}</h3>
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Registered staff profiles</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        </Link>

        {/* Present Today */}
        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-extrabold rounded-full hidden sm:inline-block">
              {totalEmployees > 0 ? Math.min(100, Math.round((presentCount / totalEmployees) * 100)) : 0}% Active
            </span>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Present Today</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{presentCount}</h3>
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Working & checked out</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        </div>

        {/* On Break */}
        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">On Break</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{onBreakCount}</h3>
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Currently on shift break</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
        </div>

        {/* Absent */}
        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <UserX className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Absent Today</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">{absentCount}</h3>
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Not checked in yet</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-600"></div>
        </div>
      </section>

      {/* Quick Access Shortcuts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Link href="/employees" className="bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-slate-700/60 shadow-md flex items-center justify-between group hover:bg-slate-800 hover:border-slate-600 transition-all">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
              <Users size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">Manage Employees</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">Add staff & 4-angle face auth</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0">
            <ChevronRight size={18} />
          </div>
        </Link>
        <Link href="/attendance" className="bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-slate-700/60 shadow-md flex items-center justify-between group hover:bg-slate-800 hover:border-slate-600 transition-all">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Clock size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">Attendance Log</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">Audit face scores, GPS & shifts</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0">
            <ChevronRight size={18} />
          </div>
        </Link>
        <Link href="/payroll" className="bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-slate-700/60 shadow-md flex items-center justify-between group hover:bg-slate-800 hover:border-slate-600 transition-all">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
              <Wallet size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">Payroll Calculation</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">Auto deductions & overtime payouts</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0">
            <ChevronRight size={18} />
          </div>
        </Link>
      </section>

      {/* Live Active Staff Table & Mobile Cards */}
      <section className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/70 shadow-xl overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-slate-700/70 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-800/50">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Active Staff (Kitchen)</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-extrabold rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live ({todayAttendances.length})
            </span>
          </div>
          <Link href="/attendance" className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-3.5 py-2 rounded-xl border border-blue-500/20 transition-all w-fit">
            <span>View Full Log</span> <ChevronRight size={16} />
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-700/70">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Face Verification</th>
                <th className="px-6 py-4">Liveness</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Work Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {todayAttendances.length === 0 ? (
                <tr className="bg-slate-800/40">
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-base font-semibold text-slate-200">No active staff checked in today yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Staff can check in on their mobile phone using face verification.</p>
                  </td>
                </tr>
              ) : (
                todayAttendances.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0 border border-white/10">
                          {(rec.employee?.name || 'Staff').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{rec.employee?.name || 'Kitchen Staff'}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{rec.employee?.employeeCode || 'EMP-001'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200 font-mono">
                      {formatTime(rec.checkInTime)}
                    </td>
                    <td className="px-6 py-4">
                      {rec.faceMatchScore ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Camera size={13} className="text-emerald-400" />
                          {Number(rec.faceMatchScore).toFixed(1)}% Match
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {rec.livenessPassed === true ? (
                        <span className="text-emerald-400 font-bold text-xs inline-flex items-center gap-1">
                          ✓ Passed
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-extrabold rounded-full tracking-wide uppercase ${
                        rec.status === 'working' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        rec.status === 'on_break' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {(rec.status || 'working').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400 font-mono text-base">
                      {getWorkDuration(rec.checkInTime, rec.checkOutTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (For small screens & phones) */}
        <div className="md:hidden divide-y divide-slate-700/60">
          {todayAttendances.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-200">No active staff checked in today yet.</p>
              <p className="text-xs text-slate-500 mt-1">Staff can check in instantly on their mobile phone.</p>
            </div>
          ) : (
            todayAttendances.map((rec) => (
              <div key={rec.id} className="p-4 bg-slate-800/30 hover:bg-slate-800/60 transition-all space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0 border border-white/10">
                      {(rec.employee?.name || 'Staff').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-bold text-white text-sm truncate">{rec.employee?.name || 'Kitchen Staff'}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{rec.employee?.employeeCode || 'EMP-001'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full shrink-0 uppercase tracking-wide ${
                    rec.status === 'working' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    rec.status === 'on_break' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {(rec.status || 'working').replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Check-In</span>
                    <span className="text-slate-200 font-bold font-mono text-sm mt-0.5 block">{formatTime(rec.checkInTime)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Duration</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm mt-0.5 block">{getWorkDuration(rec.checkInTime, rec.checkOutTime)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
                    <Camera size={13} className="text-emerald-400 shrink-0" />
                    <span>Match: <strong className="text-white font-mono">{rec.faceMatchScore ? `${Number(rec.faceMatchScore).toFixed(1)}%` : '—'}</strong></span>
                  </div>
                  <div>
                    {rec.livenessPassed === true ? (
                      <span className="text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1">✓ Liveness Passed</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Bottom Summary Indicators */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/70 shadow-md flex items-center sm:items-start gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">Checked-in</p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">{workingToday.length}</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">Currently working</p>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/70 shadow-md flex items-center sm:items-start gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Clock3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">Completed</p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">{completedToday.length}</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">Checked out today</p>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/70 shadow-md flex items-center sm:items-start gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">Registered</p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">{totalEmployees}</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">Staff in system</p>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/70 shadow-md flex items-center sm:items-start gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">AI Shield</p>
            <h4 className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>Active</span> <span className="text-xs">🛡️</span>
            </h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden sm:block">Anti-spoofing ready</p>
          </div>
        </div>
      </section>
    </div>
  );
}

