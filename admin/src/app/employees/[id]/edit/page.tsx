'use client';

import { API_BASE_URL } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Camera, User } from 'lucide-react';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [employee, setEmployee] = useState({
    name: '',
    role: '',
    baseRate: '',
    salaryType: 'monthly'
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
          role: data.role?.name || '',
          baseRate: data.salaryRate || '',
          salaryType: data.salaryType || 'monthly'
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

    const payload = {
      name: employee.name.trim(),
      salaryRate: rate,
      salaryType: employee.salaryType
    };

    try {
      await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    return <div className="min-h-screen bg-gray-50 flex justify-center items-center font-medium text-gray-600">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-200 pb-4 max-w-2xl mx-auto gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <User size={28} className="text-purple-600" />
            Edit Employee Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">Update employee details and salary settings.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push(`/employees/${id}/faces`)}
            className="bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Camera size={16} />
            Face Profiles
          </button>
          <Link href="/employees" className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100">
            Back
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-xl p-8 max-w-2xl mx-auto border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={employee.name}
              onChange={(e) => setEmployee({...employee, name: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 text-base font-medium outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Role / Position</label>
            <input 
              type="text" 
              value={employee.role}
              onChange={(e) => setEmployee({...employee, role: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 text-base font-medium outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Salary Type</label>
              <select 
                value={employee.salaryType}
                onChange={(e) => setEmployee({...employee, salaryType: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 text-base font-medium outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              >
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Base Rate (₹)</label>
              <input 
                type="text" 
                value={employee.baseRate}
                onChange={(e) => setEmployee({...employee, baseRate: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 text-base font-medium outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <Link 
              href="/employees"
              className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-semibold text-sm rounded-lg"
            >
              Cancel
            </Link>
            <button 
              onClick={handleUpdateEmployee}
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 text-sm shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Update Employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
