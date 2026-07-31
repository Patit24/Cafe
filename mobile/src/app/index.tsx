import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Modal, FlatList, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

export default function AttendanceHome() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fetch employees
    fetch('http://localhost:3001/employees')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEmployees(data);
      })
      .catch(err => console.error('Failed to fetch employees:', err));
      
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const filteredEmployees = employees.filter(emp => 
    (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectEmployee = (employeeId: string) => {
    setModalVisible(false);
    setSearchQuery('');
    // Navigate to camera and pass the employee ID
    router.push(`/camera?employeeId=${employeeId}`);
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
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Employee</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search your name..."
              placeholderTextColor="#74777d"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredEmployees}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.employeeItem}
                  onPress={() => handleSelectEmployee(item.id)}
                >
                  <Text style={styles.employeeName}>{item.name}</Text>
                  <Text style={styles.employeeRole}>{item.role}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No employees found.</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#041627',
  },
  closeText: {
    fontSize: 16,
    color: '#005a9e',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#f0f1f3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    color: '#1b1c1c',
  },
  employeeItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e2e8',
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1b1c1c',
  },
  employeeRole: {
    fontSize: 14,
    color: '#74777d',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#74777d',
    marginTop: 32,
    fontSize: 16,
  }
});
