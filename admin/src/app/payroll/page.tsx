'use client';
import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

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

    // Generate 30 days from start of period or month
    const startDate = record.periodStart ? new Date(record.periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const daysLedger = [];
    for (let i = 0; i < 30; i++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + i);
      const dateStr = curDate.toISOString().split('T')[0];
      const displayDate = curDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

      // Filter attendances for this calendar day
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

      let statusBadge = { text: '⚪ Not Started / Off', color: 'bg-gray-100 text-gray-600 border-gray-200' };
      if (isWorking) {
        statusBadge = { text: '🟢 Actively Working', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' };
      } else if (dayAtts.length > 0 || dayHours > 0) {
        statusBadge = { text: '✓ Day Duty Completed', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      } else if (curDate.getTime() > Date.now()) {
        statusBadge = { text: '⏳ Upcoming Shift', color: 'bg-slate-50 text-slate-400 border-slate-200' };
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-8">
      <header className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-blue-600 hover:underline text-sm font-medium">← Back to Dashboard</Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll & Deductions</h1>
          <p className="text-sm text-gray-500 mt-1">Reviewing late penalties for current cycle and finalizing salaries</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleGenerateAll}
            disabled={generating}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {generating ? '⏳ Calculating...' : '⚡ Re-calculate All Payroll'}
          </button>
          <button className="bg-gradient-to-r from-teal-400 to-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-all">
            Export Payroll
          </button>
        </div>
      </header>

      <section>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 border-b border-gray-100">Employee</th>
                <th className="p-4 border-b border-gray-100">Period</th>
                <th className="p-4 border-b border-gray-100">Duty Days Progress</th>
                <th className="p-4 border-b border-gray-100">Working Hours</th>
                <th className="p-4 border-b border-gray-100">Base Salary</th>
                <th className="p-4 border-b border-gray-100">Penalty Deductions</th>
                <th className="p-4 border-b border-gray-100">Net Salary (INR)</th>
                <th className="p-4 border-b border-gray-100">Status</th>
                <th className="p-4 border-b border-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500 font-medium">Loading payroll calculations...</td>
                </tr>
              ) : payrollRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500 font-medium">
                    No payroll records found for current employees. Click &ldquo;⚡ Re-calculate All Payroll&rdquo; above to generate immediately.
                  </td>
                </tr>
              ) : (
                payrollRecords.map((record) => {
                  const empName = record.employee?.name || 'Unnamed Employee';
                  const empCode = record.employee?.employeeCode || record.employeeId || 'ID N/A';
                  const baseVal = Number(record.baseSalary || record.employee?.salaryRate || 0);
                  let workHrs = Number(record.totalWorkingHours || 0);
                  const penaltyVal = Number(record.penaltyDeductions || 0);
                  const netVal = Number(record.netSalary || 0);
                  const otHrs = Number(record.totalOvertimeHours || 0);

                  const empAtts = attendances.filter(a => a.employeeId === record.employeeId);
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

                  return (
                    <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{empName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {empCode}</div>
                        <button 
                          onClick={() => openEmployeeProfile(record, empName, empCode, baseVal, workHrs, netVal, penaltyVal, otHrs, empAtts, daysWorkedCount)}
                          className="mt-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100/90 px-2.5 py-1.5 rounded-md transition-all border border-indigo-200/80 shadow-xs active:scale-95"
                        >
                          <span>📊 View 30-Day Day-by-Day Record →</span>
                        </button>
                      </td>
                      <td className="p-4 text-gray-600 font-medium">
                        {new Date(record.periodStart).toLocaleDateString()} - {new Date(record.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 inline-flex items-center gap-1.5 shadow-xs">
                          🗓️ Day {daysWorkedCount} of 30 Complete
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{workHrs.toFixed(1)} hrs</div>
                        {otHrs > 0 && (
                          <div className="text-xs text-blue-600 font-semibold mt-0.5">+{otHrs.toFixed(1)} OT hrs</div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        ₹{baseVal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        {penaltyVal > 0 ? (
                          <span className="text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-md border border-red-100 inline-block">
                            -₹{penaltyVal.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">None</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-black text-emerald-600 text-base">₹{netVal.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="p-4">
                        {record.status === 'paid' ? (
                          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 inline-flex items-center gap-1 shadow-xs">
                            ✓ Paid & Cleared
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 inline-flex items-center gap-1 shadow-xs">
                            ⏳ Pending Payment
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {record.status !== 'paid' ? (
                          <button 
                            onClick={() => handleMarkAsPaid(record.id)}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:from-emerald-700 hover:to-green-700 shadow-sm active:scale-95 transition-all inline-flex items-center gap-1 border border-emerald-500/20"
                          >
                            <span>✓ Mark as Paid (Payment Released)</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRevertStatus(record.id)}
                            className="text-gray-400 hover:text-red-600 text-xs font-medium underline transition-colors"
                          >
                            Revert to Pending
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 30-Day Day-by-Day Employee Ledger Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-slate-900 text-white">
              <div>
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-500 text-white font-extrabold text-lg w-12 h-12 rounded-xl flex items-center justify-center shadow-md">
                    {selectedEmployee.empName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      {selectedEmployee.empName}
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        Active Employee
                      </span>
                    </h2>
                    <p className="text-slate-300 text-xs font-mono mt-1">Employee ID: {selectedEmployee.empCode} • Cycle Starting: {selectedEmployee.periodStart}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl transition-colors font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Pay Formula Strip */}
            <div className="bg-indigo-50/80 px-6 py-3 border-b border-indigo-100 flex flex-wrap items-center justify-between text-xs gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-900">💵 Salary & Rate Calculation Formula:</span>
                <span className="text-indigo-700">Base Salary ÷ 30 Days = Daily Pay ÷ 24 Hours = Hourly Rate</span>
              </div>
              <div className="flex gap-4 font-extrabold text-slate-800">
                <span>Base: <strong className="text-indigo-700">₹{selectedEmployee.baseVal.toLocaleString('en-IN')}</strong></span>
                <span>•</span>
                <span>Daily: <strong className="text-indigo-700">₹{selectedEmployee.dailyRate}/day</strong></span>
                <span>•</span>
                <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-950 shadow-2xs">Per-Hour Rate: <strong className="text-emerald-700">₹{selectedEmployee.hourlyRate}/hr</strong></span>
              </div>
            </div>

            {/* Summary Metrics Row */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-gray-100">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Days Completed</p>
                <p className="text-2xl font-black text-slate-900 mt-1">Day {selectedEmployee.daysWorkedCount} <span className="text-sm font-semibold text-gray-500">of 30</span></p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Worked Hours</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{selectedEmployee.workHrs.toFixed(1)} hrs</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Late Penalty Deductions</p>
                <p className="text-2xl font-black text-rose-600 mt-1">-₹{selectedEmployee.penaltyVal.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Current Earned Salary</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">₹{selectedEmployee.netVal.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* 30-Day Table Ledger */}
            <div className="overflow-y-auto flex-1 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>🗓️ Complete 30-Day Day-by-Day Attendance & Earnings Ledger</span>
                <span className="text-xs font-normal text-gray-500">Showing all 30 days in cycle</span>
              </h3>
              <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase sticky top-0 shadow-xs">
                  <tr>
                    <th className="p-3 border-b border-gray-200">Day #</th>
                    <th className="p-3 border-b border-gray-200">Date</th>
                    <th className="p-3 border-b border-gray-200">Duty Status</th>
                    <th className="p-3 border-b border-gray-200">Check In → Out</th>
                    <th className="p-3 border-b border-gray-200">Hours Worked</th>
                    <th className="p-3 border-b border-gray-200">Hourly Rate</th>
                    <th className="p-3 border-b border-gray-200">Late Penalty</th>
                    <th className="p-3 border-b border-gray-200 text-right">Day&apos;s Earned Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedEmployee.daysLedger.map((day: any) => (
                    <tr key={day.dayNumber} className={day.dayHours > 0 || day.statusBadge.text.includes('Working') ? "bg-white hover:bg-emerald-50/30 transition-colors" : "bg-gray-50/50 text-gray-400"}>
                      <td className="p-3 font-bold text-gray-800 font-mono">Day {day.dayNumber}</td>
                      <td className="p-3 font-semibold text-gray-700">{day.dateStr}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${day.statusBadge.color}`}>
                          {day.statusBadge.text}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-600">
                        {day.checkInDisplay !== '-' ? `${day.checkInDisplay} → ${day.checkOutDisplay}` : '-'}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {day.dayHours.toFixed(1)} hrs
                      </td>
                      <td className="p-3 text-gray-600 font-medium text-xs">
                        ₹{selectedEmployee.hourlyRate}/hr
                      </td>
                      <td className="p-3">
                        {day.penaltyMoney > 0 ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-xs">
                            -₹{day.penaltyMoney} ({day.dayPenaltyMins}m late)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-600 text-sm">
                        ₹{day.netMoney.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all text-sm active:scale-95"
              >
                Close Day-by-Day Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

