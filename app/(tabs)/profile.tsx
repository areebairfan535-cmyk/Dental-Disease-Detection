import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackendService from '../../services/BackendService';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    email: 'user@example.com',
    full_name: 'Dental AI User',
    username: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    profile_image: '',
    created_at: null,
  });
  const [statistics, setStatistics] = useState({ total_appointments: 0, total_detections: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await BackendService.getProfileDetail();
        if (response.ok && response.data?.success) {
          setUser(response.data.profile);
          setStatistics(response.data.statistics || { total_appointments: 0, total_detections: 0 });
        } else {
          const stored = await AsyncStorage.getItem('loggedInUser');
          if (stored) {
            setUser(JSON.parse(stored));
          }
        }
      } catch (error) {
        const stored = await AsyncStorage.getItem('loggedInUser');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await BackendService.logout();
    } catch (_error) {
      // ignore logout errors and clear session locally
    }
    await AsyncStorage.removeItem('loggedInUser');
    router.replace('/');
  };

  const validateProfile = () => {
    const name = user.full_name?.trim();
    if (!name) {
      setMessageType('error');
      setMessage('Please enter your full name.');
      return false;
    }

    if (user.phone?.trim()) {
      const phoneRegex = /^[0-9+\-\s]{7,20}$/;
      if (!phoneRegex.test(user.phone.trim())) {
        setMessageType('error');
        setMessage('Please enter a valid phone number.');
        return false;
      }
    }

    if (user.date_of_birth?.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(user.date_of_birth.trim())) {
        setMessageType('error');
        setMessage('Date of birth must use YYYY-MM-DD format.');
        return false;
      }
      const date = new Date(user.date_of_birth.trim());
      if (Number.isNaN(date.getTime())) {
        setMessageType('error');
        setMessage('Please enter a valid date of birth.');
        return false;
      }
    }

    setMessage('');
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      return;
    }

    setSaving(true);

    try {
      const response = await BackendService.updateProfile({
        full_name: user.full_name,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
      });

      if (response.ok && response.data?.success) {
        setMessageType('success');
        setMessage('Profile updated successfully.');
        if (response.data.profile) {
          setUser((prev) => ({ ...prev, ...response.data.profile }));
          await AsyncStorage.setItem('loggedInUser', JSON.stringify(response.data.profile));
        }
      } else {
        setMessageType('error');
        setMessage(response.data?.error || response.data?.message || 'Unable to update profile.');
      }
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.name}>{user.full_name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.sectionTitle}>Member Since</Text>
          <Text style={styles.sectionText}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'January 2026'}</Text>
        </View>

        <View style={styles.editCard}>
          <Text style={styles.cardTitle}>Edit Profile</Text>

          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={user.full_name}
            onChangeText={(value) => setUser((prev) => ({ ...prev, full_name: value }))}
            placeholder="Full Name"
          />

          <Text style={styles.fieldLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={user.phone}
            onChangeText={(value) => setUser((prev) => ({ ...prev, phone: value }))}
            placeholder="Phone"
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={user.date_of_birth}
            onChangeText={(value) => setUser((prev) => ({ ...prev, date_of_birth: value }))}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.fieldLabel}>Gender</Text>
          <TextInput
            style={styles.input}
            value={user.gender}
            onChangeText={(value) => setUser((prev) => ({ ...prev, gender: value }))}
            placeholder="Gender"
          />

          <Text style={styles.fieldLabel}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={user.address}
            onChangeText={(value) => setUser((prev) => ({ ...prev, address: value }))}
            placeholder="Address"
            multiline
          />

          <TouchableOpacity
            style={[styles.saveButton, (saving || loading) && styles.disabledButton]}
            onPress={handleSaveProfile}
            disabled={saving || loading}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
          </TouchableOpacity>

          {message ? (
            <Text style={[styles.messageText, messageType === 'error' ? styles.errorText : styles.successText]}>
              {message}
            </Text>
          ) : null}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Activity</Text>
          <Text style={styles.summaryText}>Appointments: {statistics.total_appointments}</Text>
          <Text style={styles.summaryText}>Scans: {statistics.total_detections}</Text>
          <TouchableOpacity style={styles.appointmentButton} onPress={() => router.push('/appointments')}>
            <Text style={styles.appointmentButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffeeff',
  },
  content: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#f7f0f0',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#555',
    marginTop: 4,
  },
  editCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#f7f9fc',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#333',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#1e88e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#90caf9',
  },
  messageText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#2e7d32',
  },
  errorText: {
    color: '#d32f2f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef7ff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1e88e5',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  appointmentButton: {
    backgroundColor: '#1e88e5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  appointmentButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff5252',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});