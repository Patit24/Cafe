'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, UserCheck, AlertTriangle, CheckCircle2, 
  RefreshCw, Camera, ChevronRight, Users, ShieldCheck, ShieldAlert,
  Calendar, Timer, ArrowLeft, Image as ImageIcon, Eye, X, Sparkles
} from 'lucide-react';
import { API_BASE_URL, fastFetch } from '@/lib/api';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'ai'>('all');

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

  const photoRecords = attendance.filter(r => r.photoUrl || (r.employee?.faces && r.employee.faces.length > 0));

  const filteredAttendance = attendance.filter(r => {
    if (filterType === 'manual') return r.faceMatchScore === '-1' || Number(r.faceMatchScore) === -1 || !r.faceMatchScore;
    if (filterType === 'ai') return Number(r.faceMatchScore) > 0;
    return true;
  });

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 pb-16 bg-slate-900 text-slate-100 min-h-screen">
      
      {/* ── Page Header ── */}
      <header className="mb-6 sm:mb-8 pb-4 border-b border-slate-800/80">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clock className="text-blue-400" size={28} />
              Attendance Audit & Live Photo Log
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              Real-time kiosk check-in / check-out audit with live captured photos & AI verification
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

      {/* ── DEDICATED LIVE PHOTO PUNCH-IN AUDIT GALLERY SECTION ── */}
      {!error && photoRecords.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Camera size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  Live Captured Punch-In Photos
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {photoRecords.length} CAPTURES
                  </span>
                </h2>
                <p className="text-xs text-slate-400">High-resolution live camera photos captured at kiosk check-in</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'all' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('manual')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'manual' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                📸 Manual Photo
              </button>
              <button
                onClick={() => setFilterType('ai')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'ai' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ⚡ AI Verified
              </button>
            </div>
          </div>

          {/* Photo Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photoRecords.slice(0, 10).map((rec) => {
              const photoSrc = rec.photoUrl || rec.employee?.faces?.[0]?.imageUrl || 'https://via.placeholder.com/150';
              const isManual = rec.faceMatchScore === '-1' || Number(rec.faceMatchScore) === -1 || !rec.faceMatchScore;
              const lateInfo = getLateStatus(rec);

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedPhoto(rec)}
                  className="group bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 rounded-2xl p-3 transition-all shadow-lg hover:shadow-purple-500/10 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 mb-2.5">
                    <img
                      src={photoSrc}
                      alt={rec.employee?.name || 'Check-in photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    
                    {/* Mode Tag */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shadow-md border ${
                        isManual 
                          ? 'bg-amber-500/90 text-white border-amber-400/50' 
                          : 'bg-emerald-500/90 text-white border-emerald-400/50'
                      }`}>
                        {isManual ? '📸 Manual Photo' : `⚡ AI ${Number(rec.faceMatchScore).toFixed(0)}%`}
                      </span>
                    </div>

                    {/* View overlay icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40">
                      <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl">
                        <Eye size={18} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-xs truncate">{rec.employee?.name || 'Kitchen Staff'}</h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="font-mono text-slate-300">{formatTime(rec.checkInTime)}</span>
                      <span className={`font-bold text-[10px] ${lateInfo.isLate ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {lateInfo.isLate ? 'Late' : 'On Time'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── MAIN ATTENDANCE LOG TABLE ── */}
      <section className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/70 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-700/80 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            Detailed Punch Logs ({filteredAttendance.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">Real-time Kiosk Feeds</span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-700/60">
              <tr>
                <th className="px-6 py-3.5">Live Photo</th>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Check In</th>
                <th className="px-6 py-3.5">Check Out</th>
                <th className="px-6 py-3.5">Net Hours</th>
                <th className="px-6 py-3.5">AI Match</th>
                <th className="px-6 py-3.5">Liveness</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-200">No attendance records matching filter.</p>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec) => {
                  const lateInfo = getLateStatus(rec);
                  const photoSrc = rec.photoUrl || rec.employee?.faces?.[0]?.imageUrl;
                  const isManual = rec.faceMatchScore === '-1' || Number(rec.faceMatchScore) === -1 || !rec.faceMatchScore;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Live Captured Photo Column */}
                      <td className="px-6 py-3.5">
                        {photoSrc ? (
                          <div 
                            onClick={() => setSelectedPhoto(rec)}
                            className="w-10 h-10 rounded-xl overflow-hidden border border-slate-600 bg-slate-950 relative group cursor-pointer hover:border-purple-400 transition-all"
                          >
                            <img src={photoSrc} alt="Check-in" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-purple-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye size={14} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                            <Camera size={16} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md shrink-0 border border-white/10">
                            {(rec.employee?.name || 'Staff').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{rec.employee?.name || 'Kitchen Staff'}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{rec.employee?.role?.name || rec.employee?.role || 'Staff'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-300">
                        {mounted ? new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-3.5">
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
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-300 text-sm">
                        {formatTime(rec.checkOutTime)}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-emerald-400 text-sm">
                        {calcHours(rec.checkInTime, rec.checkOutTime)}
                      </td>
                      <td className="px-6 py-3.5">
                        {isManual ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                            <Camera size={12} />
                            Manual Photo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                            <Camera size={12} />
                            {Number(rec.faceMatchScore).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {rec.livenessPassed === true ? (
                          <span className="text-emerald-400 font-bold text-xs inline-flex items-center gap-1">
                            <ShieldCheck size={14} /> Passed
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
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
      </section>

      {/* ── HIGH-RES PHOTO INSPECTION MODAL ── */}
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

            {/* High Res Image */}
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative mb-4">
              <img
                src={selectedPhoto.photoUrl || selectedPhoto.employee?.faces?.[0]?.imageUrl || 'https://via.placeholder.com/300'}
                alt="Captured Punch-In Snapshot"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Verification Metadata Footer */}
            <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 text-xs mb-4">
              <div>
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase">Verification Mode</span>
                <span className="font-bold text-white mt-0.5 block">
                  {selectedPhoto.faceMatchScore === '-1' || Number(selectedPhoto.faceMatchScore) === -1 || !selectedPhoto.faceMatchScore
                    ? '📸 Manual Live Photo'
                    : `⚡ AI Face Match (${Number(selectedPhoto.faceMatchScore).toFixed(1)}%)`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase">Terminal Location</span>
                <span className="font-bold text-emerald-400 mt-0.5 block truncate">
                  {selectedPhoto.gpsLocation || 'Main Kiosk Terminal'}
                </span>
              </div>
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
