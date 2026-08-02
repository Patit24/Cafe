'use client';
import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const [payRes, attRes] = await Promise.all([
        fetch(API_BASE_URL + '/payroll'),
        fetch(API_BASE_URL + '/attendance'),
      ]);
      const data = await payRes.json();
      const attData = await attRes.json();
      if (Array.isArray(data)) {
        setPayrollRecords(data);
      } else {
        console.error('Invalid payroll data:', data);
        setPayrollRecords([]);
      }
      if (Array.isArray(attData)) {
        setAttendances(attData);
      }
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      await fetch(API_BASE_URL + '/payroll/generate-all', { method: 'POST' });
      await fetchPayroll();
    } catch (error) {
      console.error('Failed to generate payroll:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/payroll/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      fetchPayroll();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleRevertStatus = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/payroll/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'generated' }),
      });
      fetchPayroll();
    } catch (error) {
      console.error('Failed to revert status:', error);
    }
  };

  const openEmployeeProfile = (record: any, empName: string, empCode: string, baseVal: number, workHrs: number, netVal: number, penaltyVal: number, otHrs: number, empAtts: any[], daysWorkedCount: number) => {
    const monthlySalary = baseVal || 15000;
    const dailyRate = Math.round((monthlySalary / 30) * 100) / 100;
    const hourlyRate = Math.round((dailyRate / 24) * 100) / 100;

    const startDate = record.periodStart ? new Date(record.periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const daysLedger = [];
    for (let i = 0; i < 30; i++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + i);
      const dateStr = curDate.toISOString().split('T')[0];
      const displayDate = curDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

      const dayAtts = empAtts.filter(a => {
        const attDateStr = a.date ? a.date.toString() : a.checkInTime ? a.checkInTime.toString() : '';
        return attDateStr.startsWith(dateStr);
      });

      let dayMinutes = 0;
      let dayPenaltyMins = 0;
      let checkInDisplay = '-';
      let checkOutDisplay = '-';
      let isWorking = false;
      let isCompleted = false;

      if (dayAtts.length > 0) {
        dayAtts.forEach((att: any, idx: number) => {
          if (idx === 0 && att.checkInTime) {
            checkInDisplay = new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          if (att.checkOutTime) {
            checkOutDisplay = new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          if (att.status === 'working' || att.status === 'on_break') {
            isWorking = true;
            checkOutDisplay = 'Active In Progress';
          }
          if (att.status === 'completed') {
            isCompleted = true;
          }

          if (att.penaltyDeductionMinutes && !isNaN(att.penaltyDeductionMinutes)) {
            dayPenaltyMins += Number(att.penaltyDeductionMinutes);
          }

          if (att.checkOutTime && att.checkInTime) {
            const ms = new Date(att.checkOutTime).getTime() - new Date(att.checkInTime).getTime();
            dayMinutes += Math.max(0, Math.floor(ms / 60000));
          } else if ((att.status === 'working' || att.status === 'on_break') && att.checkInTime) {
            const ms = Date.now() - new Date(att.checkInTime).getTime();
            dayMinutes += Math.max(0, Math.floor(ms / 60000));
          } else if (att.regularMinutes && att.regularMinutes > 0) {
            dayMinutes += att.regularMinutes;
          }
        });
      }

      const dayHours = Math.round((dayMinutes / 60) * 100) / 100;
      const penaltyMoney = Math.round(((dayPenaltyMins / 60) * hourlyRate) * 100) / 100;
      const grossMoney = Math.round((dayHours * hourlyRate) * 100) / 100;
      const netMoney = Math.max(0, Math.round((grossMoney - penaltyMoney) * 100) / 100);

      let statusBadge = { text: '⚪ Not Started / Off', color: 'bg-slate-800 text-slate-400 border-slate-700' };
      if (isWorking) {
        statusBadge = { text: '🟢 Actively Working', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' };
      } else if (dayAtts.length > 0 || dayHours > 0) {
        statusBadge = { text: '✓ Duty Completed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      } else if (curDate.getTime() > Date.now()) {
        statusBadge = { text: '⏳ Upcoming Shift', color: 'bg-slate-800/50 text-slate-500 border-slate-700/50' };
      }

      daysLedger.push({
        dayNumber: i + 1,
        dateStr: displayDate,
        dayHours,
        dayPenaltyMins,
        penaltyMoney,
        netMoney,
        checkInDisplay,
        checkOutDisplay,
        statusBadge,
      });
    }

    setSelectedEmployee({
      empName,
      empCode,
      baseVal: monthlySalary,
      dailyRate,
      hourlyRate,
      workHrs,
      netVal,
      penaltyVal,
      daysWorkedCount,
      daysLedger,
      periodStart: startDate.toLocaleDateString(),
    });
  };

  // KPIs
  const kpis = useMemo(() => {
    let totalBase = 0;
    let totalEarned = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let paidCount = 0;
    let pendingCount = 0;

    payrollRecords.forEach(r => {
      const monthlySalary = Number(r.employee?.salaryRate || r.baseSalary || 0);
      const workHrs = Number(r.totalWorkingHours || 0);
      const ot = Number(r.overtimePay || 0);
      const pen = Number(r.penaltyDeductions || 0);

      const hourlyRate = (monthlySalary / 30) / 24;
      const earned = Math.round(workHrs * hourlyRate + ot);
      const net = Math.max(0, earned - pen);

      totalBase += monthlySalary;
      totalEarned += earned;
      totalDeductions += pen;
      totalNet += net;

      if (r.status === 'paid') paidCount++;
      else pendingCount++;
    });

    return { totalBase, totalEarned, totalDeductions, totalNet, paidCount, pendingCount };
  }, [payrollRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return payrollRecords.filter(r => {
      const name = (r.employee?.name || '').toLowerCase();
      const code = (r.employee?.employeeCode || r.employeeId || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());
      
      if (filterStatus === 'pending' && r.status === 'paid') return false;
      if (filterStatus === 'paid' && r.status !== 'paid') return false;
      return matchesSearch;
    });
  }, [payrollRecords, searchTerm, filterStatus]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8 lg:p-10 font-sans">
      {/* Top Header Navigation */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/60 transition-all">
            <span>←</span> Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Payroll &amp; Financial Ledger</span>
            <span className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
              Current Cycle
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 font-medium max-w-2xl">
            Review employee working hours, calculated earnings, automated late arrival deductions, and issue salary settlements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleGenerateAll}
            disabled={generating}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 disabled:opacity-50 transition-all flex items-center gap-2.5 whitespace-nowrap active:scale-95 border border-indigo-400/20"
          >
            <span className="text-lg">{generating ? '⌛' : '⚡'}</span>
            <span>{generating ? 'Re-calculating...' : 'Re-calculate Payroll'}</span>
          </button>
          <button className="bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold px-5 py-2.5 rounded-xl text-sm border border-slate-700 transition-all whitespace-nowrap active:scale-95 shadow-xs">
            📤 Export Report (.CSV)
          </button>
        </div>
      </header>

      {/* KPI Overview Summary Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Base Salaries</span>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-lg">📁</span>
          </div>
          <p className="text-3xl font-black text-white mt-2">₹{kpis.totalBase.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
            <span>Across {payrollRecords.length} active staff members</span>
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Work Amount (Earned)</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-lg">💰</span>
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-2">₹{kpis.totalEarned.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
            <span>Computed from actual worked hours</span>
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Late &amp; Penalty Deductions</span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg text-lg">⚠️</span>
          </div>
          <p className="text-3xl font-black text-rose-400 mt-2">-₹{kpis.totalDeductions.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
            <span>Automated arrival deduction totals</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">Net Payable Salaries</span>
            <span className="p-2 bg-indigo-400/20 text-indigo-300 rounded-lg text-lg">💎</span>
          </div>
          <p className="text-3xl font-black text-white mt-2">₹{kpis.totalNet.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-3 text-xs mt-1.5 font-bold text-slate-300">
            <span className="text-emerald-400">✓ {kpis.paidCount} Paid</span>
            <span>•</span>
            <span className="text-amber-400">⏳ {kpis.pendingCount} Pending</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Action Bar */}
      <section className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            All Staff ({payrollRecords.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            ⏳ Pending Payment ({kpis.pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filterStatus === 'paid'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            ✓ Paid &amp; Cleared ({kpis.paidCount})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Employee Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pl-10"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2 text-slate-500 hover:text-white text-sm font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* Main Table Container */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden mb-8">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <th className="py-4 px-6 whitespace-nowrap">Employee</th>
                <th className="py-4 px-4 whitespace-nowrap">Cycle Period</th>
                <th className="py-4 px-4 whitespace-nowrap">Duty &amp; Hours</th>
                <th className="py-4 px-4 whitespace-nowrap">Earned Pay</th>
                <th className="py-4 px-4 whitespace-nowrap">Base Salary</th>
                <th className="py-4 px-4 whitespace-nowrap">Late Deductions</th>
                <th className="py-4 px-4 whitespace-nowrap">Net Salary (INR)</th>
                <th className="py-4 px-4 whitespace-nowrap">Status</th>
                <th className="py-4 px-6 text-right whitespace-nowrap">Actions &amp; Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400 font-medium animate-pulse">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading payroll calculations and employee ledgers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400">
                    <p className="text-base font-semibold">No employee records match your current criteria.</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or click &ldquo;⚡ Re-calculate Payroll&rdquo; above.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const empName = record.employee?.name || 'Unnamed Employee';
                  const empCode = record.employee?.employeeCode || record.employeeId || 'ID N/A';
                  const monthlySalary = Number(record.employee?.salaryRate || record.baseSalary || 15000);
                  const dailyRate = monthlySalary / 30;
                  const hourlyRate = dailyRate / 24;
                  const baseVal = monthlySalary;
                  let workHrs = Number(record.totalWorkingHours || 0);
                  const penaltyVal = Number(record.penaltyDeductions || 0);
                  const otHrs = Number(record.totalOvertimeHours || 0);
                  const otPay = Number(record.overtimePay || 0);

                  const empAtts = attendances.filter(a => a.employeeId === record.employeeId);
                  const totalPenaltyMins = empAtts.reduce((sum, a) => sum + (Number((a as any).penaltyDeductionMinutes || (a as any).penaltyMinutes) || 0), 0);
                  const uniqueDays = new Set(empAtts.map(a => {
                    const dateStr = a.date ? a.date.toString() : a.checkInTime ? a.checkInTime.toString() : '';
                    return dateStr.split('T')[0];
                  }).filter(d => d.length > 0));
                  const daysWorkedCount = Math.max(uniqueDays.size, workHrs > 0 ? 1 : 0);

                  if (record.status !== 'paid' && attendances.length > 0) {
                    let totalWorkedMins = 0;
                    empAtts.forEach(att => {
                      if (att.checkOutTime && att.checkInTime) {
                        const ms = new Date(att.checkOutTime).getTime() - new Date(att.checkInTime).getTime();
                        totalWorkedMins += Math.max(0, Math.floor(ms / 60000));
                      } else if (att.status === 'working' && att.checkInTime) {
                        const ms = Date.now() - new Date(att.checkInTime).getTime();
                        totalWorkedMins += Math.max(0, Math.floor(ms / 60000));
                      } else if (att.regularMinutes && att.regularMinutes > 0) {
                        totalWorkedMins += att.regularMinutes;
                      }
                    });
                    const computedHrs = Math.round((totalWorkedMins / 60) * 10) / 10;
                    if (computedHrs > workHrs) {
                      workHrs = computedHrs;
                    }
                  }

                  const workAmount = Math.round(workHrs * hourlyRate + otPay);
                  const netVal = record.status === 'paid' ? Number(record.netSalary || 0) : Math.max(0, Math.round(workAmount - penaltyVal));
                  const initials = empName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr key={record.id} className="hover:bg-slate-750/70 transition-colors group">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                              {empName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              ID: {empCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-300 font-medium">
                        <div className="bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-700/60 inline-flex items-center gap-1.5 font-mono text-[12px]">
                          <span>🗓️</span>
                          <span>{new Date(record.periodStart).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                          <span>–</span>
                          <span>{new Date(record.periodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-md text-xs font-bold font-mono">
                            Day {daysWorkedCount} / 30
                          </span>
                          <span className="font-extrabold text-white text-sm">
                            {workHrs.toFixed(1)} hrs
                          </span>
                        </div>
                        {otHrs > 0 && (
                          <div className="text-[11px] text-teal-400 font-semibold mt-1 flex items-center gap-1">
                            <span>+ {otHrs.toFixed(1)} hrs Overtime</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-black text-emerald-400 text-base">
                          ₹{workAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Earned ({workHrs.toFixed(1)}h)
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-300">
                        ₹{baseVal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {penaltyVal > 0 || totalPenaltyMins > 0 ? (
                          <div className="inline-flex flex-col items-start bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                            <span className="text-rose-400 font-bold text-sm">-₹{penaltyVal.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-rose-300/90 font-black uppercase tracking-wide">
                              ⚠️ {totalPenaltyMins}m Late Entry
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/50 text-xs font-medium">
                            ₹0 (No Deductions)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-black text-white text-lg tracking-tight bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 inline-block shadow-sm">
                          ₹{netVal.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {record.status === 'paid' ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Paid &amp; Cleared</span>
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            <span>Pending Payment</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEmployeeProfile(record, empName, empCode, baseVal, workHrs, netVal, penaltyVal, otHrs, empAtts, daysWorkedCount)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-600 inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                          >
                            <span>📊 Ledger</span>
                          </button>
                          {record.status !== 'paid' ? (
                            <button 
                              onClick={() => handleMarkAsPaid(record.id)}
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all inline-flex items-center gap-1.5 whitespace-nowrap border border-emerald-400/20"
                            >
                              <span>✓ Release Pay</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleRevertStatus(record.id)}
                              className="bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 px-2.5 py-2 rounded-xl text-xs font-medium transition-all"
                              title="Revert to Pending Payment"
                            >
                              Revert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading payroll calculations...</span>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-semibold">No employee records match your current criteria.</p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const empName = record.employee?.name || 'Unnamed Employee';
              const empCode = record.employee?.employeeCode || record.employeeId || 'ID N/A';
              const monthlySalary = Number(record.employee?.salaryRate || record.baseSalary || 15000);
              const dailyRate = monthlySalary / 30;
              const hourlyRate = dailyRate / 24;
              const baseVal = monthlySalary;
              let workHrs = Number(record.totalWorkingHours || 0);
              const penaltyVal = Number(record.penaltyDeductions || 0);
              const otHrs = Number(record.totalOvertimeHours || 0);
              const otPay = Number(record.overtimePay || 0);

              const empAtts = attendances.filter(a => a.employeeId === record.employeeId);
              const totalPenaltyMins = empAtts.reduce((sum, a) => sum + (Number((a as any).penaltyDeductionMinutes || (a as any).penaltyMinutes) || 0), 0);
              const uniqueDays = new Set(empAtts.map(a => {
                const dateStr = a.date ? a.date.toString() : a.checkInTime ? a.checkInTime.toString() : '';
                return dateStr.split('T')[0];
              }).filter(d => d.length > 0));
              const daysWorkedCount = Math.max(uniqueDays.size, workHrs > 0 ? 1 : 0);

              if (record.status !== 'paid' && attendances.length > 0) {
                let totalWorkedMins = 0;
                empAtts.forEach(att => {
                  if (att.checkOutTime && att.checkInTime) {
                    const ms = new Date(att.checkOutTime).getTime() - new Date(att.checkInTime).getTime();
                    totalWorkedMins += Math.max(0, Math.floor(ms / 60000));
                  } else if (att.status === 'working' && att.checkInTime) {
                    const ms = Date.now() - new Date(att.checkInTime).getTime();
                    totalWorkedMins += Math.max(0, Math.floor(ms / 60000));
                  } else if (att.regularMinutes && att.regularMinutes > 0) {
                    totalWorkedMins += att.regularMinutes;
                  }
                });
                const computedHrs = Math.round((totalWorkedMins / 60) * 10) / 10;
                if (computedHrs > workHrs) {
                  workHrs = computedHrs;
                }
              }

              const workAmount = Math.round(workHrs * hourlyRate + otPay);
              const netVal = record.status === 'paid' ? Number(record.netSalary || 0) : Math.max(0, Math.round(workAmount - penaltyVal));
              const initials = empName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div key={record.id} className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{empName}</h4>
                        <p className="text-xs text-slate-400 font-mono">ID: {empCode}</p>
                      </div>
                    </div>
                    {record.status === 'paid' ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        Paid
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/50 text-center">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Worked</span>
                      <span className="font-extrabold text-white text-sm">{workHrs.toFixed(1)}h</span>
                      <span className="text-[10px] text-indigo-300 block">Day {daysWorkedCount}/30</span>
                    </div>
                    <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/50 text-center">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Base Pay</span>
                      <span className="font-extrabold text-slate-200 text-sm">₹{baseVal.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/50 text-center">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Deductions</span>
                      <span className="font-extrabold text-rose-400 text-sm">-₹{penaltyVal.toLocaleString()}</span>
                      {totalPenaltyMins > 0 && <span className="text-[10px] text-rose-300 block">{totalPenaltyMins}m late</span>}
                    </div>
                    <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/50 text-center bg-gradient-to-br from-indigo-950/50 to-slate-800">
                      <span className="text-indigo-300 block text-[10px] font-bold uppercase">Net Pay</span>
                      <span className="font-black text-emerald-400 text-sm">₹{netVal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => openEmployeeProfile(record, empName, empCode, baseVal, workHrs, netVal, penaltyVal, otHrs, empAtts, daysWorkedCount)}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 py-2.5 rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>📊 Ledger</span>
                    </button>
                    {record.status !== 'paid' ? (
                      <button 
                        onClick={() => handleMarkAsPaid(record.id)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <span>✓ Release Pay</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRevertStatus(record.id)}
                        className="px-4 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 py-2.5 rounded-xl text-xs font-medium transition-all"
                      >
                        Revert
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 30-Day Day-by-Day Employee Ledger Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950/80">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xl w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
                  {selectedEmployee.empName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                    <span>{selectedEmployee.empName}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">
                      ● Active Staff
                    </span>
                  </h2>
                  <p className="text-slate-400 text-xs font-mono mt-1">
                    ID: {selectedEmployee.empCode} • Cycle Starting: {selectedEmployee.periodStart}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2.5 rounded-xl border border-slate-700 transition-all text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Pay Formula Strip */}
            <div className="bg-indigo-950/40 px-6 py-3.5 border-b border-indigo-500/30 flex flex-wrap items-center justify-between text-xs gap-4 font-mono">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <span>⚡ Formula: Base Salary ÷ 30 Days = Daily Rate ÷ 24 Hours = Hourly Rate</span>
              </div>
              <div className="flex items-center gap-4 font-extrabold text-slate-200">
                <span>Base: <strong className="text-white">₹{selectedEmployee.baseVal.toLocaleString('en-IN')}</strong></span>
                <span className="text-slate-600">|</span>
                <span>Daily: <strong className="text-indigo-300">₹{selectedEmployee.dailyRate}/day</strong></span>
                <span className="text-slate-600">|</span>
                <span className="bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-300">
                  Rate: <strong>₹{selectedEmployee.hourlyRate}/hr</strong>
                </span>
              </div>
            </div>

            {/* Summary Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900/90 border-b border-slate-800">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Days Completed</p>
                <p className="text-2xl font-black text-white mt-1">Day {selectedEmployee.daysWorkedCount} <span className="text-sm font-medium text-slate-400">/ 30</span></p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Working Hours</p>
                <p className="text-2xl font-black text-indigo-400 mt-1">{selectedEmployee.workHrs.toFixed(1)} hrs</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Late Penalties</p>
                <p className="text-2xl font-black text-rose-400 mt-1">-₹{selectedEmployee.penaltyVal.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-gradient-to-r from-emerald-900/60 to-slate-800 p-4 rounded-xl border border-emerald-500/30">
                <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Net Earned Salary</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">₹{selectedEmployee.netVal.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* 30-Day Table Ledger */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>📅 30-Day Attendance &amp; Earnings Ledger</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">Complete daily breakdown</span>
              </div>
              <div className="space-y-3">
                {/* Desktop/Tablet Table View */}
                <div className="hidden md:block border border-slate-700/80 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase sticky top-0 shadow-md border-b border-slate-800">
                      <tr>
                        <th className="p-3.5 whitespace-nowrap">Day</th>
                        <th className="p-3.5 whitespace-nowrap">Date</th>
                        <th className="p-3.5 whitespace-nowrap">Duty Status</th>
                        <th className="p-3.5 whitespace-nowrap">In → Out</th>
                        <th className="p-3.5 whitespace-nowrap">Hours</th>
                        <th className="p-3.5 whitespace-nowrap">Rate</th>
                        <th className="p-3.5 whitespace-nowrap">Late Penalty</th>
                        <th className="p-3.5 text-right whitespace-nowrap">Earned Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedEmployee.daysLedger.map((day: any) => {
                        const isActive = day.dayHours > 0 || day.statusBadge.text.includes('Working') || day.statusBadge.text.includes('Completed');
                        return (
                          <tr 
                            key={day.dayNumber} 
                            className={isActive ? "bg-slate-800/60 hover:bg-slate-800 text-slate-100 transition-colors" : "bg-slate-900/40 text-slate-500"}
                          >
                            <td className="p-3.5 font-bold font-mono text-slate-300 whitespace-nowrap">Day {day.dayNumber}</td>
                            <td className="p-3.5 font-medium whitespace-nowrap">{day.dateStr}</td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap ${day.statusBadge.color}`}>
                                {day.statusBadge.text}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                              {day.checkInDisplay !== '-' ? `${day.checkInDisplay} → ${day.checkOutDisplay}` : '—'}
                            </td>
                            <td className="p-3.5 font-extrabold text-white whitespace-nowrap">
                              {day.dayHours.toFixed(1)} hrs
                            </td>
                            <td className="p-3.5 text-slate-400 font-mono text-xs whitespace-nowrap">
                              ₹{selectedEmployee.hourlyRate}/h
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {day.penaltyMoney > 0 ? (
                                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-xs">
                                  -₹{day.penaltyMoney} ({day.dayPenaltyMins}m late)
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">None</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-black text-emerald-400 text-sm font-mono whitespace-nowrap">
                              ₹{day.netMoney.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Daily List View */}
                <div className="md:hidden space-y-2.5">
                  {selectedEmployee.daysLedger.map((day: any) => {
                    const isActive = day.dayHours > 0 || day.statusBadge.text.includes('Working') || day.statusBadge.text.includes('Completed');
                    return (
                      <div 
                        key={day.dayNumber}
                        className={`p-3.5 rounded-xl border ${isActive ? 'bg-slate-800/80 border-slate-700 text-slate-100 shadow-md' : 'bg-slate-900/60 border-slate-800/60 text-slate-500'}`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                              Day {day.dayNumber}
                            </span>
                            <span className="font-semibold text-xs text-white">{day.dateStr}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${day.statusBadge.color}`}>
                            {day.statusBadge.text}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div className="bg-slate-900/50 p-2 rounded-lg text-center border border-slate-800/60">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Hours &amp; Times</span>
                            <span className="font-extrabold text-white text-xs">{day.dayHours.toFixed(1)}h</span>
                            <span className="text-[9px] text-slate-400 block truncate">{day.checkInDisplay !== '-' ? `${day.checkInDisplay} → ${day.checkOutDisplay}` : '—'}</span>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded-lg text-center border border-slate-800/60">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Late Penalty</span>
                            {day.penaltyMoney > 0 ? (
                              <>
                                <span className="font-bold text-rose-400 text-xs">-₹{day.penaltyMoney}</span>
                                <span className="text-[9px] text-rose-300/80 block">{day.dayPenaltyMins}m late</span>
                              </>
                            ) : (
                              <span className="font-medium text-slate-500 text-xs block mt-1">₹0 (On time)</span>
                            )}
                          </div>
                          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/80 p-2 rounded-lg text-center border border-slate-800/80">
                            <span className="text-indigo-300 block text-[9px] uppercase font-bold">Earned Pay</span>
                            <span className="font-black text-emerald-400 text-sm block mt-0.5">₹{day.netMoney.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm active:scale-95"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
