'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, UserCheck, AlertTriangle, CheckCircle2, 
  RefreshCw, Camera, ChevronRight, Users, ShieldCheck, ShieldAlert,
  Calendar, Timer, ArrowLeft
} from 'lucide-react';
import { API_BASE_URL, fastFetch } from '@/lib/api';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
      const sorted = rawList.sort((a, b) => {
        const timeA = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
        const timeB = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
        return timeB - timeA;
      });
      setAttendance(sorted);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError('Cannot connect to backend server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calcHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return '--';
    const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000;
    return diff.toFixed(2) + 'h';
  };

  const getLateStatus = (record: any) => {
    if (!record.checkInTime) return { isLate: false, label: 'No Check In', assigned: '08:00 AM - 05:00 PM' };
    const checkIn = new Date(record.checkInTime);
    const checkInMins = checkIn.getHours() * 60 + checkIn.getMinutes();
    
    let shiftStartMins = 480; // Default 08:00 AM
    let assignedLabel = '08:00 AM - 05:00 PM (Standard)';
    const shiftObj = record.shift || record.employee?.shift;
    if (shiftObj && shiftObj.startTime) {
      const shiftDate = new Date(shiftObj.startTime);
      shiftStartMins = shiftDate.getHours() * 60 + shiftDate.getMinutes();
      const endStr = shiftObj.endTime ? new Date(shiftObj.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '05:00 PM';
      assignedLabel = `${new Date(shiftObj.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endStr} (${shiftObj.name || 'Shift'})`;
    }

    const diff = checkInMins - shiftStartMins;
    if (diff > 0) {
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      let durationStr = '';
      if (hrs > 0 && mins > 0) durationStr = `${hrs} hr ${mins} mins`;
      else if (hrs > 0) durationStr = `${hrs} hr${hrs > 1 ? 's' : ''}`;
      else durationStr = `${mins} mins`;
      return { isLate: true, label: `⚠️ Late by ${durationStr}`, assigned: assignedLabel, diffMins: diff };
    }
    return { isLate: false, label: '✓ On Time', assigned: assignedLabel, diffMins: diff };
  };

  const workingToday = attendance.filter(r => r.status === 'working').length;
  const lateEntries = attendance.filter(r => getLateStatus(r).isLate).length;
  const completedEntries = attendance.filter(r => r.status === 'completed').length;

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 pb-16 bg-slate-900 text-slate-100 min-h-screen">
      
      {/* ── Page Header ── */}
      <header className="mb-6 sm:mb-8 pb-4 border-b border-slate-800/80">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clock className="text-blue-400" size={28} />
              Attendance Log
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              Real-time check-in / check-out audit with AI face verification & liveness score
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <a
              href="https://evening-light-attendance.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Camera size={14} />
              Face Verify App ↗
            </a>
            <button
              onClick={fetchAttendance}
              className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-blue-400' : 'text-slate-400'} />
              Refresh
            </button>
            <Link
              href="/"
              className="px-3.5 py-2 bg-slate-800/90 border border-slate-700/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-rose-200">Backend Connection Error</p>
            <p className="text-xs text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Stats Section ── */}
      {!error && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Total Records</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Users size={18} />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">{loading ? '...' : attendance.length}</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Logged check-in entries</p>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Working Today</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Timer size={18} />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-3">{loading ? '...' : workingToday}</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Active shifts in progress</p>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Late Entries</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle size={18} />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-3">{loading ? '...' : lateEntries}</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Punched in after shift start</p>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-700/70 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Completed</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-3">{loading ? '...' : completedEntries}</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Checked out duty complete</p>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          </div>
        </section>
      )}

      {/* ── Table Container ── */}
      <section className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/70 shadow-xl overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-slate-700/70 flex items-center justify-between bg-slate-800/50">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
            Attendance Audit Records
            <span className="px-2.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full font-mono">{attendance.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="animate-spin w-8 h-8 text-blue-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-200">Loading attendance records...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (≥ md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-700/70">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Employee & Assigned Shift</th>
                    <th className="px-6 py-4">Check-In & Late Audit</th>
                    <th className="px-6 py-4">Check-Out</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Face Match</th>
                    <th className="px-6 py-4">Liveness</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                        <p className="text-base font-semibold text-slate-200">No attendance records found</p>
                        <p className="text-xs text-slate-500 mt-1">Staff check-ins will appear here automatically.</p>
                      </td>
                    </tr>
                  ) : (
                    attendance.map((rec) => {
                      const lateInfo = getLateStatus(rec);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-750 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-300 font-semibold text-xs whitespace-nowrap">
                            {mounted ? new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md shrink-0 border border-white/10">
                                {(rec.employee?.name || 'Staff').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{rec.employee?.name || 'Kitchen Staff'}</p>
                                <p className="text-[11px] text-purple-400 font-mono mt-0.5">{lateInfo.assigned}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-100 font-mono text-sm">{formatTime(rec.checkInTime)}</p>
                            {rec.checkInTime && (
                              <span className={`text-[10px] font-extrabold inline-block px-2.5 py-0.5 rounded-full mt-1 border uppercase tracking-wider ${
                                lateInfo.isLate 
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}>
                                {lateInfo.label}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-300 text-sm">
                            {formatTime(rec.checkOutTime)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-sm">
                            {calcHours(rec.checkInTime, rec.checkOutTime)}
                          </td>
                          <td className="px-6 py-4">
                            {rec.faceMatchScore ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                                <Camera size={12} />
                                {Number(rec.faceMatchScore).toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {rec.livenessPassed === true ? (
                              <span className="text-emerald-400 font-bold text-xs inline-flex items-center gap-1">
                                <ShieldCheck size={14} /> Passed
                              </span>
                            ) : rec.livenessPassed === false ? (
                              <span className="text-rose-400 font-bold text-xs inline-flex items-center gap-1">
                                <ShieldAlert size={14} /> Failed
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-extrabold rounded-full tracking-wide uppercase border ${
                              rec.status === 'working' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              rec.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              rec.status === 'on_break' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-slate-700 text-slate-300 border-slate-600'
                            }`}>
                              {rec.status === 'completed' ? '✓ COMPLETED' : (rec.status || 'working').replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-700/60">
              {attendance.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm font-semibold text-slate-200">No attendance records found</p>
                  <p className="text-xs text-slate-500 mt-1">Records will appear here automatically.</p>
                </div>
              ) : (
                attendance.map((rec) => {
                  const lateInfo = getLateStatus(rec);
                  return (
                    <div key={rec.id} className="p-4 space-y-3 bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                      {/* Name + Date + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0 border border-white/10">
                            {(rec.employee?.name || 'Staff').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">{rec.employee?.name || 'Kitchen Staff'}</h4>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {mounted ? new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'} • {lateInfo.assigned}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wide shrink-0 border ${
                          rec.status === 'working' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          rec.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          rec.status === 'on_break' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-slate-700 text-slate-300 border-slate-600'
                        }`}>
                          {rec.status === 'completed' ? '✓ ENDED' : (rec.status || 'working').replace('_', ' ')}
                        </span>
                      </div>

                      {/* 3 Metrics grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-xs">
                        <div className="text-center">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Check In</span>
                          <span className="text-slate-100 font-bold font-mono text-xs mt-0.5 block">{formatTime(rec.checkInTime)}</span>
                        </div>
                        <div className="text-center border-x border-slate-700/60">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Check Out</span>
                          <span className="text-slate-100 font-bold font-mono text-xs mt-0.5 block">{formatTime(rec.checkOutTime)}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Duration</span>
                          <span className="text-emerald-400 font-bold font-mono text-xs mt-0.5 block">{calcHours(rec.checkInTime, rec.checkOutTime)}</span>
                        </div>
                      </div>

                      {/* Late & Verification Footer */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          lateInfo.isLate 
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {lateInfo.label}
                        </span>

                        <div className="flex items-center gap-2 text-[11px]">
                          {rec.faceMatchScore && (
                            <span className="text-emerald-400 font-bold font-mono inline-flex items-center gap-1">
                              <Camera size={11} /> {Number(rec.faceMatchScore).toFixed(1)}%
                            </span>
                          )}
                          {rec.livenessPassed === true ? (
                            <span className="text-emerald-400 font-bold">✓ Live</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
