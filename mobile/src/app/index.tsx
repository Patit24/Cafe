import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Modal, FlatList, TextInput, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/lib/api';
import AddEmployeeModal from '@/components/AddEmployeeModal';

export default function AttendanceHome() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
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
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  // Analog Clock Calculations
  const seconds = currentTime.getSeconds();
  const minutes = currentTime.getMinutes();
  const hours = currentTime.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = ((hours % 12) + minutes / 60) * 30;

  const filteredEmployees = employees.filter(emp => 
    (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEmployee = (emp: any) => {
    setModalVisible(false);
    setSearchQuery('');
    
    const activeAtt = attendanceMap[emp.id];
    if (activeAtt) {
      router.push(`/duty?employeeId=${emp.id}&employeeName=${encodeURIComponent(emp.name)}&score=${activeAtt.faceMatchScore === '-1' ? 'Manual Photo' : 'Verified'}`);
    } else {
      router.push(`/camera?employeeId=${emp.id}`);
    }
  };

  const handleEmployeeAdded = (newEmp: any) => {
    setEmployees(prev => [newEmp, ...prev]);
    loadData(false);
  };

  const avatarGradients = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6366F1'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />
      
      {/* Glow Backdrop Circles */}
      <View style={styles.topGlowCircle} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <View style={styles.badgePulseDot} />
          <Text style={styles.badgePillText}>2026 KIOSK OS • AI VERIFIED</Text>
        </View>
        <Text style={styles.brandTitle}>Evening Light</Text>
        <Text style={styles.brandSubtitle}>Kitchen Staff Attendance Portal</Text>
      </View>

      {/* Futuristic Analog Clock Card */}
      <View style={styles.clockCard}>
        <View style={styles.clockHeaderRow}>
          <Text style={styles.clockLabel}>REAL-TIME ANALOG CLOCK</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* 2026 Glowing Analog Clock Dial */}
        <View style={styles.analogClockFace}>
          {/* Dial Numbers */}
          <Text style={[styles.dialNumber, styles.num12]}>12</Text>
          <Text style={[styles.dialNumber, styles.num3]}>3</Text>
          <Text style={[styles.dialNumber, styles.num6]}>6</Text>
          <Text style={[styles.dialNumber, styles.num9]}>9</Text>

          {/* Dial Hour Ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <View
              key={deg}
              style={[
                styles.tickMark,
                { transform: [{ rotate: `${deg}deg` }, { translateY: -76 }] },
              ]}
            />
          ))}

          {/* Hour Hand */}
          <View
            style={[
              styles.hand,
              styles.hourHand,
              { transform: [{ rotate: `${hourDeg}deg` }] },
            ]}
          />

          {/* Minute Hand */}
          <View
            style={[
              styles.hand,
              styles.minuteHand,
              { transform: [{ rotate: `${minuteDeg}deg` }] },
            ]}
          />

          {/* Second Hand */}
          <View
            style={[
              styles.hand,
              styles.secondHand,
              { transform: [{ rotate: `${secondDeg}deg` }] },
            ]}
          />

          {/* Center Pivot */}
          <View style={styles.centerPivot} />
        </View>

        {/* Digital Time Sub-Pill */}
        <View style={styles.digitalSubPill}>
          <Text style={styles.digitalTimeText}>{timeString}</Text>
          <Text style={styles.dateText}>• {dateString}</Text>
        </View>
      </View>

      {/* Action Controls */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>✨ Select Profile to Check In</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>➕ Add New Employee Profile</Text>
        </TouchableOpacity>
        
        <View style={styles.instructionBadge}>
          <Text style={styles.instructionText}>
            💡 Tap your name first, then verify with quick face match.
          </Text>
        </View>
      </View>

      {/* Add Employee Form Modal */}
      <AddEmployeeModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onEmployeeAdded={handleEmployeeAdded}
      />

      {/* Profile Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onShow={() => loadData(false)}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Profile</Text>
                <Text style={styles.modalSubTitle}>Choose your account to check in or view duty</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity 
                  onPress={() => {
                    setModalVisible(false);
                    setAddModalVisible(true);
                  }}
                  style={styles.addNewInlineBtn}
                >
                  <Text style={styles.addNewInlineBtnText}>+ Add New</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search employee name..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item, index }) => {
                const activeAtt = attendanceMap[item.id];
                const isWorking = !!activeAtt;
                const isBreak = activeAtt?.status === 'on_break';
                const avatarBg = avatarGradients[index % avatarGradients.length];

                return (
                  <TouchableOpacity 
                    style={[styles.employeeCard, isWorking && styles.employeeCardWorking]} 
                    onPress={() => handleSelectEmployee(item)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
                      <Text style={styles.avatarText}>
                        {(item.name || 'EL').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeNameText}>{item.name}</Text>
                      <Text style={styles.employeeRoleText}>{item.role?.name || item.role || 'Kitchen Staff'}</Text>
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
                    {loading ? 'Loading staff directory...' : 'No matching employee profile found.'}
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
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 20 : 28,
    paddingHorizontal: 18,
  },
  topGlowCircle: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 8,
  },
  badgePillText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.8,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  clockCard: {
    width: '92%',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  clockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  clockLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  liveBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  analogClockFace: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#090D16',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 6,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  dialNumber: {
    position: 'absolute',
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  num12: { top: 8 },
  num3: { right: 10 },
  num6: { bottom: 8 },
  num9: { left: 10 },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 1,
  },
  hand: {
    position: 'absolute',
    bottom: '50%',
    left: '50%',
  },
  hourHand: {
    width: 4,
    height: 44,
    backgroundColor: '#38BDF8',
    borderRadius: 3,
    marginLeft: -2,
    transformOrigin: 'bottom center',
  },
  minuteHand: {
    width: 3,
    height: 62,
    backgroundColor: '#C084FC',
    borderRadius: 2,
    marginLeft: -1.5,
    transformOrigin: 'bottom center',
  },
  secondHand: {
    width: 2,
    height: 72,
    backgroundColor: '#F43F5E',
    borderRadius: 1,
    marginLeft: -1,
    transformOrigin: 'bottom center',
  },
  centerPivot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F43F5E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    zIndex: 10,
  },
  digitalSubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  digitalTimeText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  dateText: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '600',
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: '92%',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '92%',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#C084FC',
    fontSize: 15,
    fontWeight: '700',
  },
  instructionBadge: {
    marginTop: 14,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  instructionText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    fontSize: 15,
    marginBottom: 18,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  employeeCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeCardWorking: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  employeeRoleText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusWorking: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusWorkingText: {
    color: '#34D399',
    fontWeight: '700',
    fontSize: 12,
  },
  statusBreak: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusBreakText: {
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 12,
  },
  statusOffDuty: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: '#475569',
  },
  statusOffDutyText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 12,
  },
  statusBadgeText: {
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
  addNewInlineBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addNewInlineBtnText: {
    color: '#C084FC',
    fontWeight: '700',
    fontSize: 12,
  },
});
