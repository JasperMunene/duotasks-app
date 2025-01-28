import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

export function InsightsSummary({ insights, minimized = false }: { insights: any, minimized?: boolean }) {
  if (!insights) return null;

  const { earnings, spending, activity } = insights;

  if (minimized) {
    // Compact, single-row summary
    return (
      <View style={styles.minimizedContainer}>
        <View style={styles.minimizedItem}>
          <Ionicons name="wallet" size={18} color="#2eac5f" />
          <Text style={styles.minimizedValue}>KES {earnings.total?.toLocaleString() ?? 0}</Text>
        </View>
        <View style={styles.minimizedItem}>
          <Ionicons name="card" size={18} color="#f4a261" />
          <Text style={styles.minimizedValue}>KES {spending.total?.toLocaleString() ?? 0}</Text>
        </View>
        <View style={styles.minimizedItem}>
          <Ionicons name="stats-chart" size={18} color="#3b5bdb" />
          <Text style={styles.minimizedValue}>{activity.completion_rate ?? 0}%</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <Text style={styles.sectionTitle}>Your Activity Insights</Text>
      <View style={styles.listContainer}>
        {/* Earnings Card */}
        <View style={[styles.card, { backgroundColor: '#e6f9f0' }]}> 
          <Ionicons name="wallet" size={28} color="#2eac5f" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Earnings</Text>
            <Text style={styles.cardValue}>KES {earnings.total?.toLocaleString() ?? 0}</Text>
            <Text style={styles.cardSub}>
              Avg/Task: KES {earnings.average_per_task?.toLocaleString() ?? 0}
            </Text>
            <Text style={styles.cardSub}>
              This Month: KES {earnings.this_month?.toLocaleString() ?? 0}
            </Text>
          </View>
        </View>
        {/* Spending Card */}
        <View style={[styles.card, { backgroundColor: '#f9f6e6' }]}> 
          <Ionicons name="card" size={28} color="#f4a261" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Spending</Text>
            <Text style={styles.cardValue}>KES {spending.total?.toLocaleString() ?? 0}</Text>
            <Text style={styles.cardSub}>
              Avg/Task: KES {spending.average_per_task?.toLocaleString() ?? 0}
            </Text>
            <Text style={styles.cardSub}>
              This Month: KES {spending.this_month?.toLocaleString() ?? 0}
            </Text>
          </View>
        </View>
        {/* Activity Card */}
        <View style={[styles.card, { backgroundColor: '#e6e9f9' }]}> 
          <Ionicons name="stats-chart" size={28} color="#3b5bdb" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Activity</Text>
            <Text style={styles.cardValue}>{activity.total_activities ?? 0} Activities</Text>
            <Text style={styles.cardSub}>
              Posted: {activity.total_posted ?? 0} | Assigned: {activity.total_assigned ?? 0}
            </Text>
            <Text style={styles.cardSub}>
              Completion Rate: {activity.completion_rate ?? 0}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#f8fafd',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  container: {
    display: 'none', // not used in list layout
  },
  listContainer: {
    flexDirection: 'column',
    gap: 14,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: '#666',
  },
  minimizedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafd',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    gap: 16,
  },
  minimizedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minimizedValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 2,
  },
}); 