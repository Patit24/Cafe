import React from 'react';
import Link from 'next/link';

export default function DeleteShiftPage() {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-surface-container-low p-8 rounded-xl border border-outline-variant shadow-sm text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </div>
        
        <h2 className="text-headline-md font-bold text-primary mb-2">Delete Shift Rule?</h2>
        <p className="text-body-md text-on-surface-variant mb-8">
          Are you sure you want to delete this shift rule? This action cannot be undone and may affect employee scheduling.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/shifts" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md flex-1">
            Cancel
          </Link>
          <Link href="/shifts" className="bg-error text-white px-6 py-3 rounded text-label-md flex-1 shadow-sm">
            Delete Shift
          </Link>
        </div>
      </div>
    </div>
  );
}
