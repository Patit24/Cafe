'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserCheck, Coffee, UserX, 
  Wallet, CalendarDays, Clock,
  ChevronRight, Timer, Clock3, CalendarX2, CalendarCheck,
  RefreshCw, Camera, Sparkles, Activity, TrendingUp, Zap, Eye, X
} from 'lucide-react';
import { API_BASE_URL, fastFetch } from '@/lib/api';

export default function Dashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [todayStr, setTodayStr] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

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

  const photoFeedRecords = attendances.filter(a => a.photoUrl || (a.employee?.faces && a.employee.faces.length > 0));

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
      accent: 'from-blue-500 to-cyan-500',
      href: '/attendance',
      badge: attendanceRate > 0 ? `${attendanceRate}% Rate` : null,
    },
    {
      label: 'On Break',
      value: onBreakCount,
      sub: 'Pause sessions',
      icon: <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />,
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      accent: 'from-amber-500 to-orange-500',
      href: '/attendance',
      badge: null,
    },
    {
      label: 'Absent Today',
      value: absentCount,
      sub: 'Not checked in',
      icon: <UserX className="w-5 h-5 sm:w-6 sm:h-6" />,
      iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      accent: 'from-rose-500 to-pink-500',
      href: '/attendance',
      badge: null,
    },
  ];

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 pb-16 bg-slate-900 text-slate-100 min-h-screen">
      
      {/* ── Top Header Bar ── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Sparkles size={12} /> Live Kitchen Kiosk Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Kitchen Operations & Payroll Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
            Real-time biometric attendance, live photo feeds & shift control
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <a
            href="https://evening-light-attendance.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Camera size={15} />
            Open Web Kiosk ↗
          </a>

          <button
            onClick={() => fetchDashboardData(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* ── Stats Grid ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((card, i) => (
          <Link
            key={i}
            href={card.href}
            className="group relative bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 hover:border-slate-600 transition-all duration-300 shadow-lg hover:shadow-xl flex flex-col justify-between overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accent}`} />
            
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {card.label}
                </span>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${card.iconBg}`}>
                  {card.icon}
                </div>
              </div>

              <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
                <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {card.value}
                </span>
                {card.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {card.badge}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
              <span>{card.sub}</span>
              <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </section>

      {/* ── DEDICATED LIVE PHOTO PUNCH-IN SECTION ── */}
      {photoFeedRecords.length > 0 && (
        <section className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Camera size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  Live Captured Kiosk Punch-In Photos
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    REAL-TIME AUDIT
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Live snapshots captured at kiosk terminal during staff check-in</p>
              </div>
            </div>

            <Link
              href="/attendance"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline"
            >
              View All Photos <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {photoFeedRecords.slice(0, 6).map((rec) => {
              const photoSrc = rec.photoUrl || rec.employee?.faces?.[0]?.imageUrl || 'https://via.placeholder.com/150';
              const isManual = rec.faceMatchScore === '-1' || Number(rec.faceMatchScore) === -1 || !rec.faceMatchScore;

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedPhoto(rec)}
                  className="group bg-slate-900/90 border border-slate-700/80 hover:border-purple-500/60 rounded-2xl p-2.5 transition-all shadow-md cursor-pointer hover:scale-[1.02]"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-2">
                    <img
                      src={photoSrc}
                      alt={rec.employee?.name || 'Check-in snapshot'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        isManual ? 'bg-amber-500/90 text-white border-amber-400/50' : 'bg-emerald-500/90 text-white border-emerald-400/50'
                      }`}>
                        {isManual ? '📸 Manual' : `⚡ ${Number(rec.faceMatchScore).toFixed(0)}%`}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={18} className="text-white" />
                    </div>
                  </div>

                  <h3 className="font-extrabold text-white text-xs truncate">{rec.employee?.name || 'Kitchen Staff'}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatTime(rec.checkInTime)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Recent Attendance Feed ── */}
      <section className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/70 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-white">Live Attendance Audit Stream</h2>
          </div>
          <Link
            href="/attendance"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
          >
            View Full Table <ChevronRight size={14} />
          </Link>
        </div>

        <div className="p-4 sm:p-6">
          {todayAttendances.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2 animate-pulse" />
              <p className="font-bold text-slate-300">No Check-in Activity Today Yet</p>
              <p className="text-xs text-slate-500 mt-1">
                When staff check in at the Kiosk App, live entries will stream here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAttendances.slice(0, 6).map((rec) => (
                <div key={rec.id} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/60 hover:border-slate-600 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
                        {(rec.employee?.name || 'Staff').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{rec.employee?.name || 'Kitchen Staff'}</h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{rec.employee?.role?.name || rec.employee?.role || 'Staff'}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase border ${
                      rec.status === 'working'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : rec.status === 'on_break'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {(rec.status || 'working').replace('_', ' ')}
                    </span>
                  </div>

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
                        {rec.faceMatchScore === '-1' || Number(rec.faceMatchScore) === -1 ? 'Manual' : rec.faceMatchScore ? `${Number(rec.faceMatchScore).toFixed(0)}%` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HIGH RES PHOTO INSPECTION MODAL ── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                {(selectedPhoto.employee?.name || 'EL').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">{selectedPhoto.employee?.name || 'Kitchen Staff'}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Checked in at {formatTime(selectedPhoto.checkInTime)}
                </p>
              </div>
            </div>

            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative mb-4">
              <img
                src={selectedPhoto.photoUrl || selectedPhoto.employee?.faces?.[0]?.imageUrl || 'https://via.placeholder.com/300'}
                alt="Captured Punch-In Snapshot"
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={() => setSelectedPhoto(null)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all"
            >
              Close Inspection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
