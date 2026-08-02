'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [empRes, shiftRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employees`),
        fetch(`${API_BASE_URL}/shifts`).catch(() => null),
      ]);

      const empData = await empRes.json();
      if (Array.isArray(empData)) setEmployees(empData);

      if (shiftRes && shiftRes.ok) {
        const shiftData = await shiftRes.json();
        if (Array.isArray(shiftData)) setShifts(shiftData);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShiftChange = async (empId: string, newShiftId: string) => {
    const targetShiftId = newShiftId === 'shift-none' ? null : newShiftId;
    
    // Optimistic UI update
    setEmployees(prev => prev.map(emp => 
      emp.id === empId ? { ...emp, shiftId: targetShiftId } : emp
    ));

    try {
      await fetch(`${API_BASE_URL}/employees/${empId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: targetShiftId }),
      });
    } catch (err) {
      console.error('Failed to update employee shift:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/employees/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert('Failed to delete employee from database.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting employee.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const query = searchQuery.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(query) ||
      emp.employeeCode?.toLowerCase().includes(query) ||
      emp.role?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-8">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="text-purple-600" size={32} />
            Workforce Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage staff profiles, duty shifts, and face authentication credentials.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/employees/new"
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add Employee
          </Link>
        </div>
      </header>

      {/* Control Bar: Search & Stat Counter */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name, ID, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          Total Employees: <span className="text-purple-600 font-bold text-sm ml-1">{filteredEmployees.length}</span>
        </div>
      </div>

      {/* Main Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Employee ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Role / Position</th>
                <th className="p-4">Base Rate</th>
                <th className="p-4">Assigned Duty Hours</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <Loader2 className="animate-spin text-purple-600 inline mr-2" size={20} />
                    Loading workforce directory...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No employees found matching your query.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-xs font-mono font-bold text-purple-700 bg-purple-50/50 rounded-md w-fit m-2">
                      {emp.employeeCode}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-400">{emp.faces?.length || 0} Face Angles Saved</div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {emp.role?.name || 'Kitchen Staff'}
                    </td>
                    <td className="p-4 text-slate-800 font-semibold">
                      ₹{Number(emp.salaryRate).toLocaleString()} <span className="text-xs text-slate-400 font-normal">/{emp.salaryType || 'monthly'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-purple-600 flex-shrink-0" />
                        <select
                          value={emp.shiftId || 'shift-none'}
                          onChange={(e) => handleShiftChange(emp.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-200 cursor-pointer"
                        >
                          <option value="shift-none">08:00 AM - 05:00 PM (Standard Day)</option>
                          <option value="shift-1">09:00 AM - 06:00 PM (Regular Shift)</option>
                          <option value="shift-2">07:00 AM - 03:00 PM (Morning Prep)</option>
                          <option value="shift-3">02:00 PM - 10:00 PM (Evening Shift)</option>
                          {shifts.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        emp.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {emp.isActive !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {emp.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/employees/${emp.id}/edit`}
                          className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Edit Profile"
                        >
                          <Edit3 size={17} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Employee"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Confirmation Modal for Permanent Database Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-1">Delete Employee Profile?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to permanently remove <span className="font-bold text-slate-800">{deleteTarget.name}</span> ({deleteTarget.employeeCode})? This action will permanently erase their face data and attendance history from the database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-1/2 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-red-200"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
