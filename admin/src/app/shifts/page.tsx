import React from 'react';
import Link from 'next/link';

export default function ShiftsPage() {
  const shifts: any[] = [];

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-lg font-bold text-primary">Shift Configuration</h1>
          <p className="text-body-md text-on-surface-variant">Configure standard working hours and grace periods.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md">
            Back to Dashboard
          </Link>
          <Link 
            href="/shifts/new"
            className="bg-primary text-on-primary px-6 py-3 rounded text-label-md inline-flex items-center"
          >
            + New Shift Rule
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shifts.map(shift => (
          <div key={shift.id} className="bg-surface-container-low p-6 rounded-lg border border-outline-variant shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-headline-md font-semibold text-primary">{shift.name}</h3>
                <p className="text-body-sm text-on-surface-variant">{shift.description}</p>
              </div>
              <span className="bg-[#2D9CDB]/10 text-[#2D9CDB] px-3 py-1 rounded-full text-label-sm">Active</span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Start Time:</span>
                <span className="text-body-md font-medium text-on-surface">{shift.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">End Time:</span>
                <span className="text-body-md font-medium text-on-surface">{shift.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Grace Period (Late):</span>
                <span className="text-body-md font-medium text-on-surface">{shift.graceLate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Grace Period (Early):</span>
                <span className="text-body-md font-medium text-on-surface">{shift.graceEarly}</span>
              </div>
            </div>
            
            <div className="flex gap-4 border-t border-outline-variant pt-4">
              <Link 
                href={`/shifts/${shift.id}/edit`}
                className="text-secondary font-medium hover:underline flex-1 text-center"
              >
                Edit
              </Link>
              <Link 
                href={`/shifts/${shift.id}/delete`}
                className="text-error font-medium hover:underline flex-1 text-center"
              >
                Delete
              </Link>
            </div>
          </div>
        ))}
        {shifts.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No shifts configured. Create a new shift rule.
          </div>
        )}
      </section>
    </div>
  );
}
