import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_BASE_URL = 'https://backend-gold-sigma-74.vercel.app';

export default function DutyTimerScreen() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0); 
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { employeeId, employeeName, score } = useLocalSearchParams<{ employeeId: string; employeeName: string; score: string }>();

  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [daysWorked, setDaysWorked] = useState(1);
  const [hourlyPayRate, setHourlyPayRate] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (!isOnBreak) {
      timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOnBreak]);

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_BASE_URL}/employees/${employeeId}`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE_URL}/attendance`).then(r => r.json()).catch(() => []),
    ])
      .then(([empData, attData]) => {
        if (empData) {
          setEmployee(empData);
          const monthlySalary = (empData.salaryRate ? Number(empData.salaryRate) : 0) || 15000;
          const dailyRate = monthlySalary / 30;
          const hourlyRate = dailyRate / 24;
          setHourlyPayRate(Math.round(hourlyRate * 100) / 100);
        }

        if (Array.isArray(attData)) {
          const empAttendances = attData.filter((a: any) => a.employeeId === employeeId);
          const uniqueDates = new Set(empAttendances.map((a: any) => {
            const dateStr = a.date ? a.date.toString() : a.checkInTime ? a.checkInTime.toString() : new Date().toISOString();
            return dateStr.split('T')[0];
          }));
          setDaysWorked(Math.max(1, uniqueDates.size));

          const active = attData.find(
            a => a.employeeId === employeeId && (a.status === 'working' || a.status === 'on_break')
          );
          if (active) {
            setAttendanceRecord(active);
            setIsOnBreak(active.status === 'on_break');
            if (active.checkInTime) {
              const startMs = new Date(active.checkInTime).getTime();
              const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
              setElapsedSeconds(diffSec);
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load duty data:', err);
        setLoading(false);
      });
  }, [employeeId]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'EL';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const displayName = employee?.name || employeeName || 'Employee';

  const handleToggleBreak = async () => {
    if (attendanceRecord?.id) {
      try {
        if (!isOnBreak) {
          await fetch(`${API_BASE_URL}/attendance/start-break/${attendanceRecord.id}`, { method: 'POST' });
        }
      } catch (e) {
        console.error('Break sync error:', e);
      }
    }
    setIsOnBreak(!isOnBreak);
  };

  const handleCheckOut = async () => {
    if (attendanceRecord?.id) {
      try {
        await fetch(`${API_BASE_URL}/attendance/check-out/${attendanceRecord.id}`, { method: 'POST' });
      } catch (e) {
        console.error('Check-out sync error:', e);
      }
    }
    router.replace('/');
  };

  const getScoreBadgeText = () => {
    if (!score) return '✓ Verified Active Duty';
    if (score.includes('Manual') || score.includes('Override')) return '📸 Manual Photo Punch-In';
    const cleanScore = score.replace('%', '');
    return `✓ Face Verified (${cleanScore}%)`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Employee Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.profileBadge}>
            <Text style={styles.profileInitials}>{getInitials(displayName)}</Text>
          </View>
          <Text style={styles.employeeName}>{displayName}</Text>
          <Text style={styles.employeeRole}>
            {employee?.role?.name || 'Kitchen Staff'} • {employee?.shift?.name || 'Standard Day (08:00 AM - 05:00 PM)'}
          </Text>

          {/* Security Audit Badge */}
          <View style={styles.auditBadgeContainer}>
            <Text style={styles.auditBadgeText}>{getScoreBadgeText()}</Text>
            <Text style={styles.auditBadgeSubtext}>Location: Main Kiosk Terminal • Active Session</Text>
          </View>
        </View>

        {/* Dark Slate Digital Timer Box */}
        <View style={[styles.timerContainer, isOnBreak && styles.timerContainerBreak]}>
          <View style={styles.timerHeaderRow}>
            <View style={[styles.statusDot, isOnBreak ? styles.statusDotBreak : styles.statusDotActive]} />
            <Text style={styles.timerLabel}>{isOnBreak ? 'ON BREAK SESSION' : 'ACTIVE DUTY SESSION'}</Text>
          </View>
          
          <Text style={[styles.timerValue, isOnBreak && styles.timerValueBreak]}>
            {formatTime(elapsedSeconds)}
          </Text>
          
          <View style={styles.targetPill}>
            <Text style={styles.shiftTargetText}>
              🗓️ Working Cycle: Day {daysWorked} of 30 • Earning Rate: ₹{hourlyPayRate}/hr
            </Text>
          </View>
        </View>

        {/* Break / Check-Out Actions */}
        <View style={styles.actionContainer}>
          {isOnBreak ? (
            <TouchableOpacity style={styles.resumeButton} onPress={handleToggleBreak}>
              <Text style={styles.resumeButtonText}>▶️ Resume Duty</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.breakButton} onPress={handleToggleBreak}>
              <Text style={styles.breakButtonText}>☕ Start Break</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.backKioskButton} 
            onPress={() => router.push('/')}
          >
            <Text style={styles.backKioskButtonText}>⬅️ Back to Kiosk / Select Next Employee</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.endButton} 
            onPress={handleCheckOut}
          >
            <Text style={styles.endButtonText}>🏁 Mark Day Duty as End (Complete Day {daysWorked})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  profileBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInitials: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  employeeRole: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  auditBadgeContainer: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  auditBadgeText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 13,
  },
  auditBadgeSubtext: {
    color: '#166534',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  timerContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f172a',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  timerContainerBreak: {
    backgroundColor: '#1e1b4b',
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#22c55e',
  },
  statusDotBreak: {
    backgroundColor: '#f97316',
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 2,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerValueBreak: {
    color: '#fb923c',
  },
  targetPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
  },
  shiftTargetText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  actionContainer: {
    width: '100%',
    maxWidth: 480,
    gap: 12,
  },
  breakButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  breakButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  resumeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  backKioskButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  backKioskButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  endButtonText: {
    color: '#e11d48',
    fontSize: 16,
    fontWeight: '700',
  },
});
