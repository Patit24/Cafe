'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewEmployeePage() {
  const router = useRouter();
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    baseRate: '',
    salaryType: 'monthly'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveEmployee = async (redirectToFaces = false) => {
    if (!newEmployee.name) return;
    setIsSubmitting(true);

    const newCode = `EMP-${Math.floor(Math.random() * 900) + 100}`;
    const rateStr = newEmployee.baseRate.replace(/[^0-9.]/g, '');
    const rate = parseFloat(rateStr) || 15.00;

    const payload = {
      employeeCode: newCode,
      name: newEmployee.name,
      salaryType: newEmployee.salaryType,
      salaryRate: rate,
      isActive: true
    };

    try {
      const res = await fetch('http://localhost:8000/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (redirectToFaces && data?.id) {
        router.push(`/employees/${data.id}/faces`);
      } else {
        router.push('/employees');
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8 relative">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-sm font-bold text-primary">Add New Employee</h1>
          <p className="text-body-md text-on-surface-variant">Create a new staff profile.</p>
        </div>
        <Link href="/employees" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md">
          Back to Employees
        </Link>
      </header>

      <div className="bg-surface-container-low rounded-xl p-8 max-w-xl border border-outline-variant shadow-sm">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Full Name</label>
            <input 
              type="text" 
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Role</label>
            <input 
              type="text" 
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
              placeholder="e.g. Dishwasher"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Salary Type</label>
              <select 
                value={newEmployee.salaryType}
                onChange={(e) => setNewEmployee({...newEmployee, salaryType: e.target.value})}
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
                value={newEmployee.baseRate}
                onChange={(e) => setNewEmployee({...newEmployee, baseRate: e.target.value})}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                placeholder="e.g. 15.00"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 mt-4">
            <Link 
              href="/employees"
              className="px-5 py-2.5 text-on-surface-variant hover:text-on-surface font-medium"
            >
              Cancel
            </Link>
            <button 
              onClick={() => handleSaveEmployee(false)}
              disabled={isSubmitting}
              className="bg-surface-container-high text-on-surface px-5 py-2.5 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Employee'}
            </button>
            <button 
              onClick={() => handleSaveEmployee(true)}
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              📸 Save & Add Face Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
