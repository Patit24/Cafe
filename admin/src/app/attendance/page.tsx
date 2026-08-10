'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock, UserCheck, AlertTriangle, CheckCircle2,
  RefreshCw, Camera, ArrowLeft, Eye, X, Sparkles,
  LogIn, LogOut, Timer, ShieldCheck, Users, Filter,
  TrendingUp, CalendarDays, Zap
} from 'lucide-react';
import { API_BASE_URL, fastFetch } from '@/lib/api';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ rec: any; type: 'checkin' | 'checkout' } | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'ai' | 'working'>('all');

  useEffect(() => {
    setMounted(true);
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fastFetch(`${API_BASE_URL}/attendance`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      const rawList = Array.isArray(data) ? data : [];
      setAttendance(rawList.sort((a, b) =>
        new Date(b.checkInTime || 0).getTime() - new Date(a.checkInTime || 0).getTime()
      ));
    } catch (err: any) {
      setError('Cannot connect to backend server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    if (!mounted) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calcHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return null;
    const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000;
    return diff.toFixed(2);
  };

  const getLateStatus = (record: any) => {
    if (!record.checkInTime) return { isLate: false, label: 'No Check In', diffMins: 0 };
    const checkIn = new Date(record.checkInTime);
    const checkInMins = checkIn.getHours() * 60 + checkIn.getMinutes();
    let shiftStartMins = 480;
    const shiftObj = record.shift || record.employee?.shift;
    if (shiftObj?.startTime) {
      const d = new Date(shiftObj.startTime);
      shiftStartMins = d.getUTCHours() * 60 + d.getUTCMinutes();
    }
    const diff = checkInMins - shiftStartMins;
    if (diff > 0) {
      const h = Math.floor(diff / 60), m = diff % 60;
      const label = h > 0 && m > 0 ? `${h}h ${m}m late` : h > 0 ? `${h}h late` : `${m}m late`;
      return { isLate: true, label, diffMins: diff };
    }
    return { isLate: false, label: 'On Time', diffMins: diff };
  };

  const isManual = (rec: any) =>
    rec.faceMatchScore === '-1' || Number(rec.faceMatchScore) === -1 || !rec.faceMatchScore;

  const filteredAttendance = attendance.filter(r => {
    if (filterType === 'manual') return isManual(r);
    if (filterType === 'ai') return !isManual(r) && Number(r.faceMatchScore) > 0;
    if (filterType === 'working') return r.status === 'working' || r.status === 'on_break';
    return true;
  });

  // Stats
  const totalToday = attendance.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const activeNow = attendance.filter(r => r.status === 'working' || r.status === 'on_break').length;
  const lateCount = attendance.filter(r => getLateStatus(r).isLate).length;
  const withCheckOutPhoto = attendance.filter(r => r.checkOutPhotoUrl).length;

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100">
      {/* ── TOP NAVIGATION BAR ── */}
      <div className="sticky top-0 z-40 bg-[#06080F]/95 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
              <ArrowLeft size={15} />
              Dashboard
            </Link>
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Clock size={13} className="text-violet-400" />
              </div>
              <span className="font-bold text-white text-sm">Attendance</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://evening-light-attendance.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Camera size={12} />
              Kiosk App ↗
            </a>
            <button
              onClick={fetchAttendance}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin text-violet-400' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── PAGE HEADER ── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Attendance Audit
            <span className="ml-2 text-violet-400">& Photo Log</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time kiosk check-in / check-out with live face verification &amp; photo capture</p>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Today\'s Punches', value: totalToday, icon: CalendarDays, color: 'violet', sub: 'check-ins today' },
            { label: 'Currently Active', value: activeNow, icon: Zap, color: 'emerald', sub: 'on duty now' },
            { label: 'Late Arrivals', value: lateCount, icon: AlertTriangle, color: 'amber', sub: 'past shift start' },
            { label: 'Checkout Photos', value: withCheckOutPhoto, icon: Camera, color: 'sky', sub: 'captured on exit' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                  ${color === 'violet' ? 'bg-violet-500/15 border border-violet-500/25' :
                    color === 'emerald' ? 'bg-emerald-500/15 border border-emerald-500/25' :
                    color === 'amber' ? 'bg-amber-500/15 border border-amber-500/25' :
                    'bg-sky-500/15 border border-sky-500/25'}`}>
                  <Icon size={18} className={
                    color === 'violet' ? 'text-violet-400' :
                    color === 'emerald' ? 'text-emerald-400' :
                    color === 'amber' ? 'text-amber-400' : 'text-sky-400'
                  } />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{value}</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-rose-200">Backend Connection Error</p>
              <p className="text-xs text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── PHOTO CAPTURE GALLERY ── */}
        {!error && attendance.some(r => r.photoUrl || r.checkOutPhotoUrl) && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                <Camera size={16} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  Live Photo Captures
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    CHECK-IN + CHECKOUT
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Check-in photo (left) and checkout photo (right) for each employee</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {attendance
                .filter(r => r.photoUrl || r.checkOutPhotoUrl)
                .slice(0, 8)
                .map((rec) => {
                  const lateInfo = getLateStatus(rec);
                  const manual = isManual(rec);
                  return (
                    <div key={rec.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 hover:border-violet-500/40 transition-all group">
                      {/* Employee info */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {(rec.employee?.name || 'S').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs truncate">{rec.employee?.name || 'Kitchen Staff'}</p>
                          <p className="text-[10px] text-slate-500">{formatDate(rec.date)}</p>
                        </div>
                        <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-black border ${
                          lateInfo.isLate
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {lateInfo.isLate ? '⚠ Late' : '✓ OK'}
                        </span>
                      </div>

                      {/* Two-photo side-by-side */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* CHECK-IN PHOTO */}
                        <div className="relative">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <LogIn size={9} /> Check-In
                          </p>
                          <div
                            onClick={() => rec.photoUrl && setSelectedPhoto({ rec, type: 'checkin' })}
                            className={`aspect-square rounded-xl overflow-hidden border relative ${
                              rec.photoUrl
                                ? 'border-violet-500/40 cursor-pointer hover:border-violet-400 group/photo'
                                : 'border-slate-800 bg-slate-900/50'
                            }`}
                          >
                            {rec.photoUrl ? (
                              <>
                                <img src={rec.photoUrl} alt="Check-in" className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-violet-600/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye size={16} className="text-white" />
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 to-transparent px-1.5 py-1">
                                  <p className="text-[9px] text-slate-300 font-mono font-bold">{formatTime(rec.checkInTime)}</p>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                <Camera size={14} className="text-slate-700" />
                                <p className="text-[9px] text-slate-700">No photo</p>
                              </div>
                            )}
                          </div>
                          {manual && rec.photoUrl && (
                            <span className="absolute top-6 left-1 px-1 py-0.5 rounded text-[8px] font-black bg-amber-500 text-white">📸</span>
                          )}
                        </div>

                        {/* CHECK-OUT PHOTO */}
                        <div className="relative">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <LogOut size={9} /> Check-Out
                          </p>
                          <div
                            onClick={() => rec.checkOutPhotoUrl && setSelectedPhoto({ rec, type: 'checkout' })}
                            className={`aspect-square rounded-xl overflow-hidden border relative ${
                              rec.checkOutPhotoUrl
                                ? 'border-emerald-500/40 cursor-pointer hover:border-emerald-400 group/photo'
                                : 'border-slate-800 bg-slate-900/50'
                            }`}
                          >
                            {rec.checkOutPhotoUrl ? (
                              <>
                                <img src={rec.checkOutPhotoUrl} alt="Check-out" className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-emerald-600/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye size={16} className="text-white" />
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 to-transparent px-1.5 py-1">
                                  <p className="text-[9px] text-slate-300 font-mono font-bold">{formatTime(rec.checkOutTime)}</p>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                {rec.status === 'working' || rec.status === 'on_break' ? (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[9px] text-emerald-600 font-bold">Active</p>
                                  </>
                                ) : (
                                  <>
                                    <Camera size={14} className="text-slate-700" />
                                    <p className="text-[9px] text-slate-700">No photo</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* ── MAIN ATTENDANCE TABLE ── */}
        <section className="bg-slate-900/80 backdrop-blur rounded-2xl border border-slate-800/80 overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white">Detailed Punch Logs</h2>
              <p className="text-xs text-slate-500 mt-0.5">{filteredAttendance.length} records • Real-time feeds</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
              {([
                { key: 'all', label: 'All', color: 'violet' },
                { key: 'working', label: '🟢 Active', color: 'emerald' },
                { key: 'manual', label: '📸 Manual', color: 'amber' },
                { key: 'ai', label: '⚡ AI', color: 'sky' },
              ] as const).map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    filterType === key
                      ? color === 'violet' ? 'bg-violet-600 text-white shadow-md' :
                        color === 'emerald' ? 'bg-emerald-600 text-white shadow-md' :
                        color === 'amber' ? 'bg-amber-600 text-white shadow-md' :
                        'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <RefreshCw size={28} className="text-violet-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-semibold">Loading attendance records...</p>
              </div>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={36} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">No records found</p>
              <p className="text-slate-600 text-xs mt-1">Try a different filter</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-500 text-[10px] font-black tracking-widest uppercase border-b border-slate-800/60">
                    <tr>
                      <th className="px-5 py-3.5">Photos</th>
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Check-In</th>
                      <th className="px-5 py-3.5">Check-Out</th>
                      <th className="px-5 py-3.5">Net Hours</th>
                      <th className="px-5 py-3.5">Verification</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredAttendance.map((rec) => {
                      const lateInfo = getLateStatus(rec);
                      const manual = isManual(rec);
                      const hours = calcHours(rec.checkInTime, rec.checkOutTime);

                      return (
                        <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Photos Column — side-by-side check-in + check-out */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {/* Check-in photo */}
                              <div className="relative">
                                <div
                                  onClick={() => rec.photoUrl && setSelectedPhoto({ rec, type: 'checkin' })}
                                  className={`w-9 h-9 rounded-xl overflow-hidden border relative ${
                                    rec.photoUrl
                                      ? 'border-violet-500/40 cursor-pointer hover:border-violet-400 group/p'
                                      : 'border-slate-700 bg-slate-800'
                                  }`}
                                >
                                  {rec.photoUrl ? (
                                    <>
                                      <img src={rec.photoUrl} alt="CI" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-violet-600/50 opacity-0 group-hover/p:opacity-100 flex items-center justify-center transition-opacity">
                                        <Eye size={12} className="text-white" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Camera size={13} className="text-slate-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-violet-600/90 border border-slate-900 flex items-center justify-center">
                                  <LogIn size={8} className="text-white" />
                                </div>
                              </div>

                              {/* Check-out photo */}
                              <div className="relative">
                                <div
                                  onClick={() => rec.checkOutPhotoUrl && setSelectedPhoto({ rec, type: 'checkout' })}
                                  className={`w-9 h-9 rounded-xl overflow-hidden border relative ${
                                    rec.checkOutPhotoUrl
                                      ? 'border-emerald-500/40 cursor-pointer hover:border-emerald-400 group/p'
                                      : 'border-slate-700 bg-slate-800'
                                  }`}
                                >
                                  {rec.checkOutPhotoUrl ? (
                                    <>
                                      <img src={rec.checkOutPhotoUrl} alt="CO" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-emerald-600/50 opacity-0 group-hover/p:opacity-100 flex items-center justify-center transition-opacity">
                                        <Eye size={12} className="text-white" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {rec.status === 'working' || rec.status === 'on_break' ? (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      ) : (
                                        <Camera size={13} className="text-slate-600" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border border-slate-900 flex items-center justify-center ${
                                  rec.checkOutPhotoUrl ? 'bg-emerald-600/90' : 'bg-slate-700'
                                }`}>
                                  <LogOut size={8} className="text-white" />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Employee */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                                {(rec.employee?.name || 'S').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm leading-tight">{rec.employee?.name || 'Kitchen Staff'}</p>
                                <p className="text-[10px] text-slate-500">{rec.employee?.role?.name || 'Staff'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{formatDate(rec.date)}</td>

                          {/* Check-In */}
                          <td className="px-5 py-3.5">
                            <p className="font-black text-slate-100 font-mono text-sm">{formatTime(rec.checkInTime)}</p>
                            {rec.checkInTime && (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black mt-1 border ${
                                lateInfo.isLate
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              }`}>
                                {lateInfo.isLate ? `⚠ ${lateInfo.label}` : '✓ On Time'}
                              </span>
                            )}
                          </td>

                          {/* Check-Out */}
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-300 text-sm">
                            {rec.checkOutTime ? formatTime(rec.checkOutTime) : (
                              <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                Active
                              </span>
                            )}
                          </td>

                          {/* Net Hours */}
                          <td className="px-5 py-3.5">
                            {hours ? (
                              <span className="font-black text-emerald-400 font-mono">{hours}h</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Verification */}
                          <td className="px-5 py-3.5">
                            {manual ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Camera size={10} />
                                Manual Photo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                <Zap size={10} />
                                AI {Number(rec.faceMatchScore).toFixed(0)}%
                              </span>
                            )}
                            {rec.livenessPassed === true && (
                              <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-400 text-[9px] font-bold">
                                <ShieldCheck size={10} /> Live
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <span className={`px-3 py-1 text-[10px] font-black rounded-full tracking-wide uppercase border ${
                              rec.status === 'working' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                              rec.status === 'completed' ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' :
                              rec.status === 'on_break' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                              'bg-slate-700/50 text-slate-400 border-slate-600/50'
                            }`}>
                              {rec.status === 'completed' ? '✓ Done' :
                               rec.status === 'working' ? '● Active' :
                               rec.status === 'on_break' ? '☕ Break' : rec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-slate-800/50">
                {filteredAttendance.map((rec) => {
                  const lateInfo = getLateStatus(rec);
                  const manual = isManual(rec);
                  const hours = calcHours(rec.checkInTime, rec.checkOutTime);
                  return (
                    <div key={rec.id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shrink-0">
                          {(rec.employee?.name || 'S').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white">{rec.employee?.name || 'Kitchen Staff'}</p>
                          <p className="text-xs text-slate-500">{rec.employee?.role?.name || 'Staff'} • {formatDate(rec.date)}</p>
                        </div>
                        <span className={`shrink-0 px-2.5 py-1 text-[10px] font-black rounded-full border ${
                          rec.status === 'working' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          rec.status === 'completed' ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' :
                          'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {rec.status === 'completed' ? '✓ Done' : rec.status === 'working' ? '● Active' : '☕ Break'}
                        </span>
                      </div>

                      {/* Times + Photos */}
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {/* Check-in */}
                        <div className="bg-slate-800/50 rounded-xl p-2.5 flex items-center gap-2">
                          <div
                            onClick={() => rec.photoUrl && setSelectedPhoto({ rec, type: 'checkin' })}
                            className={`w-10 h-10 rounded-lg overflow-hidden border shrink-0 ${rec.photoUrl ? 'border-violet-500/40 cursor-pointer' : 'border-slate-700 bg-slate-900'}`}
                          >
                            {rec.photoUrl ? (
                              <img src={rec.photoUrl} alt="CI" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Camera size={14} className="text-slate-600" /></div>
                            )}
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-violet-400 uppercase tracking-wider">Check-In</p>
                            <p className="font-black text-white font-mono text-sm">{formatTime(rec.checkInTime)}</p>
                            {lateInfo.isLate && <p className="text-[9px] text-amber-400 font-bold">{lateInfo.label}</p>}
                          </div>
                        </div>

                        {/* Check-out */}
                        <div className="bg-slate-800/50 rounded-xl p-2.5 flex items-center gap-2">
                          <div
                            onClick={() => rec.checkOutPhotoUrl && setSelectedPhoto({ rec, type: 'checkout' })}
                            className={`w-10 h-10 rounded-lg overflow-hidden border shrink-0 ${rec.checkOutPhotoUrl ? 'border-emerald-500/40 cursor-pointer' : 'border-slate-700 bg-slate-900'}`}
                          >
                            {rec.checkOutPhotoUrl ? (
                              <img src={rec.checkOutPhotoUrl} alt="CO" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {rec.status === 'working' ? (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                ) : (
                                  <Camera size={14} className="text-slate-600" />
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Check-Out</p>
                            <p className="font-black text-white font-mono text-sm">{formatTime(rec.checkOutTime)}</p>
                            {hours && <p className="text-[9px] text-slate-400 font-bold">{hours}h worked</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── PHOTO INSPECTION MODAL ── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black ${
                  selectedPhoto.type === 'checkin'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  {(selectedPhoto.rec.employee?.name || 'EL').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{selectedPhoto.rec.employee?.name || 'Kitchen Staff'}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    {selectedPhoto.type === 'checkin' ? (
                      <><LogIn size={11} className="text-violet-400" /> Check-In • {formatTime(selectedPhoto.rec.checkInTime)}</>
                    ) : (
                      <><LogOut size={11} className="text-emerald-400" /> Check-Out • {formatTime(selectedPhoto.rec.checkOutTime)}</>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Photo */}
            <div className={`aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border mb-4 ${
              selectedPhoto.type === 'checkin' ? 'border-violet-500/30' : 'border-emerald-500/30'
            }`}>
              <img
                src={selectedPhoto.type === 'checkin' ? selectedPhoto.rec.photoUrl : selectedPhoto.rec.checkOutPhotoUrl}
                alt={selectedPhoto.type === 'checkin' ? 'Check-in snapshot' : 'Check-out snapshot'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-slate-800/80 p-3 rounded-xl">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Type</p>
                <p className="font-bold text-white text-xs mt-0.5">
                  {selectedPhoto.type === 'checkin'
                    ? (isManual(selectedPhoto.rec) ? '📸 Manual Photo' : `⚡ AI ${Number(selectedPhoto.rec.faceMatchScore).toFixed(1)}%`)
                    : '📷 Checkout Selfie'}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Date</p>
                <p className="font-bold text-white text-xs mt-0.5">{formatDate(selectedPhoto.rec.date)}</p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Location</p>
                <p className="font-bold text-emerald-400 text-xs mt-0.5 truncate">{selectedPhoto.rec.gpsLocation || 'Main Kiosk'}</p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Status</p>
                <p className={`font-bold text-xs mt-0.5 ${
                  getLateStatus(selectedPhoto.rec).isLate ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {getLateStatus(selectedPhoto.rec).isLate ? `⚠ ${getLateStatus(selectedPhoto.rec).label}` : '✓ On Time'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPhoto(null)}
              className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-lg hover:brightness-110 transition-all ${
                selectedPhoto.type === 'checkin'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
