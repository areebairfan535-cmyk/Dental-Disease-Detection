import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScanResultScreen() {
  const [scan, setScan] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadLatestScan = async () => {
      const saved = await AsyncStorage.getItem('latestScan');
      if (saved) {
        setScan(JSON.parse(saved));
      }
    };
    loadLatestScan();
  }, []);

  const handleNewScan = () => {
    router.push('/detection');
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const handleBookAppointment = (doctor) => {
    const doctorQuery = encodeURIComponent(doctor.id);
    const conditionQuery = encodeURIComponent(scan?.result || 'Dental Issue');
    router.push(`/appointments?doctor=${doctorQuery}&condition=${conditionQuery}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan Result</Text>

      {!scan ? (
        <Text style={styles.emptyText}>No scan result found. Please run a new scan.</Text>
      ) : (
        <>
          <View style={styles.imageCard}>
            <Image source={{ uri: scan.image }} style={styles.image} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Diagnosis</Text>
            <Text style={styles.cardText}>{scan.result}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Advice</Text>
            <Text style={styles.cardText}>{scan.advice}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recommended Doctors</Text>
            {scan.doctors?.map((doctor) => (
              <View key={doctor.id} style={styles.doctorCard}>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                  <Text style={styles.doctorAvailability}>{doctor.availability}</Text>
                </View>
                <TouchableOpacity style={styles.bookButton} onPress={() => handleBookAppointment(doctor)}>
                  <Text style={styles.bookButtonText}>Book</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.actionButton} onPress={handleNewScan}>
        <Text style={styles.actionButtonText}>New Scan</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleViewHistory}>
        <Text style={[styles.actionButtonText, styles.secondaryText]}>View History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#eef7ff',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 40,
  },
  imageCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 240,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  doctorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  doctorAvailability: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  bookButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#1e88e5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#f5fbff',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryText: {
    color: '#1e88e5',
  },
});
