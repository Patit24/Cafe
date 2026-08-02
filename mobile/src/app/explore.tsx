import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabTwoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shift Schedule & Policy Guide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⏰ Standard Duty Hours</Text>
          <Text style={styles.infoText}>Standard Shift: 08:00 AM – 05:00 PM (9 Hours)</Text>
          <Text style={styles.infoSubtext}>Please check in using face verification at the kiosk before your shift begins.</Text>
        </View>

        <View style={styles.infoCardWarning}>
          <Text style={styles.warningTitle}>⚠️ Late Arrival Penalty Rules</Text>
          <Text style={styles.warningText}>• 10 Mins Late: 1 Hour Salary Deducted (-₹20.83)</Text>
          <Text style={styles.warningText}>• 30 Mins Late: 2 Hours Salary Deducted (-₹41.66)</Text>
          <Text style={styles.warningSubtext}>Penalties are automatically calculated from your check-in timestamp.</Text>
        </View>

        <View style={styles.infoCardSuccess}>
          <Text style={styles.successTitle}>📸 Neural Face Check-In</Text>
          <Text style={styles.successText}>Look straight into the kiosk camera. Verification completes in 1 second with 128D neural face matching.</Text>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/')}>
          <Text style={styles.homeButtonText}>⬅️ Return to Kiosk Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  infoSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },
  infoCardWarning: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 20,
    padding: 20,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#c2410c',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9a3412',
    marginTop: 4,
  },
  warningSubtext: {
    fontSize: 12,
    color: '#ea580c',
    marginTop: 8,
  },
  infoCardSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 20,
    padding: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    fontWeight: '500',
  },
  homeButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
