'use client';

import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Camera, User, ArrowLeft, Clock, DollarSign, Loader2, Save, ShieldCheck, Sparkles } from 'lucide-react';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [employee, setEmployee] = useState({
    name: '',
    role: '',
    baseRate: '',
    salaryType: 'monthly',
    dutyStartTime: '08:00',
    dutyEndTime: '17:00',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/employees/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        let startT = '08:00';
        let endT = '17:00';
        if (data.shift && data.shift.startTime && data.shift.endTime) {
          const parseTimeStr = (val: any) => {
            if (typeof val === 'string') {
              if (val.includes('T')) return val.split('T')[1].substring(0, 5);
              return val.substring(0, 5);
            }
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              const h = d.getUTCHours().toString().padStart(2, '0');
              const m = d.getUTCMinutes().toString().padStart(2, '0');
              return `${h}:${m}`;
            }
            return '08:00';
          };
          startT = parseTimeStr(data.shift.startTime);
          endT = parseTimeStr(data.shift.endTime);
        }

        setEmployee({
          name: data.name || '',
          role: data.role?.name || 'Kitchen Staff',
          baseRate: data.salaryRate || '15000',
          salaryType: data.salaryType || 'monthly',
          dutyStartTime: startT,
          dutyEndTime: endT,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchEmployee();
  }, [id]);

  const handleUpdateEmployee = async () => {
    if (!employee.name.trim()) return;
    setIsSubmitting(true);

    const rateStr = String(employee.baseRate).replace(/[^0-9.]/g, '');
    const rate = parseFloat(rateStr) || 15000;
    const roleValue = employee.role.trim() || 'Kitchen Staff';

    const payload = {
      name: employee.name.trim(),
      role: roleValue,
      salaryRate: rate,
      salaryType: employee.salaryType,
      dutyStartTime: employee.dutyStartTime,
      dutyEndTime: employee.dutyEndTime,
    };

    try {
      await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      router.push('/employees');
    } catch (err) {
      console.error(err);
      alert('Failed to update employee profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center font-bold text-slate-300 gap-3">
        <Loader2 className="animate-spin text-purple-400" size={24} />
        Loading employee profile...
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 pb-24 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-800/80 pb-4 max-w-2xl mx-auto gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Sparkles size={12} /> Edit Staff Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <User size={28} className="text-purple-400" />
            Edit Employee Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
            Update employee credentials, role/position, and duty shift hours.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => router.push(`/employees/${id}/faces`)}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Camera size={14} /> Manage Faces
          </button>
          <Link
            href="/employees"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto border border-slate-700/80 shadow-2xl space-y-6">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
            Full Name <span className="text-rose-400">*</span>
          </label>
          <input 
            type="text" 
            value={employee.name}
            onChange={(e) => setEmployee({...employee, name: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-medium outline-none focus:border-purple-500 transition-all placeholder-slate-500"
            placeholder="Full Name"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
            Role / Position <span className="text-purple-400">*</span>
          </label>
          <input 
            type="text" 
            value={employee.role}
            onChange={(e) => setEmployee({...employee, role: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-medium outline-none focus:border-purple-500 transition-all placeholder-slate-500"
            placeholder="Role / Position"
          />
        </div>

        {/* Payroll & Salary Section */}
        <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-4">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={18} />
            Payroll & Base Salary Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Salary Payment Cycle</label>
              <select 
                value={employee.salaryType}
                onChange={(e) => setEmployee({...employee, salaryType: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500"
              >
                <option value="monthly">Monthly (Base ÷ 30 Days = Daily ÷ 24 Hours)</option>
                <option value="daily">Daily Pay</option>
                <option value="hourly">Hourly Pay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Base Monthly Salary Rate (₹)</label>
              <input 
                type="text" 
                value={employee.baseRate}
                onChange={(e) => setEmployee({...employee, baseRate: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold font-mono outline-none focus:border-purple-500"
                placeholder="15000"
              />
            </div>
          </div>
        </div>

        {/* Duty Shift Section */}
        <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-4">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Clock className="text-purple-400" size={18} />
            Assigned Duty Shift Hours
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Shift Start Time</label>
              <input 
                type="time" 
                value={employee.dutyStartTime}
                onChange={(e) => setEmployee({...employee, dutyStartTime: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold font-mono outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Shift End Time</label>
              <input 
                type="time" 
                value={employee.dutyEndTime}
                onChange={(e) => setEmployee({...employee, dutyEndTime: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold font-mono outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/80">
          <Link
            href="/employees"
            className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
          >
            Cancel
          </Link>
          <button
            onClick={handleUpdateEmployee}
            disabled={isSubmitting}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
