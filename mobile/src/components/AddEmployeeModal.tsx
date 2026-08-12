import React, { useState, useRef } from 'react';
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
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Webcam from 'react-webcam';
import { API_BASE_URL } from '@/lib/api';
import { generateNeuralFaceEmbedding } from '@/utils/faceEmbedding';

interface AddEmployeeModalProps {
  visible: boolean;
  onClose: () => void;
  onEmployeeAdded: (employee: any) => void;
}

type AngleType = 'center' | 'left' | 'right';

interface CapturedFace {
  angle: AngleType;
  label: string;
  photoUrl: string;
  embedding?: number[];
}

export default function AddEmployeeModal({
  visible,
  onClose,
  onEmployeeAdded,
}: AddEmployeeModalProps) {
  // Step State: 1 = Form Details, 2 = Live Face Capture, 3 = Processing & Save
  const [step, setStep] = useState<1 | 2>(1);

  // Employee Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Kitchen Staff');
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily' | 'hourly'>('monthly');
  const [baseRate, setBaseRate] = useState('15000');
  const [dutyStartTime, setDutyStartTime] = useState('08:00');
  const [dutyEndTime, setDutyEndTime] = useState('17:00');

  // Camera & Face Capture State
  const [currentAngleIndex, setCurrentAngleIndex] = useState<number>(0);
  const [capturedFaces, setCapturedFaces] = useState<CapturedFace[]>([]);
  const [permission, requestPermission] = useCameraPermissions();
  const webcamRef = useRef<Webcam>(null);
  const cameraViewRef = useRef<CameraView>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const angles: { angle: AngleType; label: string; icon: string; instruction: string }[] = [
    { angle: 'center', label: 'Center Front', icon: '👤', instruction: 'Look straight directly into the camera' },
    { angle: 'left', label: 'Left Profile', icon: '👈', instruction: 'Turn your head slightly to the LEFT' },
    { angle: 'right', label: 'Right Profile', icon: '👉', instruction: 'Turn your head slightly to the RIGHT' },
  ];

  const resetForm = () => {
    setName('');
    setRole('Kitchen Staff');
    setSalaryType('monthly');
    setBaseRate('15000');
    setDutyStartTime('08:00');
    setDutyEndTime('17:00');
    setStep(1);
    setCurrentAngleIndex(0);
    setCapturedFaces([]);
    setStatusMsg('');
  };

  const handleNextToFaceCapture = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter employee full name.');
      } else {
        Alert.alert('Required Field', 'Please enter employee full name.');
      }
      return;
    }

    if (Platform.OS !== 'web' && (!permission || !permission.granted)) {
      requestPermission();
    }

    setStep(2);
  };

  const handleCapturePhoto = async () => {
    try {
      let imageUri: string | null = null;

      if (Platform.OS === 'web') {
        if (webcamRef.current) {
          imageUri = webcamRef.current.getScreenshot();
        }
      } else {
        if (cameraViewRef.current) {
          const photo = await cameraViewRef.current.takePictureAsync({ base64: true, quality: 0.8 });
          if (photo?.base64) {
            imageUri = `data:image/jpeg;base64,${photo.base64}`;
          } else if (photo?.uri) {
            imageUri = photo.uri;
          }
        }
      }

      if (!imageUri) {
        if (Platform.OS === 'web') alert('Could not capture frame from camera.');
        return;
      }

      const activeAngleObj = angles[currentAngleIndex];
      const newCaptured: CapturedFace = {
        angle: activeAngleObj.angle,
        label: activeAngleObj.label,
        photoUrl: imageUri,
      };

      const updatedFaces = [...capturedFaces.filter(f => f.angle !== activeAngleObj.angle), newCaptured];
      setCapturedFaces(updatedFaces);

      if (currentAngleIndex < angles.length - 1) {
        setCurrentAngleIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to capture photo:', err);
    }
  };

  const handleRetakeAngle = (index: number) => {
    setCurrentAngleIndex(index);
  };

  const handleSaveEmployeeProfile = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    setStatusMsg('Saving employee profile to database...');

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

      // 1. Create Employee Profile in PostgreSQL
      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const createdEmployee = await res.json();
      const empId = createdEmployee.id;

      // 2. Upload Captured Face Angles & Extract Neural Embeddings
      if (empId && capturedFaces.length > 0) {
        setStatusMsg('Extracting neural face embeddings for live recognition...');
        for (const face of capturedFaces) {
          try {
            let embedding: number[] | null = null;
            if (face.photoUrl) {
              embedding = await generateNeuralFaceEmbedding(face.photoUrl);
            }

            await fetch(`${API_BASE_URL}/employees/${empId}/faces`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                angle: face.angle,
                imageUrl: face.photoUrl,
                faceEmbedding: embedding || undefined,
              }),
            });
          } catch (faceErr) {
            console.warn(`Failed to save face angle ${face.angle}:`, faceErr);
          }
        }
      }

      let finalEmployee = createdEmployee;
      if (empId) {
        try {
          const updatedRes = await fetch(`${API_BASE_URL}/employees/${empId}`);
          if (updatedRes.ok) {
            finalEmployee = await updatedRes.json();
          }
        } catch (fetchErr) {
          console.warn('Could not refetch employee with faces:', fetchErr);
        }
      }

      if (Platform.OS === 'web') {
        alert(`✅ Employee "${createdEmployee.name}" added with ${capturedFaces.length} face angle(s)!`);
      } else {
        Alert.alert('Success', `Employee "${createdEmployee.name}" added with ${capturedFaces.length} face angle(s)!`);
      }

      onEmployeeAdded(finalEmployee);
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
      setStatusMsg('');
    }
  };

  const currentAngle = angles[currentAngleIndex];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {step === 1 ? 'Add New Staff Profile' : '📸 Multi-Angle Live Face ID'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1
                  ? 'Step 1 of 2: Fill personal & payroll details'
                  : 'Step 2 of 2: Capture live face photos from 3 angles'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* STEP 1: FORM DETAILS */}
          {step === 1 && (
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
                    style={[styles.typePill, salaryType === 'monthly' && styles.typePillActive]}
                    onPress={() => setSalaryType('monthly')}
                  >
                    <Text style={[styles.typePillText, salaryType === 'monthly' && styles.typePillTextActive]}>
                      📅 Monthly
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typePill, salaryType === 'daily' && styles.typePillActive]}
                    onPress={() => setSalaryType('daily')}
                  >
                    <Text style={[styles.typePillText, salaryType === 'daily' && styles.typePillTextActive]}>
                      ☀️ Daily
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typePill, salaryType === 'hourly' && styles.typePillActive]}
                    onPress={() => setSalaryType('hourly')}
                  >
                    <Text style={[styles.typePillText, salaryType === 'hourly' && styles.typePillTextActive]}>
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
          )}

          {/* STEP 2: LIVE MULTI-ANGLE FACE CAPTURE */}
          {step === 2 && (
            <View style={styles.cameraStepContainer}>
              {/* Instruction Badge */}
              <View style={styles.angleInstructionCard}>
                <Text style={styles.angleStepCount}>ANGLE {currentAngleIndex + 1} OF 3</Text>
                <Text style={styles.angleTitle}>
                  {currentAngle.icon} {currentAngle.label}
                </Text>
                <Text style={styles.angleSubInstruction}>{currentAngle.instruction}</Text>
              </View>

              {/* Live Camera Viewport */}
              <View style={styles.cameraFrameContainer}>
                {Platform.OS === 'web' ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                    style={styles.webcamView}
                  />
                ) : (
                  <CameraView ref={cameraViewRef} facing="front" style={styles.webcamView} />
                )}

                {/* Target Alignment Guide Ring */}
                <View style={styles.faceTargetOverlay}>
                  <View style={styles.targetRing} />
                </View>
              </View>

              {/* Capture Action Button */}
              <TouchableOpacity style={styles.captureActionBtn} onPress={handleCapturePhoto} activeOpacity={0.8}>
                <Text style={styles.captureActionBtnText}>
                  📸 Snap {currentAngle.label} Photo
                </Text>
              </TouchableOpacity>

              {/* Captured Thumbnails Strip */}
              <Text style={styles.thumbnailStripTitle}>CAPTURED ANGLE PHOTOS:</Text>
              <View style={styles.thumbnailRow}>
                {angles.map((item, idx) => {
                  const captured = capturedFaces.find(f => f.angle === item.angle);
                  const isCurrent = idx === currentAngleIndex;

                  return (
                    <TouchableOpacity
                      key={item.angle}
                      style={[
                        styles.thumbCard,
                        isCurrent && styles.thumbCardActive,
                        captured && styles.thumbCardCaptured,
                      ]}
                      onPress={() => handleRetakeAngle(idx)}
                    >
                      {captured?.photoUrl ? (
                        <Image source={{ uri: captured.photoUrl }} style={styles.thumbImage} />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <Text style={styles.thumbIcon}>{item.icon}</Text>
                          <Text style={styles.thumbLabel}>{item.label.split(' ')[0]}</Text>
                        </View>
                      )}

                      {captured && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkBadgeText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons Footer */}
          <View style={styles.footer}>
            {step === 1 ? (
              <>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNextToFaceCapture} style={styles.saveBtn} activeOpacity={0.8}>
                  <Text style={styles.saveBtnText}>📸 Next: Capture Live Face ➔</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.cancelBtn} disabled={isSubmitting}>
                  <Text style={styles.cancelBtnText}>⬅ Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveEmployeeProfile}
                  disabled={isSubmitting || capturedFaces.length === 0}
                  style={[
                    styles.saveBtn,
                    (isSubmitting || capturedFaces.length === 0) && styles.saveBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.saveBtnText}>{statusMsg || 'Saving...'}</Text>
                    </View>
                  ) : (
                    <Text style={styles.saveBtnText}>
                      ⚡ Complete Profile ({capturedFaces.length}/3 Angles)
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    maxHeight: '90%',
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
    marginBottom: 16,
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
    maxHeight: 400,
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
  cameraStepContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  angleInstructionCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  angleStepCount: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  angleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 2,
  },
  angleSubInstruction: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cameraFrameContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    marginVertical: 6,
  },
  webcamView: {
    width: 220,
    height: 220,
    objectFit: 'cover',
  },
  faceTargetOverlay: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.6)',
    borderStyle: 'dashed',
  },
  targetRing: {
    flex: 1,
  },
  captureActionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginVertical: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  captureActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  thumbnailStripTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  thumbnailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  thumbCard: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbCardActive: {
    borderColor: '#38BDF8',
    borderWidth: 2,
  },
  thumbCardCaptured: {
    borderColor: '#10B981',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    alignItems: 'center',
  },
  thumbIcon: {
    fontSize: 16,
  },
  thumbLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
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
    paddingVertical: 14,
    paddingHorizontal: 22,
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
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
