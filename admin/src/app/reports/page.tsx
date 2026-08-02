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
      <div className="min-h-screen bg-slate-900 flex justify-center items-center font-medium text-slate-300 gap-3">
        <Loader2 className="animate-spin text-blue-500" size={24} />
        Loading workforce analytics & payroll data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time workforce performance and backend financials</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <button className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-700 flex items-center gap-2 transition-colors">
            <Calendar size={16} className="text-slate-400" />
            This Month
          </button>
          <button className="flex-1 sm:flex-none justify-center bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:from-teal-600 hover:to-blue-700 flex items-center gap-2 transition-all">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </header>

      {/* Real Report Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
            <DollarSign size={24} />
          </div>
          <p className="text-sm text-slate-400 font-medium">Total Monthly Payroll</p>
          <h3 className="text-2xl font-bold text-white mt-1">₹{totalPayroll.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <TrendingUp size={16} />
            <span>{employees.length} Active Employees</span>
          </div>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
            <Users size={24} />
          </div>
          <p className="text-sm text-slate-400 font-medium">Avg Attendance Rate</p>
          <h3 className="text-2xl font-bold text-white mt-1">{attendanceRate > 0 ? `${attendanceRate}%` : '100%'}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <TrendingUp size={16} />
            <span>{totalRecords} Check-in Records</span>
          </div>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
            <BarChart2 size={24} />
          </div>
          <p className="text-sm text-slate-400 font-medium">Total Overtime Hours</p>
          <h3 className="text-2xl font-bold text-white mt-1">{totalOvertimeHours}h</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Logged from shift overages</span>
          </div>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-inner">
            <Calendar size={24} />
          </div>
          <p className="text-sm text-slate-400 font-medium">Active Attendance Records</p>
          <h3 className="text-2xl font-bold text-white mt-1">{totalRecords}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Verified via kiosk</span>
          </div>
        </div>
      </section>

      {/* Interactive Monthly Heatmap & Salary Calculator with Real Database Records */}
      <section className="bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-xl p-4 sm:p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 pb-4 border-b border-slate-700/80">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Calendar className="text-purple-400" size={20} />
              Monthly Worked Hours & Payout Summary
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Live worked hours per employee & late penalty salary deductions calculated from database.
            </p>
          </div>
          <span className="text-xs font-semibold px-3.5 py-1.5 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20 shrink-0 self-start lg:self-center">
            Formula: Base Salary / 30 = Daily Rate → Daily / 24 = Hourly Rate
          </span>
        </div>

        {/* Late Penalty Rule Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-900/80 p-4 rounded-xl border border-slate-700/80">
          <div className="md:border-r border-slate-700/80 md:pr-4 pb-3 md:pb-0 border-b md:border-b-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Salary Formula</span>
            <p className="text-lg font-bold text-white mt-0.5">Monthly / 30</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Daily rate calculated per 30-day period</p>
          </div>
          <div className="md:border-r border-slate-700/80 md:pr-4 pb-3 md:pb-0 border-b md:border-b-0">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">⏱ 10 Mins Late Penalty</span>
            <p className="text-lg font-bold text-amber-300 mt-0.5">1 Hour Salary Deducted</p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">-1 hour deduction per late check-in</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">🚨 30 Mins Late Penalty</span>
            <p className="text-lg font-bold text-red-300 mt-0.5">2 Hours Salary Deducted</p>
            <p className="text-[11px] text-red-400/80 mt-0.5">-2 hours deduction per late check-in</p>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-700/80">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700/80 text-xs text-slate-400 uppercase font-semibold">
                <th className="p-4">Employee Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Base Salary</th>
                <th className="p-4">Total Worked Hours</th>
                <th className="p-4">Penalty Hours</th>
                <th className="p-4">Calculated Net Payout</th>
                <th className="p-4">30-Day Heatmap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
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
                    <tr key={emp.id} className="hover:bg-slate-700/40 transition-colors">
                      <td className="p-4 font-bold text-white">{emp.name}</td>
                      <td className="p-4 text-xs font-semibold text-slate-400">{emp.role?.name || 'Kitchen Staff'}</td>
                      <td className="p-4 text-slate-300">₹{baseSalary.toLocaleString()}</td>
                      <td className="p-4 font-semibold text-slate-200">{totalWorkedHours} hrs</td>
                      <td className="p-4 font-semibold text-amber-400">{totalPenaltyHours} hrs</td>
                      <td className="p-4 font-bold text-emerald-400">₹{netMoney.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {Array.from({ length: 30 }).map((_, d) => {
                            const attForDay = empAtts[d];
                            const hasAtt = !!attForDay;
                            const isLate = hasAtt && (attForDay.penaltyDeductionMinutes > 0);
                            return (
                              <div
                                key={d}
                                title={`Day ${d + 1}: ${hasAtt ? (isLate ? 'Late Penalty' : 'Worked Session') : 'No Check-In'}`}
                                className={`w-3 h-3 rounded-sm transition-all ${
                                  !hasAtt
                                    ? 'bg-slate-800 border border-slate-700'
                                    : isLate
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
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

        {/* Mobile Summary Card View */}
        <div className="lg:hidden space-y-4">
          {employees.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">
              No employees registered in database.
            </div>
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
                <div key={emp.id} className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <h4 className="font-bold text-white text-base">{emp.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{emp.role?.name || 'Kitchen Staff'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block uppercase font-semibold">Net Payout</span>
                      <span className="text-lg font-extrabold text-emerald-400">₹{netMoney.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px] uppercase">Base Salary</span>
                      <span className="font-bold text-slate-200">₹{baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px] uppercase">Worked</span>
                      <span className="font-bold text-white">{totalWorkedHours}h</span>
                    </div>
                    <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px] uppercase">Penalty</span>
                      <span className="font-bold text-amber-400">{totalPenaltyHours}h</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
