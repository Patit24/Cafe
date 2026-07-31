'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('http://localhost:3001/attendance');
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Attendance Log</h1>
        <Link href="/" className="px-4 py-2 bg-gray-200 rounded text-black font-semibold hover:bg-gray-300">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Employee</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Check In</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Check Out</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Total Hours</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No attendance records found
                </td>
              </tr>
            ) : (
              attendance.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    {formatTime(record.checkIn)}
                  </td>
                  <td className="px-6 py-4">
                    {formatTime(record.checkOut)}
                  </td>
                  <td className="px-6 py-4">
                    {record.totalHours ? Number(record.totalHours).toFixed(2) : '--'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
