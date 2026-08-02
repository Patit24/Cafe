import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, ScrollView } from 'react-native';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shift Summary</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.dateText}>Today, Oct 24</Text>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Total Hours</Text>
              <Text style={styles.metricValue}>11.5h</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Break Time</Text>
              <Text style={styles.metricValue}>30m</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Overtime</Text>
              <Text style={styles.metricValue}>0.0h</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Shift Timeline</Text>
        
        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#2D9CDB' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTime}>08:00 AM</Text>
              <Text style={styles.timelineEvent}>Clocked In</Text>
            </View>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, { backgroundColor: '#F2994A' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTime}>01:00 PM</Text>
              <Text style={styles.timelineEvent}>Started Break</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, { backgroundColor: '#2D9CDB' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTime}>01:30 PM</Text>
              <Text style={styles.timelineEvent}>Resumed Duty</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, { backgroundColor: '#041627' }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTime}>08:00 PM</Text>
              <Text style={styles.timelineEvent}>Clocked Out</Text>
            </View>
          </View>
        </View>
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
  },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
  },
  timelineContainer: {
    paddingLeft: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: -24,
    bottom: 24,
    width: 2,
    backgroundColor: '#cbd5e1',
    zIndex: -1,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  timelineContent: {
    marginLeft: 16,
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  timelineEvent: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
});
