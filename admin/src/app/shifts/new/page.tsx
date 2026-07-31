import React from 'react';
import Link from 'next/link';

export default function NewShiftPage() {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-lg font-bold text-primary">New Shift Rule</h1>
          <p className="text-body-md text-on-surface-variant">Create a new shift configuration.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/shifts" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md inline-flex items-center">
            Cancel
          </Link>
        </div>
      </header>

      <div className="max-w-2xl bg-surface-container-low p-8 rounded-xl border border-outline-variant shadow-sm">
        <form className="space-y-6">
          <div>
            <label className="block text-body-md font-medium mb-2 text-on-surface">Shift Name</label>
            <input 
              type="text" 
              className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary"
              placeholder="e.g., Morning Shift"
            />
          </div>
          <div>
            <label className="block text-body-md font-medium mb-2 text-on-surface">Description</label>
            <input 
              type="text" 
              className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary"
              placeholder="e.g., Early prep staff"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">Start Time</label>
              <input 
                type="time" 
                className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">End Time</label>
              <input 
                type="time" 
                className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">Grace Period Late (mins)</label>
              <input 
                type="number" 
                className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary"
                defaultValue={15}
              />
            </div>
            <div>
              <label className="block text-body-md font-medium mb-2 text-on-surface">Grace Period Early (mins)</label>
              <input 
                type="number" 
                className="w-full bg-surface-container-lowest border border-outline px-4 py-2 rounded-lg text-on-surface focus:outline-none focus:border-primary"
                defaultValue={10}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant flex justify-end">
            <Link href="/shifts" className="bg-primary text-on-primary px-8 py-3 rounded text-label-md inline-flex items-center shadow-sm">
              Save Shift
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
