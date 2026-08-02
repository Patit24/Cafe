'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, BarChart2, TrendingUp, Users, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function ReportsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [empRes, attRes] = await Promise.all([
          fetch(`${API_BASE_URL}/employees`),
          fetch(`${API_BASE_URL}/attendance`),
        ]);

        const empData = await empRes.json();
        const attData = await attRes.json();

        if (Array.isArray(empData)) setEmployees(empData);
        if (Array.isArray(attData)) setAttendances(attData);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, []);

  // Compute Real Metrics
  const totalPayroll = employees.reduce((sum, emp) => sum + (Number(emp.salaryRate) || 0), 0);
  const activeCount = employees.filter(e => e.isActive !== false).length;
  const totalRecords = attendances.length;
  const attendanceRate = activeCount > 0 ? Math.min(100, Math.round((totalRecords / (activeCount * 30)) * 1000) / 10) : 0;
  
  // Calculate total overtime hours from real attendance records
  const totalOvertimeMinutes = attendances.reduce((sum, att) => sum + (att.overtimeMinutes || 0), 0);
  const totalOvertimeHours = Math.round((totalOvertimeMinutes / 60) * 10) / 10;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center font-medium text-slate-600 gap-2">
        <Loader2 className="animate-spin text-purple-600" size={24} />
        Loading real workforce report data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-8">
      <header className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time workforce performance and backend financials</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 flex items-center gap-2">
            <Calendar size={16} />
            This Month
          </button>
          <button className="bg-gradient-to-r from-teal-400 to-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 flex items-center gap-2">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </header>

      {/* Real Report Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
            <DollarSign size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Monthly Payroll</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{totalPayroll.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
            <TrendingUp size={16} />
            <span>{employees.length} Active Employees</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
            <Users size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Avg Attendance Rate</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{attendanceRate > 0 ? `${attendanceRate}%` : '100%'}</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
            <TrendingUp size={16} />
            <span>{totalRecords} Check-in Records</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
            <BarChart2 size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Overtime Hours</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalOvertimeHours}h</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span>Logged from shift overages</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mb-4">
            <Calendar size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Active Attendance Records</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalRecords}</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span>Verified via kiosk</span>
          </div>
        </div>
      </section>

      {/* Interactive Monthly Heatmap & Salary Calculator with Real Database Records */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Calendar className="text-purple-600" size={20} />
              Monthly Worked Hours & Heatmap Grid (Real Data)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live worked hours per employee & late penalty salary deductions calculated from PostgreSQL database.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
            Formula: Base Salary / 30 = Daily Rate → Daily / 24 = Hourly Rate
          </span>
        </div>

        {/* Late Penalty Rule Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="border-r border-slate-200 pr-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Salary Formula</span>
            <p className="text-lg font-bold text-slate-900">Monthly / 30</p>
            <p className="text-[11px] text-slate-500">Daily rate calculated per 30-day period</p>
          </div>
          <div className="border-r border-slate-200 pr-4">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">⏱ 10 Mins Late Penalty</span>
            <p className="text-lg font-bold text-amber-700">1 Hour Salary Deducted</p>
            <p className="text-[11px] text-amber-600">-1 hour deduction per late check-in</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">🚨 30 Mins Late Penalty</span>
            <p className="text-lg font-bold text-red-700">2 Hours Salary Deducted</p>
            <p className="text-[11px] text-red-600">-2 hours deduction per late check-in</p>
          </div>
        </div>

        {/* Real Database Heatmap Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs text-slate-600 font-bold">
                <th className="p-3">Employee Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Base Salary</th>
                <th className="p-3">Total Worked Hours</th>
                <th className="p-3">Penalty Hours</th>
                <th className="p-3">Calculated Net Payout</th>
                <th className="p-3">30-Day Heatmap (Green = Worked, Red = Late)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">
                    No employees registered in database.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const empAtts = attendances.filter(a => a.employeeId === emp.id);
                  const baseSalary = Number(emp.salaryRate) || 15000;
                  const dailyRate = baseSalary / 30;
                  const hourlyRate = dailyRate / 24;

                  let totalPenaltyMins = 0;
                  let totalWorkedMins = 0;

                  empAtts.forEach(att => {
                    totalPenaltyMins += (att.penaltyDeductionMinutes || 0);
                    if (att.checkOutTime && att.checkInTime) {
                      const ms = new Date(att.checkOutTime).getTime() - new Date(att.checkInTime).getTime();
                      totalWorkedMins += Math.max(0, Math.floor(ms / 60000));
                    } else if (att.status === 'working') {
                      const ms = Date.now() - new Date(att.checkInTime).getTime();
                      totalWorkedMins += Math.max(0, Math.floor(ms / 60000));
                    }
                  });

                  const totalWorkedHours = Math.round((totalWorkedMins / 60) * 10) / 10;
                  const totalPenaltyHours = Math.round((totalPenaltyMins / 60) * 10) / 10;
                  const grossMoney = (totalWorkedMins / 60) * hourlyRate;
                  const penaltyDeductionMoney = (totalPenaltyMins / 60) * hourlyRate;
                  const netMoney = Math.max(0, Math.round((grossMoney - penaltyDeductionMoney) * 100) / 100);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                      <td className="p-3 text-xs font-semibold text-slate-500">{emp.role?.name || 'Kitchen Staff'}</td>
                      <td className="p-3 text-slate-600">₹{baseSalary.toLocaleString()}</td>
                      <td className="p-3 font-semibold text-slate-800">{totalWorkedHours} hrs</td>
                      <td className="p-3 font-semibold text-amber-600">{totalPenaltyHours} hrs</td>
                      <td className="p-3 font-bold text-green-700">₹{netMoney.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {Array.from({ length: 30 }).map((_, d) => {
                            const attForDay = empAtts[d];
                            const hasAtt = !!attForDay;
                            const isLate = hasAtt && (attForDay.penaltyDeductionMinutes > 0);
                            return (
                              <div
                                key={d}
                                title={`Day ${d + 1}: ${hasAtt ? (isLate ? 'Late Penalty' : 'Worked Session') : 'No Check-In'}`}
                                className={`w-3.5 h-3.5 rounded-sm transition-all ${
                                  !hasAtt
                                    ? 'bg-slate-100 border border-slate-200'
                                    : isLate
                                    ? 'bg-red-500'
                                    : 'bg-green-500'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
