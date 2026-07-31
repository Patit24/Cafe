'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function DeleteEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [employee, setEmployee] = useState<{name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await fetch(`http://localhost:3001/employees/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setEmployee(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchEmployee();
  }, [id]);

  const handleDeleteEmployee = async () => {
    setIsDeleting(true);
    try {
      await fetch(`http://localhost:3001/employees/${id}`, {
        method: 'DELETE',
      });
      router.push('/employees');
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-surface-container-lowest flex justify-center items-center">Loading...</div>;
  }

  if (!employee) {
    return <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center items-center">
      <p>Employee not found.</p>
      <Link href="/employees" className="mt-4 text-primary">Back to Employees</Link>
    </div>;
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8 relative">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-sm font-bold text-error">Delete Employee</h1>
          <p className="text-body-md text-on-surface-variant">Are you sure you want to remove this employee?</p>
        </div>
      </header>

      <div className="bg-surface-container-low rounded-xl p-8 max-w-xl border border-outline-variant shadow-sm text-center mx-auto mt-20">
        <h2 className="text-headline-md font-semibold text-primary mb-2">Confirm Deletion</h2>
        <p className="text-body-md text-on-surface-variant mb-8">
          You are about to permanently delete <strong>{employee.name}</strong>. This action cannot be undone.
        </p>

        <div className="flex justify-center gap-4">
          <Link 
            href="/employees"
            className="px-6 py-3 text-on-surface-variant hover:text-on-surface font-medium"
          >
            Cancel
          </Link>
          <button 
            onClick={handleDeleteEmployee}
            disabled={isDeleting}
            className="bg-error text-white px-8 py-3 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}
