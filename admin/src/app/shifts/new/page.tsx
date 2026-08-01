'use client';

import React, { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

export default function NewShiftPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') || ''),
      startTime: String(formData.get('startTime') || ''),
      endTime: String(formData.get('endTime') || ''),
      requiredHours: Number(formData.get('requiredHours') || 0),
      maxBreakHours: Number(formData.get('maxBreakHours') || 0),
    };

    const res = await fetch(`${API_BASE_URL}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError('Unable to create shift. Check the values and try again.');
      return;
    }

    router.push('/shifts');
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-lg font-bold text-primary">New Shift Rule</h1>
          <p className="text-body-md text-on-surface-variant">Create a new shift configuration.</p>
        </div>
        <Link href="/shifts" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md inline-flex items-center">
          Cancel
        </Link>
      </header>

      <div className="max-w-2xl bg-surface-container-low p-8 rounded-xl border border-outline-variant shadow-sm">
        {error && <div className="mb-6 rounded border border-error bg-error/10 p-4 text-error">{error}</div>}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-body-md font-medium mb-2 text-on-surface">Shift Name</label>
            <input name="name" required type="text" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" placeholder="e.g., Morning Shift" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">Start Time</label>
              <input name="startTime" required type="time" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">End Time</label>
              <input name="endTime" required type="time" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">Required Hours</label>
              <input name="requiredHours" required min="0" step="0.25" type="number" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" defaultValue={9} />
            </div>
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">Max Break Hours</label>
              <input name="maxBreakHours" min="0" step="0.25" type="number" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" defaultValue={1} />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant flex justify-end">
            <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded text-label-md inline-flex items-center shadow-sm">
              Save Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
