'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserCheck, Coffee, UserX, 
  Wallet, CalendarDays, Clock,
  ChevronRight, Timer, Clock3, CalendarX2, ArrowDownCircle, CalendarCheck,
  RefreshCw, Camera
} from 'lucide-react';
import { API_BASE_URL, fastFetch } from '@/lib/api';

export default function Dashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
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
      setLoading(false);
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

  const presentCount = workingToday.length + onBreakToday.length + completedToday.length;
  const onBreakCount = onBreakToday.length;
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
    <div className="p-8 pb-12 bg-surface-container-lowest min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Overview <span className="text-xl">👋</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live Kitchen Staff Attendance • Real-time face verification insights
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <a
            href="https://evening-light-attendance.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            📱 Launch Face Verification App ↗
          </a>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw size={15} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh ({lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
          </button>
          <Link href="/employees/new" className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-purple-700 flex items-center gap-2">
            <Users size={16} />
            + Add Employee
          </Link>
          <Link href="/payroll" className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 flex items-center gap-2">
            <Wallet size={16} />
            Payroll
          </Link>
        </div>
      </header>

      {/* Top Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {/* Total Employees */}
        <Link href="/employees" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Employees</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalEmployees}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">Registered staff profiles</p>
            <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>
        </Link>

        {/* Present Today */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Present Today</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{presentCount}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0}% of total staff
            </p>
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
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{onBreakCount}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">Currently taking shift break</p>
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
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{absentCount}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">Not checked in yet today</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500"></div>
        </div>
      </section>

      {/* Quick Access Shortcuts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/employees" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Manage Employees</h3>
              <p className="text-xs text-gray-500 mt-0.5">Add staff & 4-angle face authentication</p>
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
              <p className="text-xs text-gray-500 mt-0.5">Audit face scores, GPS, & check-in times</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
            <ChevronRight size={18} />
          </div>
        </Link>
        <Link href="/payroll" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Payroll Calculation</h3>
              <p className="text-xs text-gray-500 mt-0.5">Automatic salary deductions & overtime</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
            <ChevronRight size={18} />
          </div>
        </Link>
      </section>

      {/* Live Active Staff Table */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Active Staff (Kitchen)</h2>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live ({todayAttendances.length})
            </span>
          </div>
          <Link href="/attendance" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            View Full Log <ChevronRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Face Verification</th>
                <th className="px-6 py-4">Liveness</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Work Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todayAttendances.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-base font-semibold text-gray-700">No active staff checked in today yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Staff can check in on their mobile phone using face verification.</p>
                  </td>
                </tr>
              ) : (
                todayAttendances.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">
                          {(rec.employee?.name || 'Staff').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{rec.employee?.name || 'Kitchen Staff'}</p>
                          <p className="text-xs text-gray-400">{rec.employee?.employeeCode || 'EMP-001'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {formatTime(rec.checkInTime)}
                    </td>
                    <td className="px-6 py-4">
                      {rec.faceMatchScore ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                          <Camera size={12} />
                          {Number(rec.faceMatchScore).toFixed(1)}% Match
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {rec.livenessPassed === true ? (
                        <span className="text-green-600 font-semibold text-xs">✓ Passed</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        rec.status === 'working' ? 'bg-green-100 text-green-800' :
                        rec.status === 'on_break' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {(rec.status || 'working').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {getWorkDuration(rec.checkInTime, rec.checkOutTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Summary Indicators */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
            <Timer size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Checked-in Staff</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">{workingToday.length}</h4>
            <p className="text-xs text-gray-400 mt-1">Currently working</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <Clock3 size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Completed Shifts</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">{completedToday.length}</h4>
            <p className="text-xs text-gray-400 mt-1">Checked out today</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Registered</p>
            <h4 className="text-xl font-bold text-gray-900 mt-0.5">{totalEmployees}</h4>
            <p className="text-xs text-gray-400 mt-1">Staff in system</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 shrink-0">
            <CalendarX2 size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Liveness Shield</p>
            <h4 className="text-xl font-bold text-green-600 mt-0.5">Active</h4>
            <p className="text-xs text-gray-400 mt-1">Anti-spoofing enabled</p>
          </div>
        </div>
      </section>
    </div>
  );
}
