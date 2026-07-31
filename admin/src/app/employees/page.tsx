'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`);
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const SHIFT_OPTIONS = [
    { id: 'shift-none', name: 'No Shift Assigned' },
    { id: 'shift-1', name: 'Standard Day (12H)' },
    { id: 'shift-2', name: 'Night Shift (8H)' },
    { id: 'shift-3', name: 'Morning Prep (6H)' },
  ];

  const handleShiftChange = (empId: string, newShiftId: string) => {
    // In a real app, you'd PATCH to backend
    setEmployees(employees.map(emp => 
      emp.id === empId ? { ...emp, shiftId: newShiftId } : emp
    ));
  };


  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8 relative">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-lg font-bold text-primary">Employees</h1>
          <p className="text-body-md text-on-surface-variant">Manage staff profiles and details.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md">
            Back to Dashboard
          </Link>
          <Link 
            href="/employees/new"
            className="bg-primary text-on-primary px-6 py-3 rounded text-label-md hover:opacity-90 transition-opacity"
          >
            + Add Employee
          </Link>
        </div>
      </header>

      <section>
        <div className="bg-surface-container-low rounded-lg border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container text-label-md text-on-surface-variant">
              <tr>
                <th className="p-4 border-b border-outline-variant">ID</th>
                <th className="p-4 border-b border-outline-variant">Name</th>
                <th className="p-4 border-b border-outline-variant">Role</th>
                <th className="p-4 border-b border-outline-variant">Base Rate</th>
                <th className="p-4 border-b border-outline-variant">Assigned Shift</th>
                <th className="p-4 border-b border-outline-variant">Status</th>
                <th className="p-4 border-b border-outline-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-on-surface">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-surface-container-highest transition-colors">
                  <td className="p-4 border-b border-outline-variant text-on-surface-variant">{emp.employeeCode}</td>
                  <td className="p-4 border-b border-outline-variant font-medium">{emp.name}</td>
                  <td className="p-4 border-b border-outline-variant">{emp.role?.name || 'Unassigned'}</td>
                  <td className="p-4 border-b border-outline-variant">₹{emp.salaryRate} {emp.salaryType}</td>
                  <td className="p-4 border-b border-outline-variant">
                    <select 
                      value={emp.shiftId || 'shift-none'}
                      onChange={(e) => handleShiftChange(emp.id, e.target.value)}
                      className="bg-surface-container-highest border border-outline-variant rounded p-2 text-label-md text-on-surface outline-none focus:border-primary"
                    >
                      {SHIFT_OPTIONS.map(shift => (
                         <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 border-b border-outline-variant">
                    <span className="bg-[#2D9CDB]/10 text-[#2D9CDB] px-3 py-1 rounded-full text-label-sm">{emp.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="p-4 border-b border-outline-variant text-right">
                    <Link href={`/employees/${emp.id}/edit`} className="text-secondary font-medium mr-4 hover:underline">Edit</Link>
                    <Link href={`/employees/${emp.id}/delete`} className="text-error font-medium hover:underline">Delete</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
