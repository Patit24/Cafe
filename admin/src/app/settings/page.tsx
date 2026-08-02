'use client';
import React, { useState } from 'react';
import { User, Bell, Shield, Sliders, Save, ChefHat } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account and application preferences</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Responsive Sidebar / Horizontal Tabs on Mobile */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 border-b lg:border-b-0 border-slate-800">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex-1 sm:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === 'general' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-xs' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Sliders size={18} />
              <span>General</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex-1 sm:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === 'profile' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-xs' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 sm:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === 'notifications' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-xs' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex-1 sm:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === 'security' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-xs' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Shield size={18} />
              <span>Security</span>
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 max-w-3xl">
          {activeTab === 'general' && (
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-900/60">
                <h2 className="text-lg font-bold text-white">General Settings</h2>
                <p className="text-xs sm:text-sm text-slate-400">Update your restaurant details and app preferences.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Restaurant Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <ChefHat size={18} className="text-slate-400" />
                    </div>
                    <input type="text" defaultValue="Evening Light" className="pl-11 w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Timezone</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                    <option>Asia/Kolkata (IST)</option>
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>America/New_York (EST)</option>
                    <option>Europe/London (GMT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Currency</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700/80 flex justify-end">
                <button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-900/60">
                <h2 className="text-lg font-bold text-white">Profile Information</h2>
                <p className="text-xs sm:text-sm text-slate-400">Manage your personal details.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border border-white/20">
                    AU
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-sm font-semibold text-slate-200 transition-colors shadow-xs">
                      Change Avatar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">First Name</label>
                    <input type="text" defaultValue="Admin" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input type="text" defaultValue="User" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input type="email" defaultValue="admin@eveninglight.com" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700/80 flex justify-end">
                <button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-900/60">
                <h2 className="text-lg font-bold text-white">Notification Preferences</h2>
                <p className="text-xs sm:text-sm text-slate-400">Decide what you want to be notified about.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Late Arrivals</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Get notified when an employee clocks in late.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Leave Requests</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Receive alerts for new leave applications.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Weekly Summary</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Receive a weekly digest of payroll and attendance.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-900/60">
                <h2 className="text-lg font-bold text-white">Security Settings</h2>
                <p className="text-xs sm:text-sm text-slate-400">Manage your password and account security.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600" />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700/80 flex justify-end">
                <button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg">
                  <Shield size={16} /> Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
