'use client';
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
      const res = await fetch('http://localhost:3001/leaves');
      const data = await res.json();
      if (Array.isArray(data)) setLeaves(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:3001/employees');
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
      await fetch('http://localhost:3001/leaves', {
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
      await fetch(`http://localhost:3001/leaves/${id}`, { method: 'DELETE' });
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8 relative">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-lg font-bold text-primary">Leave Management</h1>
          <p className="text-body-md text-on-surface-variant">Manage employee leaves (Paid/Unpaid).</p>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md">
            Back to Dashboard
          </Link>
          <button 
            className="bg-primary text-on-primary px-6 py-3 rounded text-label-md hover:opacity-90 transition-opacity"
            onClick={() => setIsModalOpen(true)}
          >
            + Assign Leave
          </button>
        </div>
      </header>

      <section>
        <div className="bg-surface-container-low rounded-lg border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container text-label-md text-on-surface-variant">
              <tr>
                <th className="p-4 border-b border-outline-variant">Employee</th>
                <th className="p-4 border-b border-outline-variant">Type</th>
                <th className="p-4 border-b border-outline-variant">Start Date</th>
                <th className="p-4 border-b border-outline-variant">End Date</th>
                <th className="p-4 border-b border-outline-variant">Reason</th>
                <th className="p-4 border-b border-outline-variant">Status</th>
                <th className="p-4 border-b border-outline-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-on-surface">
              {leaves.map(leave => (
                <tr key={leave.id} className="hover:bg-surface-container-highest transition-colors">
                  <td className="p-4 border-b border-outline-variant font-medium">{leave.employee?.name || 'Unknown'}</td>
                  <td className="p-4 border-b border-outline-variant capitalize">{leave.type}</td>
                  <td className="p-4 border-b border-outline-variant">{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td className="p-4 border-b border-outline-variant">{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td className="p-4 border-b border-outline-variant max-w-[200px] truncate">{leave.reason || '-'}</td>
                  <td className="p-4 border-b border-outline-variant capitalize">
                    <span className="bg-[#2D9CDB]/10 text-[#2D9CDB] px-3 py-1 rounded-full text-label-sm">{leave.status}</span>
                  </td>
                  <td className="p-4 border-b border-outline-variant text-right">
                    <button onClick={() => handleDelete(leave.id)} className="text-error font-medium hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500 py-8">
                    No leaves assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assign Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-xl p-8 w-[500px] shadow-lg border border-outline-variant">
            <h2 className="text-headline-md font-bold text-primary mb-6">Assign Leave</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1">Employee</label>
                <select 
                  value={newLeave.employeeId}
                  onChange={(e) => setNewLeave({...newLeave, employeeId: e.target.value})}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md text-on-surface-variant mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})}
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface-variant mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})}
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-1">Leave Type</label>
                <select 
                  value={newLeave.type}
                  onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                >
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-1">Reason (Optional)</label>
                <input 
                  type="text" 
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                  placeholder="e.g. Sick Leave"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveLeave}
                disabled={isSubmitting || !newLeave.employeeId || !newLeave.startDate || !newLeave.endDate}
                className="bg-primary text-on-primary px-6 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
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
