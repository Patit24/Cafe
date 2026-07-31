import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCameraPermissions, CameraView } from 'expo-camera';

export default function CameraScreen() {
  const [status, setStatus] = useState('scanning'); // scanning, verifying, success, failed
  const router = useRouter();
  const { employeeId } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    // Only run the mock scanning process if permission is granted
    if (!permission?.granted) return;

    // Simulate the scanning process
    if (status === 'scanning') {
      const timer = setTimeout(() => setStatus('verifying'), 2000);
      return () => clearTimeout(timer);
    } else if (status === 'verifying') {
      const timer = setTimeout(() => setStatus('success'), 1500);
      return () => clearTimeout(timer);
    }
  }, [status, permission?.granted]);

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            We need your permission to use the camera for face verification.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace('/')}>
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Face Verification</Text>
        <Text style={styles.subtitle}>Please position your face within the frame</Text>
      </View>

      <View style={styles.cameraFrame}>
        <CameraView style={styles.mockCameraView} facing="front">
          {status === 'scanning' && (
            <View style={styles.scanLine} />
          )}
          {status === 'verifying' && (
            <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
          )}
          {status === 'success' && (
            <View style={styles.successOverlay}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
          )}
          {status === 'failed' && (
            <View style={styles.failedOverlay}>
              <Text style={styles.failedIcon}>✕</Text>
            </View>
          )}
        </CameraView>
      </View>

      <View style={styles.statusContainer}>
        {status === 'scanning' && <Text style={styles.statusText}>Detecting face...</Text>}
        {status === 'verifying' && <Text style={styles.statusText}>Verifying identity...</Text>}
        {status === 'success' && (
          <>
            <Text style={[styles.statusText, { color: '#2D9CDB' }]}>Match Found!</Text>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => router.push(`/duty?employeeId=${employeeId || '1'}`)}
            >
              <Text style={styles.continueButtonText}>Start Duty</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'failed' && (
          <>
            <Text style={[styles.statusText, { color: '#ba1a1a' }]}>Verification Failed</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setStatus('scanning')}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace('/')}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041627', // dark background for camera
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#b7c8de',
    marginTop: 8,
  },
  cameraFrame: {
    width: 300,
    height: 400,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a2b3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCameraView: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#2D9CDB',
    position: 'absolute',
    top: '50%',
    shadowColor: '#2D9CDB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  loader: {
    transform: [{ scale: 1.5 }],
  },
  successOverlay: {
    backgroundColor: 'rgba(45, 156, 219, 0.3)',
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: '#2D9CDB',
    fontWeight: 'bold',
  },
  failedOverlay: {
    backgroundColor: 'rgba(186, 26, 26, 0.3)',
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedIcon: {
    fontSize: 64,
    color: '#ba1a1a',
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#2D9CDB',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#ba1a1a',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    color: '#b7c8de',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  permissionSubtitle: {
    fontSize: 16,
    color: '#b7c8de',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#2D9CDB',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
