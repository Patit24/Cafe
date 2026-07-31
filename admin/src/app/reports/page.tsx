'use client';
import React from 'react';
import Link from 'next/link';
import { Download, BarChart2, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-8">
      <header className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed insights into workforce performance and financials</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 flex items-center gap-2">
            <Calendar size={16} />
            This Month
          </button>
          <button className="bg-gradient-to-r from-teal-400 to-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 flex items-center gap-2">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </header>

      {/* Report Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
            <DollarSign size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Payroll</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">₹4,25,000</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
            <TrendingUp size={16} />
            <span>+2.4% vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
            <Users size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Avg Attendance Rate</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">94.2%</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
            <TrendingUp size={16} />
            <span>+1.1% vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
            <BarChart2 size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Overtime Hours</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">142h</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-red-500 font-medium">
            <TrendingUp size={16} />
            <span>+12.5% vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mb-4">
            <Calendar size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Leave Requests</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">28</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span>Consistent with last month</span>
          </div>
        </div>
      </section>

      {/* Placeholder Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:col-span-2 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="font-bold text-gray-900">Attendance Trends</h3>
            <p className="text-xs text-gray-500">Daily check-ins over the last 30 days</p>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg mt-4 bg-gray-50/50">
            <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
              <BarChart2 size={18} />
              Chart Visualization Placeholder
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="font-bold text-gray-900">Role Distribution</h3>
            <p className="text-xs text-gray-500">Staff breakdown by department</p>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg mt-4 bg-gray-50/50">
            <p className="text-gray-400 text-sm font-medium">Pie Chart Placeholder</p>
          </div>
        </div>
      </section>

    </div>
  );
}
