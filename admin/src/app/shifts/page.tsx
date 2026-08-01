'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  requiredHours: string | number;
  maxBreakHours?: string | number | null;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(11, 16);
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/shifts`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load shifts');
        return res.json();
      })
      .then((data) => {
        setShifts(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-lg font-bold text-primary">Shift Configuration</h1>
          <p className="text-body-md text-on-surface-variant">Configure standard working hours and break limits.</p>
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

      {error && <div className="mb-6 rounded border border-error bg-error/10 p-4 text-error">{error}</div>}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-surface-container-low p-6 rounded-lg border border-outline-variant shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-headline-md font-semibold text-primary">{shift.name}</h3>
                <p className="text-body-sm text-on-surface-variant">{Number(shift.requiredHours)} required hours</p>
              </div>
              <span className="bg-[#2D9CDB]/10 text-[#2D9CDB] px-3 py-1 rounded-full text-label-sm">Active</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Start Time:</span>
                <span className="text-body-md font-medium text-on-surface">{formatTime(shift.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">End Time:</span>
                <span className="text-body-md font-medium text-on-surface">{formatTime(shift.endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-on-surface-variant">Max Break:</span>
                <span className="text-body-md font-medium text-on-surface">{Number(shift.maxBreakHours || 0)} hours</span>
              </div>
            </div>

            <div className="flex gap-4 border-t border-outline-variant pt-4">
              <Link href={`/shifts/${shift.id}/edit`} className="text-secondary font-medium hover:underline flex-1 text-center">
                Edit
              </Link>
              <Link href={`/shifts/${shift.id}/delete`} className="text-error font-medium hover:underline flex-1 text-center">
                Delete
              </Link>
            </div>
          </div>
        ))}
        {!loading && shifts.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No shifts configured. Create a new shift rule.
          </div>
        )}
        {loading && <div className="col-span-full text-center py-8 text-gray-500">Loading shifts...</div>}
      </section>
    </div>
  );
}
