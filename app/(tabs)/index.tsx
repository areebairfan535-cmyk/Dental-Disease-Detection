import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeDashboard() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Text style={styles.greeting}>Welcome Back</Text>
        <Text style={styles.subtitle}>Your dental AI assistant is ready to scan, track, and guide your oral health.</Text>
        
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Scans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>98%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/detection')}>
          <Ionicons name="scan-outline" size={22} color="#fff" />
          <Text style={styles.actionText}>Start new scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={() => router.push('/explore')}>
          <Ionicons name="search-outline" size={22} color="#1e88e5" />
          <Text style={[styles.actionText, styles.secondaryActionText]}>Explore Services</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={() => router.push('/profile')}>
          <Ionicons name="person-outline" size={22} color="#1e88e5" />
          <Text style={[styles.actionText, styles.secondaryActionText]}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={() => router.replace('/') }>
          <Ionicons name="log-out-outline" size={22} color="#1e88e5" />
          <Text style={[styles.actionText, styles.secondaryActionText]}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}> 
        <Text style={styles.cardTitle}>Healthy Habits</Text>
        <Text style={styles.cardText}>Brush twice daily, floss every night, and use a fluoride mouthwash to keep your smile healthy.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eefffe',
  },
  content: {
    padding: 20,
  },
  banner: {
    backgroundColor: '#491ee5',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#d9edff',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e7be5',
  },
  statLabel: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#421ee5',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2b1ee5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryAction: {
    backgroundColor: '#fff5f5',
  },
  secondaryActionText: {
    color: '#1e95e5',
  },
});