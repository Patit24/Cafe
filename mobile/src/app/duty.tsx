import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function DutyTimerScreen() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0); 
  const [isOnBreak, setIsOnBreak] = useState(false);
  const router = useRouter();
  const { employeeId } = useLocalSearchParams();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isOnBreak) {
      timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOnBreak]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileBadge}>
          <Text style={styles.profileInitials}>RD</Text>
        </View>
        <Text style={styles.employeeName}>Rahul Das</Text>
        <Text style={styles.employeeRole}>Kitchen Staff (12H)</Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>{isOnBreak ? 'ON BREAK' : 'ACTIVE DUTY'}</Text>
        <Text style={[styles.timerValue, isOnBreak && styles.timerPaused]}>
          {formatTime(elapsedSeconds)}
        </Text>
        <Text style={styles.shiftTargetText}>Target: 12:00:00</Text>
      </View>

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
          <Text style={styles.endButtonText}>End Duty</Text>
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
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#041627',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b1c1c',
  },
  employeeRole: {
    fontSize: 16,
    color: '#44474c',
    marginTop: 4,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c4c6cd',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#74777d',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 56,
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
    width: '90%',
    gap: 16,
    marginBottom: 20,
  },
  breakButton: {
    backgroundColor: '#F2994A',
    paddingVertical: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  breakButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  resumeButton: {
    backgroundColor: '#2D9CDB',
    paddingVertical: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    borderRadius: 8,
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
