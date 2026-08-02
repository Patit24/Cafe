'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, fastFetch } from '@/lib/api';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      setError('Cannot connect to backend server. Please make sure the backend is running and NEXT_PUBLIC_API_URL is set.');
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
    
    let shiftStartMins = 480; // Default 08:00 AM (8 * 60)
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

  return (
    <div className="p-8 min-h-screen bg-surface-container-lowest">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Attendance Log</h1>
          <p className="text-on-surface-variant text-sm mt-1">Daily check-in / check-out records with face verification audit</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <a
            href="https://evening-light-attendance.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-md transition-all text-sm flex items-center gap-2"
          >
            📱 Launch Face Verification App ↗
          </a>
          <button
            onClick={fetchAttendance}
            className="px-4 py-2 bg-surface-container-high text-on-surface rounded border border-outline-variant hover:bg-surface-container text-sm font-medium"
          >
            ↻ Refresh
          </button>
          <Link href="/" className="px-4 py-2 bg-primary text-on-primary rounded font-semibold hover:opacity-90 text-sm">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <span className="text-red-500 text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-700">Backend Not Connected</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <p className="text-red-500 text-xs mt-2">
              Set <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> in your Vercel project settings → Environment Variables → point it to your deployed NestJS backend URL.
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {!error && !loading && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Total Records</p>
            <p className="text-3xl font-bold text-on-surface mt-1">{attendance.length}</p>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Working Today</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {attendance.filter(r => r.status === 'working').length}
            </p>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Late Entries</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {attendance.filter(r => getLateStatus(r).isLate).length}
            </p>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Completed</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {attendance.filter(r => r.status === 'completed').length}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-on-surface-variant">
            <div className="animate-spin text-4xl mb-3">⟳</div>
            <p>Loading attendance records...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container border-b border-outline-variant">
              <tr>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Date</th>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Employee & Assigned Hours</th>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Check In & Late Status</th>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Check Out</th>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Duration</th>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Face Score</th>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Liveness</th>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-on-surface-variant">
                    <p className="text-lg font-medium">No attendance records yet</p>
                    <p className="text-sm mt-1">Records will appear here when employees check in using the mobile app.</p>
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                    <td className="px-5 py-4 text-on-surface">
                      {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 font-medium text-on-surface">
                      <div className="font-bold text-slate-900">{record.employee?.name || 'Unknown'}</div>
                      <div className="text-xs text-purple-700 font-semibold bg-purple-50 inline-block px-2 py-0.5 rounded border border-purple-200 mt-1">
                        🕒 {getLateStatus(record).assigned}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface">
                      <div className="font-semibold text-slate-800">{formatTime(record.checkInTime)}</div>
                      {record.checkInTime && (
                        <div className={`text-xs font-bold inline-block px-2 py-0.5 rounded mt-1 border ${
                          getLateStatus(record).isLate 
                            ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {getLateStatus(record).label}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-on-surface">
                      {formatTime(record.checkOutTime)}
                    </td>
                    <td className="px-5 py-4 text-on-surface">
                      {calcHours(record.checkInTime, record.checkOutTime)}
                    </td>
                    <td className="px-5 py-4">
                      {record.faceMatchScore ? (
                        <span className={`font-semibold ${Number(record.faceMatchScore) >= 90 ? 'text-green-600' : Number(record.faceMatchScore) >= 85 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {Number(record.faceMatchScore).toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {record.livenessPassed === true ? (
                        <span className="text-green-600 font-semibold">✓ Passed</span>
                      ) : record.livenessPassed === false ? (
                        <span className="text-red-500 font-semibold">✗ Failed</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1.5 text-xs font-extrabold rounded-full inline-flex items-center gap-1 shadow-2xs ${
                        record.status === 'working' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        record.status === 'completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        record.status === 'on_break' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {record.status === 'completed' ? '✓ COMPLETED (DUTY ENDED)' : (record.status || 'unknown').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
