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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Shift Configuration</h1>
          <p className="text-sm text-slate-400 mt-1">Configure standard working hours and break limits.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
          <Link href="/" className="flex-1 sm:flex-none text-center bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Back to Dashboard
          </Link>
          <Link
            href="/shifts/new"
            className="flex-1 sm:flex-none text-center justify-center bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all inline-flex items-center"
          >
            + New Shift Rule
          </Link>
        </div>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm font-medium">{error}</div>}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-xl flex flex-col justify-between gap-6">
            <div>
              <div className="flex justify-between items-start mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{shift.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{Number(shift.requiredHours)} required working hours</p>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold shrink-0">
                  Active
                </span>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Start Time:</span>
                  <span className="font-semibold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60">{formatTime(shift.startTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">End Time:</span>
                  <span className="font-semibold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60">{formatTime(shift.endTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Max Break Limit:</span>
                  <span className="font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">{Number(shift.maxBreakHours || 0)} hours</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-700/80 pt-4">
              <Link 
                href={`/shifts/${shift.id}/edit`} 
                className="flex-1 text-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Edit Shift
              </Link>
              <Link 
                href={`/shifts/${shift.id}/delete`} 
                className="flex-1 text-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Delete
              </Link>
            </div>
          </div>
        ))}
        {!loading && shifts.length === 0 && (
          <div className="col-span-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center text-slate-400 font-medium">
            No shifts configured yet. Create a new shift rule to get started.
          </div>
        )}
        {loading && <div className="col-span-full text-center py-12 text-slate-400 font-medium">Loading shifts...</div>}
      </section>
    </div>
  );
}
