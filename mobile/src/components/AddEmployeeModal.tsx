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
              <Text style={styles.title}>Add New Staff Profile</Text>
              <Text style={styles.subtitle}>Save profile & payroll settings to database</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                👤 Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Das"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Role / Position */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>💼 Role / Position</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kitchen Chef, Head Cook, Waiter"
                placeholderTextColor="#64748B"
                value={role}
                onChangeText={setRole}
              />
            </View>

            {/* Salary Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📊 Salary Payment Cycle</Text>
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
              <Text style={styles.label}>💰 Base Salary Rate (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15000"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={baseRate}
                onChangeText={setBaseRate}
              />
            </View>

            {/* Shift Duty Hours */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>⏰ Assigned Shift Hours</Text>
              <View style={styles.dutyRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.subLabel}>Shift Start</Text>
                  <TextInput
                    style={styles.input}
                    value={dutyStartTime}
                    onChangeText={setDutyStartTime}
                    placeholder="08:00"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.subLabel}>Shift End</Text>
                  <TextInput
                    style={styles.input}
                    value={dutyEndTime}
                    onChangeText={setDutyEndTime}
                    placeholder="17:00"
                    placeholderTextColor="#64748B"
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
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>⚡ Save Employee Profile</Text>
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
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  formScroll: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  required: {
    color: '#F43F5E',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  typePillActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  typePillTextActive: {
    color: '#C084FC',
    fontWeight: '700',
  },
  dutyRow: {
    flexDirection: 'row',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginRight: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  saveBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
