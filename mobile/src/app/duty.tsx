import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE_URL } from '@/lib/api';

export default function ActiveDutyScreen() {
  const { employeeId, employeeName, score } = useLocalSearchParams<{
    employeeId: string;
    employeeName?: string;
    score?: string;
  }>();

  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [loading, setLoading] = useState(true);

  const [hourlyPayRate, setHourlyPayRate] = useState<number>(0);
  const [autoEndTriggered, setAutoEndTriggered] = useState(false);
  const autoEndRef = useRef(false);

  const shiftHours = Number(employee?.shift?.requiredHours) || 9;
  const shiftTotalSeconds = shiftHours * 3600;

  // Timer loop when on active duty
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (!isOnBreak) {
      timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOnBreak]);

  // Auto-end duty 2 hours after shift end time (unpayable overtime)
  useEffect(() => {
    if (autoEndRef.current) return;
    const autoCutoffSeconds = 2 * 3600; // 2 hours grace period after shift end
    const autoEndSeconds = shiftTotalSeconds + autoCutoffSeconds;
    if (shiftTotalSeconds > 0 && elapsedSeconds >= autoEndSeconds) {
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
        }

        if (Array.isArray(attData)) {
          const active = attData.find(
            (a: any) => a.employeeId === employeeId && (a.status === 'working' || a.status === 'on_break')
          );

          if (active) {
            setAttendanceRecord(active);
            setIsOnBreak(active.status === 'on_break');

            if (active.checkInTime) {
              const checkInMs = new Date(active.checkInTime).getTime();
              const nowMs = Date.now();
              const totalSec = Math.max(0, Math.floor((nowMs - checkInMs) / 1000));
              const breakSec = (active.breakMinutes || 0) * 60;
              setElapsedSeconds(Math.max(0, totalSec - breakSec));
            }
          }
        }
      })
      .catch(err => console.error('Error fetching duty details:', err))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const handleToggleBreak = async () => {
    const nextStatus = isOnBreak ? 'working' : 'on_break';
    setIsOnBreak(!isOnBreak);

    if (attendanceRecord?.id) {
      try {
        const endpoint = nextStatus === 'on_break' ? 'break-start' : 'break-end';
        await fetch(`${API_BASE_URL}/attendance/${endpoint}/${attendanceRecord.id}`, { method: 'POST' });
      } catch (e) {
        console.error('Break sync error:', e);
      }
    }
  };

  const handleAutoCheckOut = async () => {
    try {
      if (attendanceRecord?.id) {
        await fetch(`${API_BASE_URL}/attendance/check-out/${attendanceRecord.id}`, { method: 'POST' });
      }
    } catch (e) {
      console.error('Auto check-out sync error:', e);
    }
    setTimeout(() => router.replace('/'), 3000);
  };

  const handleCheckOut = async () => {
    const executeCheckOut = async () => {
      if (attendanceRecord?.id) {
        try {
          await fetch(`${API_BASE_URL}/attendance/check-out/${attendanceRecord.id}`, { method: 'POST' });
        } catch (e) {
          console.error('Check-out sync error:', e);
        }
      }
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to end duty for ${displayName}?\nEarned Today: ₹${earnedPay.toLocaleString('en-IN')}`)) {
        await executeCheckOut();
      }
    } else {
      Alert.alert(
        'End Duty Shift',
        `Are you sure you want to end duty for ${displayName}?\n\nEarned: ₹${earnedPay.toLocaleString('en-IN')} (${formatHM(earnedSeconds)} worked)`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Duty',
            style: 'destructive',
            onPress: executeCheckOut,
          },
        ]
      );
    }
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
      assignedStr = `${String(shiftDate.getUTCHours()).padStart(2, '0')}:${String(shiftDate.getUTCMinutes()).padStart(2, '0')}`;
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

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'EL';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatHM = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Payable seconds capped at shiftTotalSeconds (Overtime beyond shift is unpayable)
  const payableWorkingSeconds = Math.min(elapsedSeconds, shiftTotalSeconds);

  // Late penalty calculation
  const penaltyMinutes = attendanceRecord?.penaltyDeductionMinutes || 0;
  const penaltySeconds = penaltyMinutes * 60;
  const earnedSeconds = Math.max(0, payableWorkingSeconds - penaltySeconds);

  const earnedPay = Math.round((earnedSeconds / 3600) * hourlyPayRate * 100) / 100;
  const penaltyPay = Math.round((penaltySeconds / 3600) * hourlyPayRate * 100) / 100;

  const shiftProgress = Math.min(1.0, elapsedSeconds / shiftTotalSeconds);
  const remainingSeconds = Math.max(0, shiftTotalSeconds - elapsedSeconds);
  const isShiftComplete = elapsedSeconds >= shiftTotalSeconds;

  const displayName = employeeName || employee?.name || 'Kitchen Employee';
  const daysWorked = 1;

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
            Shift Automatically Ended!
          </Text>
          <Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
            {displayName}'s duty has been automatically closed after reaching 2 hours past shift end time.
          </Text>
          <View style={{ marginTop: 24, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: '#10b981', borderRadius: 20, padding: 20, alignItems: 'center', width: '100%' }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>TOTAL EARNED TODAY</Text>
            <Text style={{ color: '#10b981', fontSize: 40, fontWeight: '800', marginTop: 4 }}>₹{earnedPay.toLocaleString('en-IN')}</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{formatHM(earnedSeconds)} worked (Capped at shift max)</Text>
          </View>
          <Text style={{ color: '#475569', fontSize: 13, marginTop: 24 }}>Redirecting to kiosk in 3 seconds...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Profile Header Card */}
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
              <Text style={styles.shiftCompleteText}>✅ Shift target reached! (Auto-close in 2h if not ended)</Text>
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

        {/* PROMINENT ACTION BUTTONS */}
        <View style={styles.actionContainer}>
          {/* 1. Toggle Break Button */}
          {isOnBreak ? (
            <TouchableOpacity style={styles.resumeButton} onPress={handleToggleBreak} activeOpacity={0.85}>
              <Text style={styles.resumeButtonText}>▶️  Resume Duty</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.breakButton} onPress={handleToggleBreak} activeOpacity={0.85}>
              <Text style={styles.breakButtonText}>☕  Start Break</Text>
            </TouchableOpacity>
          )}

          {/* 2. Prominent End Duty Button (ALWAYS VISIBLE whether working or on break) */}
          <TouchableOpacity style={styles.endButton} onPress={handleCheckOut} activeOpacity={0.85}>
            <Text style={styles.endButtonText}>🏁  End Duty Shift</Text>
          </TouchableOpacity>

          {/* 3. Navigation Back to Kiosk */}
          <TouchableOpacity style={styles.backKioskButton} onPress={() => router.push('/')} activeOpacity={0.85}>
            <Text style={styles.backKioskButtonText}>⬅️  Back to Kiosk (Next Employee)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileInitials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  employeeRole: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  auditBadgeContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  auditBadgeText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  auditBadgeSubtext: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  lateCard: {
    width: '100%',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  lateCardWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  lateCardSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  lateCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  lateTextWarning: {
    color: '#FBBF24',
  },
  lateTextSuccess: {
    color: '#34D399',
  },
  lateCardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  penaltyText: {
    fontSize: 12,
    color: '#F87171',
    fontWeight: '700',
    marginTop: 4,
  },
  timerContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerContainerBreak: {
    borderColor: '#F59E0B',
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotBreak: {
    backgroundColor: '#F59E0B',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  timerValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#38BDF8',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  timerValueBreak: {
    color: '#FBBF24',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  shiftStatusRow: {
    marginBottom: 14,
  },
  shiftRemainingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  shiftCompleteText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  earnedPillRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  earnedPill: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  ratePill: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  earnedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  earnedValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C084FC',
    marginTop: 2,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 480,
    gap: 12,
  },
  breakButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  breakButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resumeButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  backKioskButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  backKioskButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
});
