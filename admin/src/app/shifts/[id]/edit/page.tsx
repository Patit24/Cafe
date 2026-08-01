'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

type Shift = {
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

export default function EditShiftPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [shift, setShift] = useState<Shift | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/shifts/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load shift');
        return res.json();
      })
      .then(setShift)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

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

    const res = await fetch(`${API_BASE_URL}/shifts/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError('Unable to update shift. Check the values and try again.');
      return;
    }

    router.push('/shifts');
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-lg font-bold text-primary">Edit Shift Rule</h1>
          <p className="text-body-md text-on-surface-variant">Update the configuration for this shift.</p>
        </div>
        <Link href="/shifts" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md inline-flex items-center">
          Cancel
        </Link>
      </header>

      <div className="max-w-2xl bg-surface-container-low p-8 rounded-xl border border-outline-variant shadow-sm">
        {error && <div className="mb-6 rounded border border-error bg-error/10 p-4 text-error">{error}</div>}
        {!shift && !error && <div className="text-on-surface-variant">Loading shift...</div>}
        {shift && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">Shift Name</label>
              <input name="name" required type="text" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" defaultValue={shift.name} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-md font-medium mb-2 text-on-surface">Start Time</label>
                <input name="startTime" required type="time" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" defaultValue={formatTime(shift.startTime)} />
              </div>
              <div>
                <label className="block text-body-md font-medium mb-2 text-on-surface">End Time</label>
                <input name="endTime" required type="time" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" defaultValue={formatTime(shift.endTime)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-md font-medium mb-2 text-on-surface">Required Hours</label>
                <input name="requiredHours" required min="0" step="0.25" type="number" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" defaultValue={Number(shift.requiredHours)} />
              </div>
              <div>
                <label className="block text-body-md font-medium mb-2 text-on-surface">Max Break Hours</label>
                <input name="maxBreakHours" min="0" step="0.25" type="number" className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary" defaultValue={Number(shift.maxBreakHours || 0)} />
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant flex justify-end">
              <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded text-label-md inline-flex items-center shadow-sm">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
