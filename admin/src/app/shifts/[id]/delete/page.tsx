'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function DeleteShiftPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [error, setError] = useState('');

  async function deleteShift() {
    const res = await fetch(`${API_BASE_URL}/shifts/${params.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Unable to delete shift. Remove employee assignments first, then try again.');
      return;
    }
    router.push('/shifts');
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-surface-container-low p-8 rounded-xl border border-outline-variant shadow-sm text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 size={32} />
        </div>

        <h2 className="text-headline-md font-bold text-primary mb-2">Delete Shift Rule?</h2>
        <p className="text-body-md text-on-surface-variant mb-8">
          Are you sure you want to delete this shift rule? This action cannot be undone and may affect employee scheduling.
        </p>
        {error && <div className="mb-6 rounded border border-error bg-error/10 p-4 text-error">{error}</div>}

        <div className="flex gap-4 justify-center">
          <Link href="/shifts" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md flex-1">
            Cancel
          </Link>
          <button onClick={deleteShift} className="bg-error text-white px-6 py-3 rounded text-label-md flex-1 shadow-sm">
            Delete Shift
          </button>
        </div>
      </div>
    </div>
  );
}
