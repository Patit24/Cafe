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
  Loader2,
  Camera,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  UserCheck
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
    setIsLoading(true);
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

  const formatShiftTime = (shift: any) => {
    if (!shift || (!shift.startTime && !shift.endTime)) {
      return '08:00 AM - 05:00 PM (Standard Day)';
    }

    const parseTime = (val: any) => {
      if (!val) return '';
      if (typeof val === 'string') {
        if (val.includes('T')) {
          const timePart = val.split('T')[1]?.split('.')[0] || '';
          const [hStr, mStr] = timePart.split(':');
          let h = parseInt(hStr, 10);
          if (isNaN(h)) return val;
          const m = mStr || '00';
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
        } else if (val.includes(':')) {
          const [hStr, mStr] = val.split(':');
          let h = parseInt(hStr, 10);
          if (isNaN(h)) return val;
          const m = mStr.substring(0, 2) || '00';
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
        }
      }
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      let h = d.getUTCHours();
      const m = d.getUTCMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
    };

    const startStr = parseTime(shift.startTime) || '08:00 AM';
    const endStr = parseTime(shift.endTime) || '05:00 PM';
    let shiftName = '';
    if (shift.name && !/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(shift.name.trim())) {
      shiftName = ` (${shift.name})`;
    }

    return `${startStr} - ${endStr}${shiftName}`;
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 pb-24 bg-slate-900 text-slate-100 min-h-screen">
      {/* ── Top Header Bar ── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Sparkles size={12} /> Staff Credentials & Authentication
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Users className="text-purple-400" size={28} />
            Workforce Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
            Manage staff profiles, duty shifts, base salary rates, and face authentication credentials
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/employees/new"
            className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all"
          >
            <UserPlus size={15} />
            Add New Employee
          </Link>

          <button
            onClick={fetchData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-purple-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* ── Summary Stats Row ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/70 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Registered</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{employees.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Staff in PostgreSQL DB</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/70 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Active Duty Staff</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">{employees.filter(e => e.isActive !== false).length}</p>
          <p className="text-[11px] text-emerald-300/80 mt-1">Ready for shifts</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/70 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Face Enrolled</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Camera size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-2">{employees.filter(e => e.faces && e.faces.length > 0).length}</p>
          <p className="text-[11px] text-blue-300/80 mt-1">Biometric templates saved</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/70 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">Security Mode</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-white mt-2 flex items-center gap-1.5 text-emerald-400">
            Active 🛡️
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Liveness + Photo fallback</p>
        </div>
      </section>

      {/* ── Control Bar: Search & Counter ── */}
      <div className="bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
          <input 
            type="text"
            placeholder="Search employee by name, ID, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-purple-500 transition-all"
          />
        </div>

        <div className="text-xs font-bold text-slate-300 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-700 shadow-inner flex items-center gap-2">
          <span>Showing Staff:</span>
          <span className="text-purple-400 font-extrabold text-sm">{filteredEmployees.length}</span>
          <span className="text-slate-500">/ {employees.length}</span>
        </div>
      </div>

      {/* ── Main Workforce Table Container ── */}
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Employee ID</th>
                <th className="py-4 px-6">Full Name</th>
                <th className="py-4 px-4">Role / Position</th>
                <th className="py-4 px-4">Base Rate</th>
                <th className="py-4 px-4">Assigned Duty Hours</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400 font-medium animate-pulse">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading workforce directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-base font-semibold text-slate-300">No staff members found.</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or click &ldquo;Add New Employee&rdquo; above.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empName = emp.name || 'Unnamed Employee';
                  const empCode = emp.employeeCode || `EMP-${emp.id}`;
                  const roleName = emp.role?.name || emp.role || 'Kitchen Staff';
                  const baseSalary = emp.salaryRate || 15000;
                  const facesCount = emp.faces ? emp.faces.length : 0;
                  const initials = empName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr key={emp.id} className="hover:bg-slate-750/70 transition-colors group">
                      <td className="py-4 px-6 font-mono font-extrabold text-purple-400 text-xs whitespace-nowrap">
                        {empCode}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-purple-500/20">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                              {empName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              {facesCount > 0 ? (
                                <span className="text-purple-300 font-bold inline-flex items-center gap-1">
                                  <Camera size={11} /> {facesCount} Face Angle{facesCount > 1 ? 's' : ''} Saved
                                </span>
                              ) : (
                                <span className="text-slate-500">No Face Saved</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-200">
                        {roleName}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-white font-mono text-sm">
                          ₹{Number(baseSalary).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400">/monthly</div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80 inline-flex items-center gap-1.5 font-mono text-xs text-purple-300">
                          <Clock size={13} className="text-purple-400" />
                          <span>{formatShiftTime(emp.shift)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {emp.isActive !== false ? (
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                            <CheckCircle2 size={13} />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                            <XCircle size={13} />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right space-x-2">
                        <Link 
                          href={`/employees/${emp.id}/edit`}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition-all inline-flex items-center justify-center text-xs font-bold shadow-xs hover:text-white"
                          title="Edit Profile"
                        >
                          <Edit3 size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-2 rounded-xl transition-all inline-flex items-center justify-center text-xs font-bold shadow-xs"
                          title="Delete Employee"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards (< lg) */}
        <div className="lg:hidden divide-y divide-slate-800 p-4 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 animate-pulse">Loading workforce directory...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No staff members found.</div>
          ) : (
            filteredEmployees.map((emp) => {
              const empName = emp.name || 'Unnamed Employee';
              const empCode = emp.employeeCode || `EMP-${emp.id}`;
              const roleName = emp.role?.name || emp.role || 'Kitchen Staff';
              const baseSalary = emp.salaryRate || 15000;
              const facesCount = emp.faces ? emp.faces.length : 0;
              const initials = empName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div key={emp.id} className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{empName}</h4>
                        <p className="text-xs text-purple-400 font-mono font-extrabold">{empCode}</p>
                      </div>
                    </div>

                    {emp.isActive !== false ? (
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        Active
                      </span>
                    ) : (
                      <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Role</span>
                      <span className="font-extrabold text-white text-xs">{roleName}</span>
                    </div>
                    <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Base Rate</span>
                      <span className="font-extrabold text-slate-200 text-xs">₹{Number(baseSalary).toLocaleString('en-IN')}/mo</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Camera size={13} className="text-purple-400" />
                      <span>{facesCount} Face Angles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/employees/${emp.id}/edit`}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1"
                      >
                        <Edit3 size={13} /> Edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(emp)}
                        className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Delete Employee Profile</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong> (<span className="font-mono text-purple-400">{deleteTarget.employeeCode || deleteTarget.id}</span>)? All associated face embeddings and attendance logs will be permanently removed.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
