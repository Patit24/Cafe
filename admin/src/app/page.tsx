'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserCheck, Coffee, UserX, 
  Wallet, CalendarDays, Clock,
  ChevronRight, Timer, Clock3, CalendarX2, CalendarCheck,
  RefreshCw, Camera, Sparkles, Activity, TrendingUp, Zap
} from 'lucide-react';
import { API_BASE_URL, fastFetch } from '@/lib/api';

export default function Dashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setMounted(true);
    setTodayStr(new Date().toISOString().split('T')[0]);
    setLastRefreshed(new Date());
    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(false), 15000);
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
  const todayAttendances = mounted && todayStr ? attendances.filter((att) => {
    if (!att.date) return false;
    return new Date(att.date).toISOString().split('T')[0] === todayStr;
  }) : [];

  const workingToday = todayAttendances.filter((a) => a.status === 'working');
  const onBreakToday = todayAttendances.filter((a) => a.status === 'on_break');
  const completedToday = todayAttendances.filter((a) => a.status === 'completed');

  const uniquePresentIds = new Set(
    todayAttendances
      .filter((a) => ['working', 'on_break', 'completed'].includes(a.status))
      .map((a) => a.employeeId || a.employee?.id || a.id)
  );
  const presentCount = Math.min(totalEmployees > 0 ? totalEmployees : uniquePresentIds.size, uniquePresentIds.size);
  const onBreakCount = Math.min(presentCount, onBreakToday.length);
  const absentCount = Math.max(0, totalEmployees - presentCount);
  const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWorkDuration = (checkInStr: string | null, checkOutStr?: string | null) => {
    if (!checkInStr) return '--';
    const start = new Date(checkInStr).getTime();
    const end = checkOutStr ? new Date(checkOutStr).getTime() : Date.now();
    const diffMs = Math.max(0, end - start);
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const statCards = [
    {
      label: 'Total Staff',
      value: totalEmployees,
      sub: 'Registered profiles',
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      accent: 'from-emerald-500 to-teal-500',
      href: '/employees',
      badge: null,
    },
    {
      label: 'Present Today',
      value: presentCount,
      sub: 'Working & checked out',
      icon: <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
      iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      accent: 'from-blue-500 to-indigo-500',
      href: '/attendance',
      badge: `${attendanceRate}%`,
    },
    {
      label: 'On Break',
      value: onBreakCount,
      sub: 'Currently on break',
      icon: <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />,
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      accent: 'from-amber-500 to-orange-500',
      href: null,
      badge: null,
    },
    {
      label: 'Absent Today',
      value: absentCount,
      sub: 'Not checked in yet',
      icon: <UserX className="w-5 h-5 sm:w-6 sm:h-6" />,
      iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      accent: 'from-rose-500 to-red-600',
      href: null,
      badge: null,
    },
  ];

  return (
    <div className="p-3 sm:p-5 lg:p-8 pb-16 bg-slate-900 text-slate-100 min-h-screen">

      {/* ── Page Header ── */}
      <header className="mb-5 sm:mb-7">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Overview <span className="text-lg sm:text-2xl">👋</span>
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <span className="text-emerald-400 font-semibold">Live</span>
              <span className="text-slate-600">•</span>
              <span>Kitchen Staff Attendance</span>
            </p>
          </div>

          {/* Refresh button — always visible, top right */}
          <button
            onClick={() => fetchDashboardData(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all shrink-0"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-blue-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">
              {mounted && lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}
            </span>
            <span className="sm:hidden">Sync</span>
          </button>
        </div>

        {/* Action buttons row — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          <a
            href="https://evening-light-attendance.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Camera size={13} />
            Face Verify App ↗
          </a>
          <Link
            href="/employees/new"
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Users size={13} />
            + Add Employee
          </Link>
          <Link
            href="/payroll"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Wallet size={13} />
            Payroll
          </Link>
          <Link
            href="/reports"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border border-slate-600"
          >
            <TrendingUp size={13} />
            Reports
          </Link>
        </div>
      </header>

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-7">
        {statCards.map((card, i) => {
          const CardWrapper = card.href ? Link : 'div';
          return (
            <CardWrapper
              key={i}
              href={card.href as string}
              className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-slate-600 hover:shadow-xl transition-all flex flex-col justify-between shadow-md cursor-pointer"
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner ${card.iconBg}`}>
                  {card.icon}
                </div>
                {card.badge && (
                  <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                )}
              </div>
              {/* Value */}
              <div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 leading-none">{card.value}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 truncate">{card.sub}</p>
              </div>
              {/* Bottom accent bar */}
              <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r ${card.accent}`}></div>
            </CardWrapper>
          );
        })}
      </section>

      {/* ── Quick Access Shortcuts ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-7">
        {[
          { href: '/employees', icon: <Users size={20} />, iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400', title: 'Manage Employees', sub: 'Add staff & 4-angle face auth' },
          { href: '/attendance', icon: <Clock size={20} />, iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400', title: 'Attendance Log', sub: 'Audit scores, GPS & shifts' },
          { href: '/payroll', icon: <Wallet size={20} />, iconBg: 'bg-teal-500/15 border-teal-500/30 text-teal-400', title: 'Payroll Calculation', sub: 'Auto deductions & overtime' },
        ].map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between group hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${item.iconBg}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-[13px] lg:text-sm truncate">{item.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0 ml-2">
              <ChevronRight size={16} />
            </div>
          </Link>
        ))}
      </section>

      {/* ── Live Active Staff ── */}
      <section className="bg-slate-800/80 border border-slate-700/70 rounded-2xl overflow-hidden mb-5 sm:mb-7 shadow-xl">
        {/* Section header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-700/70 flex items-center justify-between gap-3 bg-slate-800/50">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">Active Staff (Kitchen)</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live ({todayAttendances.length})
            </span>
          </div>
          <Link
            href="/attendance"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl border border-blue-500/20 transition-all whitespace-nowrap shrink-0"
          >
            Full Log <ChevronRight size={14} />
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-700/70">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Face Score</th>
                <th className="px-6 py-4">Liveness</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {todayAttendances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🕐</span>
                      <p className="text-sm font-semibold text-slate-300">No staff checked in today yet.</p>
                      <p className="text-xs text-slate-500">Staff check in via face verification on the mobile app.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                todayAttendances.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                          {(rec.employee?.name || 'ST').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-[13px] group-hover:text-indigo-300 transition-colors">{rec.employee?.name || 'Kitchen Staff'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{rec.employee?.employeeCode || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200 font-mono text-sm">
                      {formatTime(rec.checkInTime)}
                    </td>
                    <td className="px-6 py-4">
                      {rec.faceMatchScore ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Camera size={11} />
                          {Number(rec.faceMatchScore).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {rec.livenessPassed === true ? (
                        <span className="text-emerald-400 font-bold text-xs">✓ Passed</span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wide ${
                        rec.status === 'working'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : rec.status === 'on_break'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {(rec.status || 'working').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400 font-mono text-sm">
                      {getWorkDuration(rec.checkInTime, rec.checkOutTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {todayAttendances.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-2xl mb-2">🕐</p>
              <p className="text-sm font-semibold text-slate-300">No staff checked in today yet.</p>
              <p className="text-xs text-slate-500 mt-1">Staff use the face verification mobile app to check in.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {todayAttendances.map((rec) => (
                <div key={rec.id} className="p-3.5 space-y-3">
                  {/* Name + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md shrink-0">
                        {(rec.employee?.name || 'ST').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{rec.employee?.name || 'Kitchen Staff'}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{rec.employee?.employeeCode || '—'}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wide shrink-0 ${
                      rec.status === 'working'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : rec.status === 'on_break'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {(rec.status || 'working').replace('_', ' ')}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900/70 rounded-xl p-2.5 text-center border border-slate-700/50">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Check-in</p>
                      <p className="text-slate-100 font-bold font-mono text-xs mt-0.5">{formatTime(rec.checkInTime)}</p>
                    </div>
                    <div className="bg-slate-900/70 rounded-xl p-2.5 text-center border border-slate-700/50">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Duration</p>
                      <p className="text-emerald-400 font-bold font-mono text-xs mt-0.5">{getWorkDuration(rec.checkInTime, rec.checkOutTime)}</p>
                    </div>
                    <div className="bg-slate-900/70 rounded-xl p-2.5 text-center border border-slate-700/50">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Face</p>
                      <p className="text-emerald-400 font-bold text-xs mt-0.5">
                        {rec.faceMatchScore ? `${Number(rec.faceMatchScore).toFixed(0)}%` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom Summary ── */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: <Timer className="w-5 h-5" />, iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', label: 'Working Now', value: workingToday.length, sub: 'Active shifts' },
          { icon: <Clock3 className="w-5 h-5" />, iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400', label: 'Completed', value: completedToday.length, sub: 'Checked out today' },
          { icon: <CalendarCheck className="w-5 h-5" />, iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400', label: 'Registered', value: totalEmployees, sub: 'Staff in system' },
          { icon: <Sparkles className="w-5 h-5" />, iconBg: 'bg-teal-500/15 border-teal-500/30 text-teal-400', label: 'AI Shield', value: null, sub: 'Anti-spoofing active', special: 'Active 🛡️' },
        ].map((item, i) => (
          <div key={i} className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-md">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${item.iconBg}`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{item.label}</p>
              {item.special ? (
                <h4 className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5 leading-none">{item.special}</h4>
              ) : (
                <h4 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 leading-none">{item.value}</h4>
              )}
              <p className="text-[10px] text-slate-500 mt-1 truncate">{item.sub}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
