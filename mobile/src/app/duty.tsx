import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_BASE_URL = 'https://cafe-ho1d.onrender.com';

export default function DutyTimerScreen() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0); 
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { employeeId, score } = useLocalSearchParams<{ employeeId: string; score: string }>();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (!isOnBreak) {
      timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOnBreak]);

  useEffect(() => {
    if (!employeeId) return;

    fetch(`${API_BASE_URL}/employees/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        setEmployee(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load employee for duty:', err);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#041627" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Employee Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileBadge}>
          <Text style={styles.profileInitials}>{getInitials(employee?.name || 'Rahul Das')}</Text>
        </View>
        <Text style={styles.employeeName}>{employee?.name || 'Rahul Das'}</Text>
        <Text style={styles.employeeRole}>
          {employee?.role?.name || 'Kitchen Staff'} • {employee?.shift?.name || 'Standard Shift'}
        </Text>

        {/* Security Audit Badge */}
        <View style={styles.auditBadgeContainer}>
          <Text style={styles.auditBadgeText}>✓ Face Verified: {score || '94.2'}%</Text>
          <Text style={styles.auditBadgeSubtext}>Liveness: Passed • GPS: Office HQ</Text>
        </View>
      </View>

      {/* Duty Timer Box */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>{isOnBreak ? 'ON BREAK' : 'ACTIVE DUTY'}</Text>
        <Text style={[styles.timerValue, isOnBreak && styles.timerPaused]}>
          {formatTime(elapsedSeconds)}
        </Text>
        <Text style={styles.shiftTargetText}>Shift Target: 09:00:00</Text>
      </View>

      {/* Break / Check-Out Actions */}
      <View style={styles.actionContainer}>
        {isOnBreak ? (
          <TouchableOpacity style={styles.resumeButton} onPress={() => setIsOnBreak(false)}>
            <Text style={styles.resumeButtonText}>Resume Duty</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.breakButton} onPress={() => setIsOnBreak(true)}>
            <Text style={styles.breakButtonText}>Start Break</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.endButton} 
          onPress={() => router.push(`/history?employeeId=${employeeId || '1'}`)}
        >
          <Text style={styles.endButtonText}>Check Out & End Duty</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f9',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 12,
  },
  profileBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#041627',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileInitials: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b1c1c',
  },
  employeeRole: {
    fontSize: 15,
    color: '#44474c',
    marginTop: 4,
  },
  auditBadgeContainer: {
    backgroundColor: 'rgba(39, 174, 96, 0.12)',
    borderColor: '#27AE60',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  auditBadgeText: {
    color: '#27AE60',
    fontWeight: '700',
    fontSize: 14,
  },
  auditBadgeSubtext: {
    color: '#27AE60',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c4c6cd',
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#74777d',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 52,
    fontWeight: '700',
    color: '#041627',
    fontVariant: ['tabular-nums'],
  },
  timerPaused: {
    color: '#F2994A',
  },
  shiftTargetText: {
    fontSize: 14,
    color: '#74777d',
    marginTop: 12,
  },
  actionContainer: {
    width: '92%',
    gap: 14,
    marginBottom: 16,
  },
  breakButton: {
    backgroundColor: '#F2994A',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  breakButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  resumeButton: {
    backgroundColor: '#2D9CDB',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#041627',
  },
  endButtonText: {
    color: '#041627',
    fontSize: 18,
    fontWeight: '600',
  },
});
