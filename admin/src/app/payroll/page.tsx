'use client';
import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/payroll');
      const data = await response.json();
      if (Array.isArray(data)) {
        setPayrollRecords(data);
      } else {
        console.error('Invalid payroll data:', data);
        setPayrollRecords([]);
      }
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
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
          <button className="bg-gradient-to-r from-teal-400 to-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90">
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
                <th className="p-4 border-b border-gray-100">Working Hours</th>
                <th className="p-4 border-b border-gray-100">Base Salary</th>
                <th className="p-4 border-b border-gray-100">Penalty Deductions</th>
                <th className="p-4 border-b border-gray-100">Net Salary (INR)</th>
                <th className="p-4 border-b border-gray-100">Status</th>
                <th className="p-4 border-b border-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">Loading payroll...</td>
                </tr>
              ) : payrollRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">No payroll records found. Please generate payroll first.</td>
                </tr>
              ) : (
                payrollRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b border-gray-100">
                      <div className="font-bold text-gray-900">{record.employee?.firstName} {record.employee?.lastName}</div>
                      <div className="text-xs text-gray-500">{record.employeeId}</div>
                    </td>
                    <td className="p-4 border-b border-gray-100">
                      {new Date(record.periodStart).toLocaleDateString()} - {new Date(record.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="p-4 border-b border-gray-100">
                      <div className="font-medium">{record.totalWorkingHours.toFixed(2)} hrs</div>
                      {record.totalOvertimeHours > 0 && (
                        <div className="text-xs text-blue-500">+{record.totalOvertimeHours.toFixed(2)} OT hrs</div>
                      )}
                    </td>
                    <td className="p-4 border-b border-gray-100">
                      ₹{record.baseSalary.toLocaleString()}
                    </td>
                    <td className="p-4 border-b border-gray-100">
                      {record.penaltyDeductions > 0 ? (
                        <span className="text-red-500 font-semibold">-₹{record.penaltyDeductions.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="p-4 border-b border-gray-100">
                      <div className="font-bold text-gray-900">₹{record.netSalary.toLocaleString()}</div>
                    </td>
                    <td className="p-4 border-b border-gray-100">
                      {record.status === 'paid' ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium border border-green-200">Paid / Complete</span>
                      ) : record.status === 'generated' ? (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200">Pending</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">{record.status}</span>
                      )}
                    </td>
                    <td className="p-4 border-b border-gray-100 text-right">
                      {record.status !== 'paid' && (
                        <button 
                          onClick={() => handleMarkAsPaid(record.id)}
                          className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 shadow-sm"
                        >
                          Salary Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
