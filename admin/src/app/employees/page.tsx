'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([
    {
      id: 'EMP-0012',
      name: 'Rahul Das',
      role: 'Kitchen Staff',
      baseRate: '₹15.00/hr',
      status: 'Active',
      shiftId: 'shift-1'
    },
    {
      id: 'EMP-0014',
      name: 'Amit Kumar',
      role: 'Sous Chef',
      baseRate: '₹20.00/hr',
      status: 'Active',
      shiftId: 'shift-2'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    baseRate: ''
  });

  const SHIFT_OPTIONS = [
    { id: 'shift-none', name: 'No Shift Assigned' },
    { id: 'shift-1', name: 'Standard Day (12H)' },
    { id: 'shift-2', name: 'Night Shift (8H)' },
    { id: 'shift-3', name: 'Morning Prep (6H)' },
  ];

  const handleShiftChange = (empId: string, newShiftId: string) => {
    setEmployees(employees.map(emp => 
      emp.id === empId ? { ...emp, shiftId: newShiftId } : emp
    ));
  };

  const handleSaveEmployee = () => {
    if (!newEmployee.name || !newEmployee.role) return;

    const newId = `EMP-00${Math.floor(Math.random() * 90) + 10}`;
    setEmployees([
      ...employees,
      {
        id: newId,
        name: newEmployee.name,
        role: newEmployee.role,
        baseRate: newEmployee.baseRate || '₹15.00/hr',
        status: 'Active',
        shiftId: 'shift-none'
      }
    ]);
    setNewEmployee({ name: '', role: '', baseRate: '' });
    setIsModalOpen(false);
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
          <button 
            className="bg-primary text-on-primary px-6 py-3 rounded text-label-md hover:opacity-90 transition-opacity"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Employee
          </button>
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
                  <td className="p-4 border-b border-outline-variant text-on-surface-variant">{emp.id}</td>
                  <td className="p-4 border-b border-outline-variant font-medium">{emp.name}</td>
                  <td className="p-4 border-b border-outline-variant">{emp.role}</td>
                  <td className="p-4 border-b border-outline-variant">{emp.baseRate}</td>
                  <td className="p-4 border-b border-outline-variant">
                    <select 
                      value={emp.shiftId}
                      onChange={(e) => handleShiftChange(emp.id, e.target.value)}
                      className="bg-surface-container-highest border border-outline-variant rounded p-2 text-label-md text-on-surface outline-none focus:border-primary"
                    >
                      {SHIFT_OPTIONS.map(shift => (
                         <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 border-b border-outline-variant">
                    <span className="bg-[#2D9CDB]/10 text-[#2D9CDB] px-3 py-1 rounded-full text-label-sm">{emp.status}</span>
                  </td>
                  <td className="p-4 border-b border-outline-variant text-right">
                    <button className="text-secondary font-medium mr-4 hover:underline">Edit</button>
                    <button className="text-error font-medium hover:underline">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-xl p-8 w-[400px] shadow-lg border border-outline-variant">
            <h2 className="text-headline-md font-bold text-primary mb-6">Add New Employee</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-1">Role</label>
                <input 
                  type="text" 
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                  placeholder="e.g. Dishwasher"
                />
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-1">Base Rate</label>
                <input 
                  type="text" 
                  value={newEmployee.baseRate}
                  onChange={(e) => setNewEmployee({...newEmployee, baseRate: e.target.value})}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                  placeholder="e.g. ₹15.00/hr"
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
                onClick={handleSaveEmployee}
                className="bg-primary text-on-primary px-6 py-2 rounded-md font-medium hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
