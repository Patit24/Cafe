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
      setAttendance(Array.isArray(data) ? data : []);
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
        <div className="grid grid-cols-3 gap-4 mb-6">
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
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Employee</th>
                <th className="px-5 py-4 font-semibold text-on-surface-variant">Check In</th>
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
                      {record.employee?.name || 'Unknown'}
                    </td>
                    <td className="px-5 py-4 text-on-surface">
                      {formatTime(record.checkInTime)}
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
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'working' ? 'bg-green-100 text-green-800' :
                        record.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        record.status === 'on_break' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {(record.status || 'unknown').replace('_', ' ').toUpperCase()}
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
