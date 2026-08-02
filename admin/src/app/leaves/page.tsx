'use client';
import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'paid'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      const res = await fetch(API_BASE_URL + '/leaves');
      const data = await res.json();
      if (Array.isArray(data)) setLeaves(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(API_BASE_URL + '/employees');
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, []);

  const handleSaveLeave = async () => {
    if (!newLeave.employeeId || !newLeave.startDate || !newLeave.endDate) return;
    setIsSubmitting(true);

    try {
      await fetch(API_BASE_URL + '/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave)
      });
      fetchLeaves();
      setIsModalOpen(false);
      setNewLeave({
        employeeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        type: 'paid'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave?')) return;
    try {
      await fetch(`${API_BASE_URL}/leaves/${id}`, { method: 'DELETE' });
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 relative">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Leave Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage employee leaves (Paid/Unpaid).</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
          <Link href="/" className="flex-1 sm:flex-none text-center bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Back to Dashboard
          </Link>
          <button 
            className="flex-1 sm:flex-none text-center bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
            onClick={() => setIsModalOpen(true)}
          >
            + Assign Leave
          </button>
        </div>
      </header>

      <section>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/60 text-xs text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4 border-b border-slate-700/80">Employee</th>
                <th className="p-4 border-b border-slate-700/80">Type</th>
                <th className="p-4 border-b border-slate-700/80">Start Date</th>
                <th className="p-4 border-b border-slate-700/80">End Date</th>
                <th className="p-4 border-b border-slate-700/80">Reason</th>
                <th className="p-4 border-b border-slate-700/80">Status</th>
                <th className="p-4 border-b border-slate-700/80 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-200 divide-y divide-slate-700/60">
              {leaves.map(leave => (
                <tr key={leave.id} className="hover:bg-slate-700/40 transition-colors">
                  <td className="p-4 font-bold text-white">{leave.employee?.name || 'Unknown'}</td>
                  <td className="p-4 capitalize">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      leave.type === 'paid' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {leave.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-300">{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td className="p-4 max-w-[200px] truncate text-slate-400">{leave.reason || '-'}</td>
                  <td className="p-4 capitalize">
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                      {leave.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(leave.id)} className="text-red-400 hover:text-red-300 font-semibold text-xs transition-colors px-2 py-1 rounded hover:bg-red-500/10">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No leaves assigned yet. Click "+ Assign Leave" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {leaves.map(leave => (
            <div key={leave.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-white">{leave.employee?.name || 'Unknown'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Reason: <span className="text-slate-200">{leave.reason || 'None provided'}</span></p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                    leave.type === 'paid' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {leave.type}
                  </span>
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                    {leave.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Start Date</span>
                  <span className="font-semibold text-slate-200">{new Date(leave.startDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">End Date</span>
                  <span className="font-semibold text-slate-200">{new Date(leave.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-slate-700/50 pt-2.5 mt-0.5">
                <button 
                  onClick={() => handleDelete(leave.id)} 
                  className="text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Delete Leave
                </button>
              </div>
            </div>
          ))}
          {leaves.length === 0 && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 text-center text-slate-400 font-medium">
              No leaves assigned yet. Tap "+ Assign Leave" to add one.
            </div>
          )}
        </div>
      </section>

      {/* Assign Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Assign Leave</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Employee</label>
                <select 
                  value={newLeave.employeeId}
                  onChange={(e) => setNewLeave({...newLeave, employeeId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Leave Type</label>
                <select 
                  value={newLeave.type}
                  onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Reason (Optional)</label>
                <input 
                  type="text" 
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                  placeholder="e.g. Sick Leave, Medical Emergency"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-700/80">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveLeave}
                disabled={isSubmitting || !newLeave.employeeId || !newLeave.startDate || !newLeave.endDate}
                className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Assign Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
