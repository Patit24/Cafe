'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

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
        const res = await fetch(`http://localhost:3001/employees/${id}`);
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
    if (!employee.name) return;
    setIsSubmitting(true);

    const rateStr = String(employee.baseRate).replace(/[^0-9.]/g, '');
    const rate = parseFloat(rateStr) || 15.00;

    const payload = {
      name: employee.name,
      salaryRate: rate,
      salaryType: employee.salaryType
    };

    try {
      await fetch(`http://localhost:3001/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      router.push('/employees');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-surface-container-lowest flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8 relative">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-display-sm font-bold text-primary">Edit Employee</h1>
            <p className="text-body-md text-on-surface-variant">Update staff details.</p>
          </div>
          <button 
            onClick={() => router.push(`/employees/${params.id}/faces`)}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
          >
            Manage Face Profiles
          </button>
        </div>
        <Link href="/employees" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md ml-4">
          Back to Employees
        </Link>
      </header>

      <div className="bg-surface-container-low rounded-xl p-8 max-w-xl border border-outline-variant shadow-sm">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Full Name</label>
            <input 
              type="text" 
              value={employee.name}
              onChange={(e) => setEmployee({...employee, name: e.target.value})}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Role</label>
            <input 
              type="text" 
              value={employee.role}
              onChange={(e) => setEmployee({...employee, role: e.target.value})}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Salary Type</label>
              <select 
                value={employee.salaryType}
                onChange={(e) => setEmployee({...employee, salaryType: e.target.value})}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Base Rate (₹)</label>
              <input 
                type="text" 
                value={employee.baseRate}
                onChange={(e) => setEmployee({...employee, baseRate: e.target.value})}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Link 
              href="/employees"
              className="px-6 py-3 text-on-surface-variant hover:text-on-surface font-medium"
            >
              Cancel
            </Link>
            <button 
              onClick={handleUpdateEmployee}
              disabled={isSubmitting}
              className="bg-primary text-on-primary px-8 py-3 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Update Employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
