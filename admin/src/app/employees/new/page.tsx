'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export default function NewEmployeePage() {
  const router = useRouter();
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    baseRate: '',
    salaryType: 'monthly'
  });
  
  // 4 Face Angles for Authentication
  const [facePhotos, setFacePhotos] = useState<{
    front: string | null;
    left: string | null;
    right: string | null;
    top: string | null;
  }>({
    front: null,
    left: null,
    right: null,
    top: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoSelect = (angle: 'front' | 'left' | 'right' | 'top', file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFacePhotos(prev => ({ ...prev, [angle]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (angle: 'front' | 'left' | 'right' | 'top') => {
    setFacePhotos(prev => ({ ...prev, [angle]: null }));
  };

  const handleSaveEmployee = async () => {
    if (!newEmployee.name) return;
    setIsSubmitting(true);

    const newCode = `EMP-${Math.floor(Math.random() * 900) + 100}`;
    const rateStr = newEmployee.baseRate.replace(/[^0-9.]/g, '');
    const rate = parseFloat(rateStr) || 15.00;

    const payload = {
      employeeCode: newCode,
      name: newEmployee.name,
      salaryType: newEmployee.salaryType,
      salaryRate: rate,
      isActive: true
    };

    try {
      const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${apiHost}:8000/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const createdEmp = await res.json();

      // Upload face photos if provided
      if (createdEmp?.id) {
        const angles: Array<'front' | 'left' | 'right' | 'top'> = ['front', 'left', 'right', 'top'];
        for (const angle of angles) {
          const photoData = facePhotos[angle];
          if (photoData) {
            try {
              const fileName = `faces/${createdEmp.id}_${angle}_${Date.now()}.jpg`;
              const storageRef = ref(storage, fileName);
              await uploadString(storageRef, photoData, 'data_url');
              const downloadURL = await getDownloadURL(storageRef);

              await fetch(`http://${apiHost}:8000/employees/${createdEmp.id}/faces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: downloadURL,
                  angle: angle,
                  faceEmbedding: null
                })
              });
            } catch (imgErr) {
              console.error(`Failed to upload ${angle} face photo:`, imgErr);
            }
          }
        }
      }

      router.push('/employees');
    } catch (err) {
      console.error(err);
      alert('Failed to save employee. Make sure the backend server is reachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ANGLES: Array<{ key: 'front' | 'left' | 'right' | 'top'; label: string; desc: string }> = [
    { key: 'front', label: 'Front View', desc: 'Direct face photo' },
    { key: 'left', label: 'Left Profile', desc: 'Turn head left' },
    { key: 'right', label: 'Right Profile', desc: 'Turn head right' },
    { key: 'top', label: 'Top / Tilt View', desc: 'Slight upward tilt' },
  ];

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-8 relative">
      <header className="flex justify-between items-center mb-8 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-display-sm font-bold text-primary">Add New Employee</h1>
          <p className="text-body-md text-on-surface-variant">Create a new staff profile with face authentication setup.</p>
        </div>
        <Link href="/employees" className="bg-surface-container-high text-on-surface px-6 py-3 rounded text-label-md">
          Back to Employees
        </Link>
      </header>

      <div className="bg-surface-container-low rounded-xl p-8 max-w-3xl border border-outline-variant shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Basic Info */}
          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Full Name *</label>
            <input 
              type="text" 
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Role</label>
            <input 
              type="text" 
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
              placeholder="e.g. Chef / Dishwasher"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Salary Type</label>
              <select 
                value={newEmployee.salaryType}
                onChange={(e) => setNewEmployee({...newEmployee, salaryType: e.target.value})}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Base Rate (₹)</label>
              <input 
                type="text" 
                value={newEmployee.baseRate}
                onChange={(e) => setNewEmployee({...newEmployee, baseRate: e.target.value})}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-md p-3 text-body-md outline-none focus:border-primary"
                placeholder="e.g. 15000"
              />
            </div>
          </div>

          {/* 4 Angle Face Uploads for Authentication */}
          <div className="pt-4 border-t border-outline-variant">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Camera className="text-purple-600" size={20} />
              Face Authentication Photos (4 Angles)
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Upload photos from 4 different angles for accurate facial attendance matching.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ANGLES.map(({ key, label, desc }) => (
                <div key={key} className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-gray-700 mb-1">{label}</span>
                  <div className="relative w-full aspect-square bg-surface-container-highest border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex flex-col items-center justify-center group hover:border-purple-500 transition-colors">
                    {facePhotos[key] ? (
                      <>
                        <img src={facePhotos[key]!} alt={label} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(key)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 text-center">
                        <Upload size={20} className="text-gray-400 mb-1 group-hover:text-purple-600" />
                        <span className="text-[11px] font-medium text-gray-600">Upload {label}</span>
                        <span className="text-[9px] text-gray-400">{desc}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoSelect(key, e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-outline-variant">
            <Link 
              href="/employees"
              className="px-5 py-2.5 text-on-surface-variant hover:text-on-surface font-medium"
            >
              Cancel
            </Link>
            <button 
              onClick={handleSaveEmployee}
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving Profile & Photos...
                </>
              ) : (
                'Save Employee Profile'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
