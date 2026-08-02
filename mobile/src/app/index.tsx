import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Modal, FlatList, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/lib/api';

export default function AttendanceHome() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({});

  const loadData = async (showSpinner = true) => {
    if (showSpinner && employees.length === 0) {
      setLoading(true);
    }
    try {
      const [empRes, attRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employees`),
        fetch(`${API_BASE_URL}/attendance`),
      ]);

      const empData = await empRes.json();
      const attData = await attRes.json();

      if (Array.isArray(empData)) setEmployees(empData);

      if (Array.isArray(attData)) {
        const map: Record<string, any> = {};
        for (const att of attData) {
          if (att.status === 'working' || att.status === 'on_break') {
            map[att.employeeId] = att;
          }
        }
        setAttendanceMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch kiosk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadData();
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const filteredEmployees = employees.filter(emp => 
    (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEmployee = (emp: any) => {
    setModalVisible(false);
    setSearchQuery('');
    
    const activeAtt = attendanceMap[emp.id];
    if (activeAtt) {
      // Already checked in / working -> Go straight to active duty screen
      router.push(`/duty?employeeId=${emp.id}&employeeName=${encodeURIComponent(emp.name)}&score=${activeAtt.faceMatchScore === '-1' ? 'Manual Photo' : 'Verified'}`);
    } else {
      // Off duty -> Go to camera for face or manual photo check-in
      router.push(`/camera?employeeId=${emp.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>Evening Light</Text>
        <Text style={styles.brandSubtitle}>Kitchen Staff Attendance</Text>
      </View>

      <View style={styles.clockContainer}>
        <Text style={styles.timeText}>{timeString}</Text>
        <Text style={styles.dateText}>{dateString}</Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.primaryButtonText}>Select Profile to Check In</Text>
        </TouchableOpacity>
        
        <Text style={styles.instructionText}>
          Find your name first, then look directly at the camera.
        </Text>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onShow={() => loadData(false)}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Employee Profile</Text>
                <Text style={styles.modalSubTitle}>Choose your profile to check in or view active duty</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Type your name..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item }) => {
                const activeAtt = attendanceMap[item.id];
                const isWorking = !!activeAtt;
                const isBreak = activeAtt?.status === 'on_break';

                return (
                  <TouchableOpacity 
                    style={[styles.employeeCard, isWorking && styles.employeeCardWorking]} 
                    onPress={() => handleSelectEmployee(item)}
                  >
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(item.name || 'EL').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeNameText}>{item.name}</Text>
                      <Text style={styles.employeeRoleText}>{item.role?.name || 'Kitchen Staff'}</Text>
                    </View>

                    {/* Real-time Duty Status Badge */}
                    <View style={[
                      styles.statusBadge, 
                      isWorking ? (isBreak ? styles.statusBreak : styles.statusWorking) : styles.statusOffDuty
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        isWorking ? (isBreak ? styles.statusBreakText : styles.statusWorkingText) : styles.statusOffDutyText
                      ]}>
                        {isWorking ? (isBreak ? '☕ ON BREAK' : '🟢 WORKING') : '🔴 OFF DUTY'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {loading ? 'Loading employees from backend...' : 'No matching employees found.'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#041627',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#44474c',
    marginTop: 4,
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c4c6cd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    width: '90%',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1b1c1c',
    fontVariant: ['tabular-nums'],
  },
  dateText: {
    fontSize: 18,
    color: '#44474c',
    marginTop: 8,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#041627',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#041627',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  instructionText: {
    marginTop: 16,
    fontSize: 14,
    color: '#74777d',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 15,
    marginBottom: 18,
    color: '#0f172a',
    fontWeight: '500',
  },
  employeeCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeCardWorking: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  employeeRoleText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusWorking: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  statusWorkingText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
  },
  statusBreak: {
    backgroundColor: '#ffedd5',
    borderWidth: 1,
    borderColor: '#fb923c',
  },
  statusBreakText: {
    color: '#c2410c',
    fontWeight: '700',
    fontSize: 12,
  },
  statusOffDuty: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  statusOffDutyText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 12,
  },
  statusBadgeText: {
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
});
