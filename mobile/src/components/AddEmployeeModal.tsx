import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { API_BASE_URL } from '@/lib/api';

interface AddEmployeeModalProps {
  visible: boolean;
  onClose: () => void;
  onEmployeeAdded: (employee: any) => void;
}

export default function AddEmployeeModal({
  visible,
  onClose,
  onEmployeeAdded,
}: AddEmployeeModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Kitchen Staff');
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily' | 'hourly'>('monthly');
  const [baseRate, setBaseRate] = useState('15000');
  const [dutyStartTime, setDutyStartTime] = useState('08:00');
  const [dutyEndTime, setDutyEndTime] = useState('17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setRole('Kitchen Staff');
    setSalaryType('monthly');
    setBaseRate('15000');
    setDutyStartTime('08:00');
    setDutyEndTime('17:00');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter employee full name.');
      } else {
        Alert.alert('Required Field', 'Please enter employee full name.');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const newCode = `EMP-${Math.floor(Math.random() * 900) + 100}`;
      const rateNum = parseFloat(baseRate.replace(/[^0-9.]/g, '')) || 15000;
      const roleVal = role.trim() || 'Kitchen Staff';

      const payload = {
        employeeCode: newCode,
        name: name.trim(),
        role: roleVal,
        salaryType,
        salaryRate: rateNum,
        isActive: true,
      };

      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const createdEmployee = await res.json();

      if (Platform.OS === 'web') {
        alert(`✅ Employee "${createdEmployee.name}" added successfully!`);
      } else {
        Alert.alert('Success', `Employee "${createdEmployee.name}" added successfully!`);
      }

      onEmployeeAdded(createdEmployee);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to add employee:', err);
      const errMsg = err?.message || 'Could not connect to database server.';
      if (Platform.OS === 'web') {
        alert(`Error: ${errMsg}`);
      } else {
        Alert.alert('Failed to Save', errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add New Employee</Text>
              <Text style={styles.subtitle}>Save profile details to PostgreSQL database</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Das"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Role / Position */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role / Position</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kitchen Chef, Head Cook, Waiter"
                placeholderTextColor="#94a3b8"
                value={role}
                onChangeText={setRole}
              />
            </View>

            {/* Salary Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salary Payment Cycle</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[
                    styles.typePill,
                    salaryType === 'monthly' && styles.typePillActive,
                  ]}
                  onPress={() => setSalaryType('monthly')}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      salaryType === 'monthly' && styles.typePillTextActive,
                    ]}
                  >
                    📅 Monthly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typePill,
                    salaryType === 'daily' && styles.typePillActive,
                  ]}
                  onPress={() => setSalaryType('daily')}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      salaryType === 'daily' && styles.typePillTextActive,
                    ]}
                  >
                    ☀️ Daily
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typePill,
                    salaryType === 'hourly' && styles.typePillActive,
                  ]}
                  onPress={() => setSalaryType('hourly')}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      salaryType === 'hourly' && styles.typePillTextActive,
                    ]}
                  >
                    ⏱️ Hourly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Base Salary Rate */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Base Salary Rate (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={baseRate}
                onChangeText={setBaseRate}
              />
            </View>

            {/* Shift Duty Hours */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assigned Duty Hours</Text>
              <View style={styles.dutyRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.subLabel}>Duty Start</Text>
                  <TextInput
                    style={styles.input}
                    value={dutyStartTime}
                    onChangeText={setDutyStartTime}
                    placeholder="08:00"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.subLabel}>Duty End</Text>
                  <TextInput
                    style={styles.input}
                    value={dutyEndTime}
                    onChangeText={setDutyEndTime}
                    placeholder="17:00"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Employee</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  formScroll: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  typePillActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#f3e8ff',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  typePillTextActive: {
    color: '#6d28d9',
    fontWeight: '700',
  },
  dutyRow: {
    flexDirection: 'row',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  saveBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
