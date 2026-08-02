'use client';

import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Camera, User, ArrowLeft, Clock, DollarSign, Loader2 } from 'lucide-react';

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
        setEmployee({
          name: data.name || '',
          role: data.role?.name || 'Kitchen Staff',
          baseRate: data.salaryRate || '15000',
          salaryType: data.salaryType || 'monthly',
          dutyStartTime: '08:00',
          dutyEndTime: '17:00',
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
      <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center font-semibold text-slate-600 gap-2">
        <Loader2 className="animate-spin text-purple-600" size={24} />
        Loading employee profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-4 max-w-2xl mx-auto gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <User size={28} className="text-purple-600" />
            Edit Employee Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">Update employee credentials, role/position, and duty shift hours.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push(`/employees/${id}/faces`)}
            className="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all shadow-sm flex items-center gap-2"
          >
            <Camera size={16} />
            Face Credentials
          </button>
          <Link href="/employees" className="bg-white text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 flex items-center gap-2 transition-all">
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={employee.name}
              onChange={(e) => setEmployee({...employee, name: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 text-sm font-medium outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Role / Position <span className="text-purple-600">*</span>
            </label>
            <input 
              type="text" 
              value={employee.role}
              onChange={(e) => setEmployee({...employee, role: e.target.value})}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 text-sm font-medium outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              placeholder="e.g. Kitchen Chef, Head Cook, Staff"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Role will be saved directly to your PostgreSQL database.</span>
          </div>

          {/* Salary Section */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={18} />
              Payroll & Base Salary Configuration
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Payment Cycle</label>
                <select 
                  value={employee.salaryType}
                  onChange={(e) => setEmployee({...employee, salaryType: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm font-semibold outline-none focus:border-purple-600"
                >
                  <option value="monthly">Monthly</option>
                  <option value="daily">Daily</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Salary Rate (₹)</label>
                <input 
                  type="text" 
                  value={employee.baseRate}
                  onChange={(e) => setEmployee({...employee, baseRate: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm font-semibold outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Assigned Duty Hours (Start to End Time) */}
          <div className="p-5 bg-purple-50/50 rounded-xl border border-purple-100">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="text-purple-600" size={18} />
              Assigned Duty Hours (Shift Start to End)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Duty start time is used to enforce late arrival penalties (10 mins late = 1 hr deduction, 30 mins late = 2 hrs deduction).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-700">Duty Start Time</span>
                <input 
                  type="time" 
                  value={employee.dutyStartTime}
                  onChange={(e) => setEmployee({...employee, dutyStartTime: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm font-semibold mt-1 outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700">Duty End Time</span>
                <input 
                  type="time" 
                  value={employee.dutyEndTime}
                  onChange={(e) => setEmployee({...employee, dutyEndTime: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm font-semibold mt-1 outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
            <Link 
              href="/employees"
              className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button 
              onClick={handleUpdateEmployee}
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 text-sm shadow-md shadow-purple-200 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
              {isSubmitting ? 'Updating Profile...' : 'Update Employee'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
