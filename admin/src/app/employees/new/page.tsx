'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, Loader2, UserPlus, ArrowLeft, Clock, DollarSign, ShieldCheck, Sparkles } from 'lucide-react';
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
      const empId = createdEmp.id;

      // Upload multi-angle photos & embeddings
      const angles: ('front' | 'left' | 'right' | 'top')[] = ['front', 'left', 'right', 'top'];
      for (const angle of angles) {
        const photoData = facePhotos[angle];
        if (photoData) {
          try {
            const embedding = generateNeuralFaceEmbedding(photoData);

            await fetch(`${API_BASE_URL}/face/enroll`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employeeId: empId,
                angleLabel: angle,
                imageUrl: photoData,
                embedding: embedding,
              }),
            });
          } catch (err) {
            console.error(`Failed to save face angle ${angle}:`, err);
          }
        }
      }

      router.push('/employees');
    } catch (err) {
      console.error('Failed to create employee:', err);
      alert('Error creating employee. Check backend logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const photoSlots: { key: 'front' | 'left' | 'right' | 'top'; label: string; desc: string }[] = [
    { key: 'front', label: 'Front Facing (Default)', desc: 'Direct camera view' },
    { key: 'left', label: 'Left Angle View', desc: 'Slight left profile' },
    { key: 'right', label: 'Right Angle View', desc: 'Slight right profile' },
    { key: 'top', label: 'Top / Tilt View', desc: 'Slight upward tilt' },
  ];

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 pb-24 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800/80 pb-4 max-w-4xl mx-auto">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Sparkles size={12} /> Onboarding & Biometrics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <UserPlus className="text-purple-400" size={28} />
            Create Employee Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
            Set up staff details, assigned duty hours, base salary rates, and 4-angle face authentication credentials.
          </p>
        </div>
        <Link 
          href="/employees" 
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Directory
        </Link>
      </header>

      {/* Main Form Container */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto border border-slate-700/80 shadow-2xl space-y-8">
        
        {/* Basic Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input 
              type="text" 
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-medium outline-none focus:border-purple-500 transition-all placeholder-slate-500"
              placeholder="e.g. Rahul Das"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
              Role / Position <span className="text-purple-400">*</span>
            </label>
            <input 
              type="text" 
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-medium outline-none focus:border-purple-500 transition-all placeholder-slate-500"
              placeholder="e.g. Kitchen Chef, Head Cook, Staff"
            />
            <span className="text-[11px] text-slate-500 mt-1 block font-mono">This role will be saved to your PostgreSQL database.</span>
          </div>
        </div>

        {/* Payroll & Salary Section */}
        <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-4">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={18} />
            Payroll & Base Salary Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Salary Payment Cycle</label>
              <select 
                value={newEmployee.salaryType}
                onChange={(e) => setNewEmployee({...newEmployee, salaryType: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-purple-500"
              >
                <option value="monthly">Monthly (Base ÷ 30 Days = Daily ÷ 24 Hours)</option>
                <option value="daily">Daily Pay</option>
                <option value="hourly">Hourly Pay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Base Monthly Salary Rate (₹)</label>
              <input 
                type="text" 
                value={newEmployee.baseRate}
                onChange={(e) => setNewEmployee({...newEmployee, baseRate: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold font-mono outline-none focus:border-purple-500"
                placeholder="15000"
              />
            </div>
          </div>
        </div>

        {/* Duty Shift Section */}
        <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-4">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Clock className="text-purple-400" size={18} />
            Assigned Duty Shift Hours
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Shift Start Time</label>
              <input 
                type="time" 
                value={newEmployee.dutyStartTime}
                onChange={(e) => setNewEmployee({...newEmployee, dutyStartTime: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold font-mono outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Shift End Time</label>
              <input 
                type="time" 
                value={newEmployee.dutyEndTime}
                onChange={(e) => setNewEmployee({...newEmployee, dutyEndTime: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold font-mono outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* 4-Angle Face Enrollment Section */}
        <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Camera className="text-purple-400" size={18} />
              Face Authentication Credentials (4 Angles)
            </h2>
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full">
              Optional / Recommended
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {photoSlots.map((slot) => {
              const photo = facePhotos[slot.key];

              return (
                <div 
                  key={slot.key} 
                  className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-white text-xs">{slot.label}</h3>
                    <p className="text-[10px] text-slate-400">{slot.desc}</p>
                  </div>

                  <div className="aspect-square w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center">
                    {photo ? (
                      <>
                        <img src={photo} alt={slot.label} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(slot.key)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-950/80 text-rose-400 hover:text-white flex items-center justify-center border border-slate-700"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900/60 transition-colors p-3 text-center">
                        <Upload size={24} className="text-purple-400 mb-1.5" />
                        <span className="text-xs font-bold text-slate-300">Upload Photo</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">JPEG / PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoSelect(slot.key, e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/80">
          <Link
            href="/employees"
            className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
          >
            Cancel
          </Link>
          <button
            onClick={handleSaveEmployee}
            disabled={isSubmitting}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Profile...
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Complete Profile Creation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
