import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCameraPermissions, CameraView } from 'expo-camera';
import Webcam from 'react-webcam';
import { API_BASE_URL } from '@/lib/api';

type CheckoutStep = 'confirm' | 'capture' | 'submitting' | 'done';

export default function ActiveDutyScreen() {
  const { employeeId, employeeName, score } = useLocalSearchParams<{
    employeeId: string;
    employeeName?: string;
    score?: string;
  }>();

  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const webcamRef = useRef<Webcam>(null);
  const cameraViewRef = useRef<CameraView>(null);

  const [employee, setEmployee] = useState<any>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hourlyPayRate, setHourlyPayRate] = useState<number>(0);
  const [autoEndTriggered, setAutoEndTriggered] = useState(false);
  const autoEndRef = useRef(false);

  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep | null>(null);
  const [checkoutPhoto, setCheckoutPhoto] = useState<string | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const shiftHours = Number(employee?.shift?.requiredHours) || 9;
  const shiftTotalSeconds = shiftHours * 3600;

  // Timer loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (!isOnBreak) {
      timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOnBreak]);

  // Auto-end
  useEffect(() => {
    if (autoEndRef.current) return;
    const autoEndSeconds = shiftTotalSeconds + 2 * 3600;
    if (shiftTotalSeconds > 0 && elapsedSeconds >= autoEndSeconds) {
      autoEndRef.current = true;
      setAutoEndTriggered(true);
      handleAutoCheckOut();
    }
  }, [elapsedSeconds, shiftTotalSeconds]);

  // Load employee + attendance
  useEffect(() => {
    if (!employeeId) { setLoading(false); return; }
    Promise.all([
      fetch(`${API_BASE_URL}/employees/${employeeId}`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE_URL}/attendance`).then(r => r.json()).catch(() => []),
    ])
      .then(([empData, attData]) => {
        if (empData) {
          setEmployee(empData);
          const monthlySalary = empData.salaryRate ? Number(empData.salaryRate) : 15000;
          setHourlyPayRate(Math.round((monthlySalary / 30 / 24) * 100) / 100);
        }
        if (Array.isArray(attData)) {
          const active = attData.find(
            (a: any) => a.employeeId === employeeId && (a.status === 'working' || a.status === 'on_break')
          );
          if (active) {
            setAttendanceRecord(active);
            setIsOnBreak(active.status === 'on_break');
            if (active.checkInTime) {
              const totalSec = Math.max(0, Math.floor((Date.now() - new Date(active.checkInTime).getTime()) / 1000));
              setElapsedSeconds(Math.max(0, totalSec - (active.breakMinutes || 0) * 60));
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  const handleToggleBreak = async () => {
    const nextStatus = isOnBreak ? 'working' : 'on_break';
    setIsOnBreak(!isOnBreak);
    if (attendanceRecord?.id) {
      try {
        const endpoint = nextStatus === 'on_break' ? 'break-start' : 'break-end';
        await fetch(`${API_BASE_URL}/attendance/${endpoint}/${attendanceRecord.id}`, { method: 'POST' });
      } catch (e) { console.error('Break sync error:', e); }
    }
  };

  const handleAutoCheckOut = async () => {
    try {
      if (attendanceRecord?.id) {
        await fetch(`${API_BASE_URL}/attendance/check-out/${attendanceRecord.id}`, { method: 'POST' });
      }
    } catch (e) { console.error('Auto check-out sync error:', e); }
    setTimeout(() => router.replace('/'), 3000);
  };

  // ── CAMERA CAPTURE for checkout photo ──
  const captureCheckoutPhoto = useCallback(async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return webcamRef.current?.getScreenshot() || null;
    }
    if (cameraViewRef.current) {
      try {
        const photo = await cameraViewRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
          skipProcessing: true,
        });
        return photo?.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo?.uri || null;
      } catch (e) {
        console.error('Capture error:', e);
        return null;
      }
    }
    return null;
  }, []);

  // Step 1: Employee taps "End Duty" → show camera capture step
  const handleEndDutyTap = async () => {
    if (Platform.OS !== 'web') {
      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          // Still allow checkout without photo if permission denied
          handleConfirmCheckoutNoPhoto();
          return;
        }
      }
    }
    setCheckoutStep('capture');
  };

  // Step 2: Employee takes photo
  const handleCapturePhoto = async () => {
    const photo = await captureCheckoutPhoto();
    setCheckoutPhoto(photo);
    // Brief preview then auto-submit, or user can retake
    if (photo) {
      setCheckoutStep('submitting');
      await submitCheckout(photo);
    }
  };

  // Retake photo
  const handleRetakePhoto = () => {
    setCheckoutPhoto(null);
    setCheckoutStep('capture');
  };

  // Submit checkout with photo
  const submitCheckout = async (photoUrl?: string | null) => {
    setCheckoutSubmitting(true);
    try {
      if (attendanceRecord?.id) {
        await fetch(`${API_BASE_URL}/attendance/check-out/${attendanceRecord.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkOutPhotoUrl: photoUrl || undefined }),
        });
      }
      setCheckoutStep('done');
      setTimeout(() => router.replace('/'), 3500);
    } catch (e) {
      console.error('Check-out error:', e);
      setCheckoutStep('capture');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Skip photo checkout
  const handleConfirmCheckoutNoPhoto = async () => {
    setCheckoutStep('submitting');
    await submitCheckout(null);
  };

  const getLateDetails = () => {
    if (!attendanceRecord?.checkInTime) return null;
    const checkIn = new Date(attendanceRecord.checkInTime);
    const checkInMins = checkIn.getHours() * 60 + checkIn.getMinutes();
    let shiftStartMins = 480;
    let assignedStr = '08:00 AM';
    const shiftObj = employee?.shift || attendanceRecord?.shift;
    if (shiftObj?.startTime) {
      const shiftDate = new Date(shiftObj.startTime);
      shiftStartMins = shiftDate.getUTCHours() * 60 + shiftDate.getUTCMinutes();
      assignedStr = `${String(shiftDate.getUTCHours()).padStart(2, '0')}:${String(shiftDate.getUTCMinutes()).padStart(2, '0')}`;
    }
    const diff = checkInMins - shiftStartMins;
    const checkInTimeStr = checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff > 0) {
      const hrs = Math.floor(diff / 60), mins = diff % 60;
      const durStr = hrs > 0 && mins > 0 ? `${hrs}h ${mins}m` : hrs > 0 ? `${hrs}h` : `${mins}m`;
      return { isLate: true, title: `⚠️ LATE by ${durStr}`, subtitle: `Shift: ${assignedStr} • In: ${checkInTimeStr}` };
    }
    return { isLate: false, title: '✓ ON TIME', subtitle: `Shift: ${assignedStr} • In: ${checkInTimeStr}` };
  };

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const formatHM = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const getInitials = (nameStr: string) => {
    const parts = (nameStr || '').trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : nameStr.substring(0, 2).toUpperCase();
  };
  const getScoreBadge = () => {
    if (!score) return '✓ Verified Active Duty';
    if (score.includes('Manual') || score.includes('Override')) return '📸 Manual Photo Punch-In';
    return `✓ Face Verified (${score.replace('%', '')}%)`;
  };

  const payableWorkingSeconds = Math.min(elapsedSeconds, shiftTotalSeconds);
  const penaltyMinutes = attendanceRecord?.penaltyDeductionMinutes || 0;
  const penaltySeconds = penaltyMinutes * 60;
  const earnedSeconds = Math.max(0, payableWorkingSeconds - penaltySeconds);
  const earnedPay = Math.round((earnedSeconds / 3600) * hourlyPayRate * 100) / 100;
  const penaltyPay = Math.round((penaltySeconds / 3600) * hourlyPayRate * 100) / 100;
  const shiftProgress = Math.min(1.0, elapsedSeconds / shiftTotalSeconds);
  const remainingSeconds = Math.max(0, shiftTotalSeconds - elapsedSeconds);
  const isShiftComplete = elapsedSeconds >= shiftTotalSeconds;
  const displayName = employeeName || employee?.name || 'Kitchen Employee';
  const lateInfo = getLateDetails();

  // ─── LOADING ───
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ color: '#64748b', marginTop: 12, fontWeight: '600' }}>Loading duty data...</Text>
      </SafeAreaView>
    );
  }

  // ─── AUTO-END SCREEN ───
  if (autoEndTriggered) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 64 }}>🏁</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 16 }}>
            Shift Auto-Ended
          </Text>
          <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
            {displayName}'s duty auto-closed after 2 hours past shift end time.
          </Text>
          <View style={{ marginTop: 24, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: '#10b981', borderRadius: 20, padding: 20, alignItems: 'center', width: '100%' }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>TOTAL EARNED TODAY</Text>
            <Text style={{ color: '#10b981', fontSize: 40, fontWeight: '800', marginTop: 4 }}>₹{earnedPay.toLocaleString('en-IN')}</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{formatHM(earnedSeconds)} worked</Text>
          </View>
          <Text style={{ color: '#475569', fontSize: 13, marginTop: 24 }}>Returning to kiosk in 3 seconds...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── CHECKOUT DONE SCREEN ───
  if (checkoutStep === 'done') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 72 }}>✅</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 16 }}>
            Duty Ended!
          </Text>
          <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
            {displayName}'s checkout photo has been saved.
          </Text>
          {checkoutPhoto && (
            <View style={{ marginTop: 20, borderRadius: 20, overflow: 'hidden', width: 140, height: 140, borderWidth: 3, borderColor: '#10b981' }}>
              <Image source={{ uri: checkoutPhoto }} style={{ width: '100%', height: '100%' }} />
            </View>
          )}
          <View style={{ marginTop: 20, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: '#10b981', borderRadius: 20, padding: 20, alignItems: 'center', width: '100%' }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>TOTAL EARNED TODAY</Text>
            <Text style={{ color: '#10b981', fontSize: 40, fontWeight: '800', marginTop: 4 }}>₹{earnedPay.toLocaleString('en-IN')}</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{formatHM(earnedSeconds)} worked</Text>
          </View>
          <Text style={{ color: '#475569', fontSize: 13, marginTop: 24 }}>Returning to kiosk...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── CHECKOUT CAMERA CAPTURE SCREEN ───
  if (checkoutStep === 'capture' || checkoutStep === 'submitting') {
    const isCaptureStep = checkoutStep === 'capture';

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#030712' }]}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' }}>
          {/* Header */}
          <View style={{ width: '100%', maxWidth: 480, marginBottom: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              📸 End Duty Photo
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
              Take a photo to verify your check-out — {displayName}
            </Text>
          </View>

          {/* Camera Preview */}
          <View style={{
            width: '100%', maxWidth: 480, aspectRatio: 4 / 3,
            borderRadius: 20, overflow: 'hidden',
            borderWidth: 2, borderColor: isCaptureStep ? '#ef4444' : '#10b981',
            backgroundColor: '#0f172a', marginBottom: 20,
          }}>
            {Platform.OS === 'web' ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <CameraView
                ref={cameraViewRef}
                style={{ width: '100%', height: '100%' }}
                facing="front"
              />
            )}

            {/* Overlay corner brackets */}
            <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
              {[{ top: 12, left: 12 }, { top: 12, right: 12 }, { bottom: 12, left: 12 }, { bottom: 12, right: 12 }].map((pos, i) => (
                <View key={i} style={[{ position: 'absolute', width: 28, height: 28, borderColor: '#ef4444', borderWidth: 3 }, pos,
                  { borderTopWidth: i < 2 ? 3 : 0, borderBottomWidth: i >= 2 ? 3 : 0, borderLeftWidth: i % 2 === 0 ? 3 : 0, borderRightWidth: i % 2 === 1 ? 3 : 0 }]} />
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ width: '100%', maxWidth: 480, gap: 12 }}>
            {isCaptureStep && (
              <>
                {/* CAPTURE BUTTON */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#DC2626', paddingVertical: 18, borderRadius: 16,
                    alignItems: 'center', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
                  }}
                  onPress={handleCapturePhoto}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 }}>
                    📷  Take Photo & End Duty
                  </Text>
                </TouchableOpacity>

                {/* Skip photo option */}
                <TouchableOpacity
                  style={{ paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b' }}
                  onPress={handleConfirmCheckoutNoPhoto}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '600' }}>
                    Skip Photo & End Duty
                  </Text>
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                  onPress={() => setCheckoutStep(null)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '600' }}>← Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {checkoutStep === 'submitting' && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontWeight: '600' }}>Saving checkout photo...</Text>
              </View>
            )}
          </View>

          {/* Pay Summary */}
          <View style={{ marginTop: 16, width: '100%', maxWidth: 480, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>EARNED</Text>
              <Text style={{ color: '#10b981', fontSize: 20, fontWeight: '800', marginTop: 2 }}>₹{earnedPay.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>TIME WORKED</Text>
              <Text style={{ color: '#38bdf8', fontSize: 20, fontWeight: '800', marginTop: 2 }}>{formatHM(earnedSeconds)}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── MAIN ACTIVE DUTY SCREEN ───
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.auditBadgeText}>{getScoreBadge()}</Text>
            <Text style={styles.auditBadgeSubtext}>Main Kiosk Terminal</Text>
          </View>
          {lateInfo && (
            <View style={[styles.lateCard, lateInfo.isLate ? styles.lateCardWarning : styles.lateCardSuccess]}>
              <Text style={[styles.lateCardTitle, lateInfo.isLate ? styles.lateTextWarning : styles.lateTextSuccess]}>
                {lateInfo.title}
              </Text>
              <Text style={styles.lateCardSubtitle}>{lateInfo.subtitle}</Text>
              {penaltyMinutes > 0 && (
                <Text style={styles.penaltyText}>⚠️ Penalty: -₹{penaltyPay.toLocaleString('en-IN')} ({penaltyMinutes}m late)</Text>
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
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${Math.round(shiftProgress * 100)}%` as any }]} />
          </View>
          <View style={styles.shiftStatusRow}>
            {isShiftComplete ? (
              <Text style={styles.shiftCompleteText}>✅ Shift target reached! (Auto-close in 2h)</Text>
            ) : (
              <Text style={styles.shiftRemainingText}>⏳ {formatHM(remainingSeconds)} of {formatHM(shiftTotalSeconds)} remaining</Text>
            )}
          </View>
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

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {isOnBreak ? (
            <TouchableOpacity style={styles.resumeButton} onPress={handleToggleBreak} activeOpacity={0.85}>
              <Text style={styles.resumeButtonText}>▶️  Resume Duty</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.breakButton} onPress={handleToggleBreak} activeOpacity={0.85}>
              <Text style={styles.breakButtonText}>☕  Start Break</Text>
            </TouchableOpacity>
          )}

          {/* END DUTY — triggers camera capture */}
          <TouchableOpacity style={styles.endButton} onPress={handleEndDutyTap} activeOpacity={0.85}>
            <Text style={styles.endButtonText}>📷  End Duty & Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backKioskButton} onPress={() => router.push('/')} activeOpacity={0.85}>
            <Text style={styles.backKioskButtonText}>⬅️  Back to Kiosk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  scrollContent: { paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center' },
  headerCard: {
    width: '100%', maxWidth: 480, backgroundColor: '#0F172A', borderWidth: 1,
    borderColor: '#1E293B', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 16,
  },
  profileBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileInitials: { color: '#fff', fontSize: 24, fontWeight: '800' },
  employeeName: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  employeeRole: { fontSize: 14, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
  auditBadgeContainer: {
    marginTop: 12, backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center',
  },
  auditBadgeText: { color: '#34D399', fontSize: 13, fontWeight: '700' },
  auditBadgeSubtext: { color: '#64748B', fontSize: 11, marginTop: 2 },
  lateCard: { width: '100%', borderRadius: 16, padding: 12, marginTop: 14, alignItems: 'center' },
  lateCardWarning: { backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  lateCardSuccess: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' },
  lateCardTitle: { fontSize: 14, fontWeight: '800' },
  lateTextWarning: { color: '#FBBF24' },
  lateTextSuccess: { color: '#34D399' },
  lateCardSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  penaltyText: { fontSize: 12, color: '#F87171', fontWeight: '700', marginTop: 4 },
  timerContainer: {
    width: '100%', maxWidth: 480, backgroundColor: '#0F172A', borderWidth: 1,
    borderColor: '#1E293B', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 16,
  },
  timerContainerBreak: { borderColor: '#F59E0B' },
  timerHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusDotActive: { backgroundColor: '#10B981' },
  statusDotBreak: { backgroundColor: '#F59E0B' },
  timerLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.2 },
  timerValue: { fontSize: 44, fontWeight: '800', color: '#38BDF8', marginVertical: 4, fontVariant: ['tabular-nums'] },
  timerValueBreak: { color: '#FBBF24' },
  progressBarContainer: { width: '100%', height: 6, backgroundColor: '#1E293B', borderRadius: 3, overflow: 'hidden', marginVertical: 12 },
  progressBarFill: { height: '100%', backgroundColor: '#38BDF8', borderRadius: 3 },
  shiftStatusRow: { marginBottom: 14 },
  shiftRemainingText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  shiftCompleteText: { color: '#34D399', fontSize: 13, fontWeight: '700' },
  earnedPillRow: { flexDirection: 'row', width: '100%', gap: 12 },
  earnedPill: { flex: 1, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', padding: 12, borderRadius: 16, alignItems: 'center' },
  ratePill: { flex: 1, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', padding: 12, borderRadius: 16, alignItems: 'center' },
  earnedLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.8 },
  earnedValue: { fontSize: 18, fontWeight: '800', color: '#10B981', marginTop: 2 },
  rateValue: { fontSize: 18, fontWeight: '800', color: '#C084FC', marginTop: 2 },
  actionContainer: { width: '100%', maxWidth: 480, gap: 12 },
  breakButton: { backgroundColor: '#EA580C', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  breakButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resumeButton: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  resumeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  endButton: {
    backgroundColor: '#DC2626', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  endButtonText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  backKioskButton: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  backKioskButtonText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
});
