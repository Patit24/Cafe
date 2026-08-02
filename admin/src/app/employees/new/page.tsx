'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, Loader2, UserPlus, ArrowLeft, Clock, DollarSign, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { generateNeuralFaceEmbedding } from '@/utils/faceEmbedding';

export default function NewEmployeePage() {
  const router = useRouter();
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    baseRate: '15000',
    salaryType: 'monthly',
    dutyStartTime: '08:00',
    dutyEndTime: '17:00',
  });

  const [facePhotos, setFacePhotos] = useState<{
    front: string | null;
    left: string | null;
    right: string | null;
    top: string | null;
  }>({
    front: null,
    left: null,
    right: null,
    top: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side image compression (320px JPEG)
  const handlePhotoSelect = (angle: 'front' | 'left' | 'right' | 'top', file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setFacePhotos(prev => ({ ...prev, [angle]: compressedBase64 }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (angle: 'front' | 'left' | 'right' | 'top') => {
    setFacePhotos(prev => ({ ...prev, [angle]: null }));
  };

  const handleSaveEmployee = async () => {
    if (!newEmployee.name.trim()) {
      alert('Please enter employee full name.');
      return;
    }
    setIsSubmitting(true);

    const newCode = `EMP-${Math.floor(Math.random() * 900) + 100}`;
    const rateStr = newEmployee.baseRate.replace(/[^0-9.]/g, '');
    const rate = parseFloat(rateStr) || 15000;
    const roleValue = newEmployee.role.trim() || 'Kitchen Staff';

    const payload = {
      employeeCode: newCode,
      name: newEmployee.name.trim(),
      role: roleValue,
      salaryType: newEmployee.salaryType,
      salaryRate: rate,
      isActive: true,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const createdEmp = await res.json();

      // Save face authentication photos & 128D neural vectors
      if (createdEmp?.id) {
        const angles: Array<'front' | 'left' | 'right' | 'top'> = ['front', 'left', 'right', 'top'];
        for (const angle of angles) {
          const photoData = facePhotos[angle];
          if (photoData) {
            try {
              const faceEmbedding = await generateNeuralFaceEmbedding(photoData);

              if (!faceEmbedding) {
                console.warn(`[FaceAPI] Could not detect face in ${angle} photo, skipping.`);
                continue;
              }

              await fetch(`${API_BASE_URL}/employees/${createdEmp.id}/faces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: photoData,
                  angle: angle,
                  faceEmbedding: faceEmbedding,
                }),
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
      alert('Failed to save employee profile. Please try again.');
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <UserPlus className="text-purple-600" size={30} />
            Create Employee Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">Set up staff details, assigned duty hours, and 4-angle face authentication credentials.</p>
        </div>
        <Link href="/employees" className="bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-2 transition-all">
          <ArrowLeft size={16} />
          Back to Directory
        </Link>
      </header>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl p-8 max-w-4xl mx-auto border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-6">
          
          {/* Basic Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 text-sm font-medium outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                placeholder="e.g. Rahul Das"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Role / Position <span className="text-purple-600">*</span>
              </label>
              <input 
                type="text" 
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 text-sm font-medium outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                placeholder="e.g. Kitchen Chef, Head Cook, Staff"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">This role will be saved to your PostgreSQL database.</span>
            </div>
          </div>

          {/* Payroll & Salary Section */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={18} />
              Payroll & Base Salary Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Payment Cycle</label>
                <select 
                  value={newEmployee.salaryType}
                  onChange={(e) => setNewEmployee({...newEmployee, salaryType: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm font-semibold outline-none focus:border-purple-600"
                >
                  <option value="monthly">Monthly (Base ₹15,000 / 30 = ₹500/day)</option>
                  <option value="daily">Daily Pay</option>
                  <option value="hourly">Hourly Pay</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Salary Rate (₹)</label>
                <input 
                  type="text" 
                  value={newEmployee.baseRate}
                  onChange={(e) => setNewEmployee({...newEmployee, baseRate: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm font-semibold outline-none focus:border-purple-600"
                  placeholder="e.g. 15000"
                />
              </div>
            </div>
          </div>

          {/* Assigned Duty Hours (Start to End Time) */}
          <div className="p-5 bg-purple-50/50 rounded-xl border border-purple-100">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="text-purple-600" size={18} />
              Assigned Duty Hours (Shift Start to End)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Duty start time is used by the penalty engine to calculate late arrival deductions (10 mins late = 1 hr deduction, 30 mins late = 2 hrs deduction).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-700">Duty Start Time</span>
                <input 
                  type="time" 
                  value={newEmployee.dutyStartTime}
                  onChange={(e) => setNewEmployee({...newEmployee, dutyStartTime: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm font-semibold mt-1 outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700">Duty End Time</span>
                <input 
                  type="time" 
                  value={newEmployee.dutyEndTime}
                  onChange={(e) => setNewEmployee({...newEmployee, dutyEndTime: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm font-semibold mt-1 outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* 4 Angle Face Authentication Photos */}
          <div className="pt-4 border-t border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="text-purple-600" size={20} />
              Face Authentication Credentials (4 Angles)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Upload photos from 4 angles to generate neural face embeddings for automatic kiosk check-in verification.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ANGLES.map(({ key, label, desc }) => (
                <div key={key} className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-700 mb-1.5">{label}</span>
                  <div className="relative w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden flex flex-col items-center justify-center group hover:border-purple-500 transition-colors">
                    {facePhotos[key] ? (
                      <>
                        <img src={facePhotos[key]!} alt={label} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(key)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-3 text-center">
                        <Upload size={22} className="text-slate-400 mb-1 group-hover:text-purple-600 transition-colors" />
                        <span className="text-xs font-semibold text-slate-700">Upload {label}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{desc}</span>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
            <Link 
              href="/employees"
              className="px-6 py-3 text-slate-600 hover:text-slate-900 font-semibold text-sm rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button 
              onClick={handleSaveEmployee}
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-purple-200 text-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving Profile & Face Credentials...
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
