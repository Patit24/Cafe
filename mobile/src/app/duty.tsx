import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '@/lib/api';

export default function DutyTimerScreen() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0); 
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shiftTotalSeconds, setShiftTotalSeconds] = useState(9 * 3600); // default 9h
  const [autoEndTriggered, setAutoEndTriggered] = useState(false);
  const autoEndRef = useRef(false);

  const router = useRouter();
  const { employeeId, employeeName, score } = useLocalSearchParams<{ employeeId: string; employeeName: string; score: string }>();

  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [daysWorked, setDaysWorked] = useState(1);
  const [hourlyPayRate, setHourlyPayRate] = useState(0);
  const [penaltyMinutes, setPenaltyMinutes] = useState(0);

  // Main elapsed timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (!isOnBreak) {
      timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOnBreak]);

  // Auto-end duty when shift completes
  useEffect(() => {
    if (autoEndRef.current) return;
    if (shiftTotalSeconds > 0 && elapsedSeconds >= shiftTotalSeconds) {
      autoEndRef.current = true;
      setAutoEndTriggered(true);
      handleAutoCheckOut();
    }
  }, [elapsedSeconds, shiftTotalSeconds]);

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

          // Get shift duration in seconds
          if (empData.shift?.requiredHours) {
            setShiftTotalSeconds(Number(empData.shift.requiredHours) * 3600);
          }
        }

        if (Array.isArray(attData)) {
          const empAttendances = attData.filter((a: any) => a.employeeId === employeeId);
          const uniqueDates = new Set(empAttendances.map((a: any) => {
            const dateStr = a.date ? a.date.toString() : a.checkInTime ? a.checkInTime.toString() : new Date().toISOString();
            return dateStr.split('T')[0];
          }));
          setDaysWorked(Math.max(1, uniqueDates.size));

          const active = attData.find(
            (a: any) => a.employeeId === employeeId && (a.status === 'working' || a.status === 'on_break')
          );
          if (active) {
            setAttendanceRecord(active);
            setIsOnBreak(active.status === 'on_break');
            setPenaltyMinutes(active.penaltyDeductionMinutes || 0);
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

  const formatHM = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'EL';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const displayName = employee?.name || employeeName || 'Employee';

  // Real-time earned pay calculation
  const earnedSeconds = Math.max(0, elapsedSeconds - (penaltyMinutes * 60));
  const earnedPay = Math.round((earnedSeconds / 3600) * hourlyPayRate * 100) / 100;
  const penaltyPay = Math.round(((penaltyMinutes / 60) * hourlyPayRate) * 100) / 100;

  // Shift progress (0 to 1)
  const shiftProgress = shiftTotalSeconds > 0 ? Math.min(1, elapsedSeconds / shiftTotalSeconds) : 0;
  const remainingSeconds = Math.max(0, shiftTotalSeconds - elapsedSeconds);
  const isShiftComplete = elapsedSeconds >= shiftTotalSeconds;

  const handleToggleBreak = async () => {
    if (attendanceRecord?.id) {
      try {
        if (!isOnBreak) {
          await fetch(`${API_BASE_URL}/attendance/start-break/${attendanceRecord.id}`, { method: 'POST' });
        } else {
          // resume - find the latest open break
          const latestBreak = attendanceRecord?.breaks?.find((b: any) => !b.endTime);
          if (latestBreak) {
            await fetch(`${API_BASE_URL}/attendance/resume-duty/${latestBreak.id}/${attendanceRecord.id}`, { method: 'POST' });
          }
        }
      } catch (e) {
        console.error('Break sync error:', e);
      }
    }
    setIsOnBreak(!isOnBreak);
  };

  const handleAutoCheckOut = async () => {
    try {
      if (attendanceRecord?.id) {
        await fetch(`${API_BASE_URL}/attendance/check-out/${attendanceRecord.id}`, { method: 'POST' });
      }
    } catch (e) {
      console.error('Auto check-out sync error:', e);
    }
    // Small delay then redirect
    setTimeout(() => router.replace('/'), 3000);
  };

  const handleCheckOut = async () => {
    Alert.alert(
      'End Duty Shift',
      `Are you sure you want to end duty for ${displayName}?\n\nEarned: ₹${earnedPay.toLocaleString('en-IN')} (${formatHM(earnedSeconds)} worked)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Duty',
          style: 'destructive',
          onPress: async () => {
            if (attendanceRecord?.id) {
              try {
                await fetch(`${API_BASE_URL}/attendance/check-out/${attendanceRecord.id}`, { method: 'POST' });
              } catch (e) {
                console.error('Check-out sync error:', e);
              }
            }
            router.replace('/');
          },
        },
      ]
    );
  };

  const getScoreBadgeText = () => {
    if (!score) return '✓ Verified Active Duty';
    if (score.includes('Manual') || score.includes('Override')) return '📸 Manual Photo Punch-In';
    const cleanScore = score.replace('%', '');
    return `✓ Face Verified (${cleanScore}%)`;
  };

  const getLateDetails = () => {
    if (!attendanceRecord?.checkInTime) return null;
    const checkIn = new Date(attendanceRecord.checkInTime);
    const checkInMins = checkIn.getHours() * 60 + checkIn.getMinutes();
    
    let shiftStartMins = 480;
    let assignedStr = '08:00 AM';
    const shiftObj = employee?.shift || attendanceRecord?.shift;
    if (shiftObj && shiftObj.startTime) {
      const shiftDate = new Date(shiftObj.startTime);
      shiftStartMins = shiftDate.getUTCHours() * 60 + shiftDate.getUTCMinutes();
      assignedStr = `${String(shiftDate.getUTCHours()).padStart(2,'0')}:${String(shiftDate.getUTCMinutes()).padStart(2,'0')}`;
    }

    const checkInTimeStr = checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const diff = checkInMins - shiftStartMins;
    if (diff > 0) {
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      let durStr = '';
      if (hrs > 0 && mins > 0) durStr = `${hrs} hr ${mins} mins`;
      else if (hrs > 0) durStr = `${hrs} hr${hrs > 1 ? 's' : ''}`;
      else durStr = `${mins} mins`;
      return { isLate: true, title: `⚠️ LATE by ${durStr}`, subtitle: `Shift: ${assignedStr} • Punched in: ${checkInTimeStr}` };
    }
    return { isLate: false, title: `✓ ON TIME`, subtitle: `Shift: ${assignedStr} • Punched in: ${checkInTimeStr}` };
  };

  const lateInfo = getLateDetails();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ color: '#64748b', marginTop: 12, fontWeight: '600' }}>Loading duty data...</Text>
      </SafeAreaView>
    );
  }

  // Auto-end screen
  if (autoEndTriggered) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 64 }}>🏁</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#ffffff', textAlign: 'center', marginTop: 16 }}>
            Shift Complete!
          </Text>
          <Text style={{ fontSize: 16, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
            {displayName}'s duty has been automatically ended.
          </Text>
          <View style={{ marginTop: 24, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: '#10b981', borderRadius: 20, padding: 20, alignItems: 'center', width: '100%' }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>TOTAL EARNED TODAY</Text>
            <Text style={{ color: '#10b981', fontSize: 40, fontWeight: '800', marginTop: 4 }}>₹{earnedPay.toLocaleString('en-IN')}</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{formatHM(earnedSeconds)} worked</Text>
          </View>
          <Text style={{ color: '#475569', fontSize: 13, marginTop: 24 }}>Redirecting to kiosk in 3 seconds...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        
        {/* Employee Profile Header */}
        <View style={styles.headerCard}>
          <View style={styles.profileBadge}>
            <Text style={styles.profileInitials}>{getInitials(displayName)}</Text>
          </View>
          <Text style={styles.employeeName}>{displayName}</Text>
          <Text style={styles.employeeRole}>
            {employee?.role?.name || 'Kitchen Staff'} • {employee?.shift?.name || 'Standard Shift'}
          </Text>

          <View style={styles.auditBadgeContainer}>
            <Text style={styles.auditBadgeText}>{getScoreBadgeText()}</Text>
            <Text style={styles.auditBadgeSubtext}>Main Kiosk Terminal • Day {daysWorked} of 30</Text>
          </View>

          {lateInfo && (
            <View style={[styles.lateCard, lateInfo.isLate ? styles.lateCardWarning : styles.lateCardSuccess]}>
              <Text style={[styles.lateCardTitle, lateInfo.isLate ? styles.lateTextWarning : styles.lateTextSuccess]}>
                {lateInfo.title}
              </Text>
              <Text style={styles.lateCardSubtitle}>{lateInfo.subtitle}</Text>
              {penaltyMinutes > 0 && (
                <Text style={styles.penaltyText}>⚠️ Penalty deduction: -₹{penaltyPay.toLocaleString('en-IN')} ({penaltyMinutes}m late)</Text>
              )}
            </View>
          )}
        </View>

        {/* Digital Timer Box */}
        <View style={[styles.timerContainer, isOnBreak && styles.timerContainerBreak]}>
          <View style={styles.timerHeaderRow}>
            <View style={[styles.statusDot, isOnBreak ? styles.statusDotBreak : styles.statusDotActive]} />
            <Text style={styles.timerLabel}>{isOnBreak ? 'ON BREAK SESSION' : 'ACTIVE DUTY SESSION'}</Text>
          </View>
          
          <Text style={[styles.timerValue, isOnBreak && styles.timerValueBreak]}>
            {formatTime(elapsedSeconds)}
          </Text>

          {/* Shift Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${Math.round(shiftProgress * 100)}%` as any }]} />
          </View>

          {/* Time remaining / shift info */}
          <View style={styles.shiftStatusRow}>
            {isShiftComplete ? (
              <Text style={styles.shiftCompleteText}>✅ Shift target reached!</Text>
            ) : (
              <Text style={styles.shiftRemainingText}>
                ⏳ {formatHM(remainingSeconds)} remaining of {formatHM(shiftTotalSeconds)} shift
              </Text>
            )}
          </View>

          {/* Real-time earned pay */}
          <View style={styles.earnedPillRow}>
            <View style={styles.earnedPill}>
              <Text style={styles.earnedLabel}>EARNED TODAY</Text>
              <Text style={styles.earnedValue}>₹{earnedPay.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.ratePill}>
              <Text style={styles.earnedLabel}>HOURLY RATE</Text>
              <Text style={styles.rateValue}>₹{hourlyPayRate}/hr</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          {isOnBreak ? (
            <TouchableOpacity style={styles.resumeButton} onPress={handleToggleBreak}>
              <Text style={styles.resumeButtonText}>▶️  Resume Duty</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.breakButton} onPress={handleToggleBreak}>
              <Text style={styles.breakButtonText}>☕  Start Break</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.backKioskButton} 
            onPress={() => router.push('/')}
          >
            <Text style={styles.backKioskButtonText}>⬅️  Back to Kiosk (Next Employee)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.endButton} 
            onPress={handleCheckOut}
          >
            <Text style={styles.endButtonText}>🏁  End Duty (Day {daysWorked})</Text>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  employeeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  employeeRole: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'center',
  },
  auditBadgeContainer: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginTop: 10,
    alignItems: 'center',
  },
  auditBadgeText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
  },
  auditBadgeSubtext: {
    color: '#166534',
    fontSize: 10,
    marginTop: 1,
    fontWeight: '500',
  },
  timerContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f172a',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
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
    marginBottom: 10,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 2,
  },
  timerValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerValueBreak: {
    color: '#fb923c',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  shiftStatusRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  shiftRemainingText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  shiftCompleteText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '700',
  },
  earnedPillRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  earnedPill: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ratePill: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  earnedLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  earnedValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 2,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#818cf8',
    marginTop: 2,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 480,
    gap: 10,
  },
  breakButton: {
    backgroundColor: '#f97316',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  breakButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resumeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  backKioskButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  backKioskButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  endButtonText: {
    color: '#e11d48',
    fontSize: 15,
    fontWeight: '700',
  },
  lateCard: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  lateCardWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  lateCardSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  lateCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  lateTextWarning: {
    color: '#b45309',
  },
  lateTextSuccess: {
    color: '#15803d',
  },
  lateCardSubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
    fontWeight: '600',
  },
  penaltyText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
});
