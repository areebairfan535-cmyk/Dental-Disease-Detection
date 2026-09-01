import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackendService from '../../services/BackendService';

const doctorRecommendations = {
  'Cavity': [
    { id: 'dr-sami', name: 'Dr. Sami Ali', specialty: 'Restorative Dentist', availability: 'Tomorrow 10:00 AM' },
    { id: 'dr-nida', name: 'Dr. Nida Khan', specialty: 'Family Dentist', availability: 'Monday 2:00 PM' },
  ],
  'Gum Disease': [
    { id: 'dr-ahmed', name: 'Dr. Ahmed Rehan', specialty: 'Periodontist', availability: 'Today 4:00 PM' },
    { id: 'dr-zara', name: 'Dr. Zara Faisal', specialty: 'Oral Health Specialist', availability: 'Wednesday 11:00 AM' },
  ],
  'Tooth Decay': [
    { id: 'dr-hira', name: 'Dr. Hira Ashraf', specialty: 'Pediatric Dentist', availability: 'Friday 9:30 AM' },
  ],
  'Healthy': [
    { id: 'dr-umer', name: 'Dr. Umer Farooq', specialty: 'General Dentist', availability: 'Tomorrow 3:00 PM' },
  ],
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  availability: string;
};

type Diagnosis = keyof typeof doctorRecommendations;

type DetectionResult = {
  result: Diagnosis;
  advice: string;
  doctors: Doctor[];
};

export default function DetectionScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Request gallery permission and select a photo
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to analyze your teeth image.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log('Image picker result:', result);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      console.log('Selected URI:', selectedUri);
      setImage(selectedUri);
      setResult(null);
      // Use setTimeout to ensure state is updated before analyze
      setTimeout(() => analyzeTeeth(selectedUri), 100);
    }
  };

  const getImageFileInfo = (uri: string) => {
    if (!uri || typeof uri !== 'string') {
      console.error('Invalid URI:', uri);
      throw new Error('Image URI is invalid or undefined');
    }
    const uriParts = uri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    return { fileName, mimeType };
  };

  const analyzeTeeth = async (selectedImage?: string | null) => {
    const imageUri = selectedImage || image;
    if (!imageUri) {
      Alert.alert('Error', 'Please select a photo first!');
      return;
    }

    setLoading(true);
    try {
      const uploadResponse = await BackendService.uploadImage(imageUri);
      if (!uploadResponse.ok || !uploadResponse.data?.success) {
        throw new Error(uploadResponse.data?.error || uploadResponse.data?.message || 'Upload failed');
      }

      const imagePath = uploadResponse.data.path;
      const analyzeResponse = await BackendService.analyzeImage(imagePath, 'dental_scan');
      if (!analyzeResponse.ok || !analyzeResponse.data?.success) {
        throw new Error(analyzeResponse.data?.error || analyzeResponse.data?.message || 'Analysis failed');
      }

      const backendResults = analyzeResponse.data.results || {};
      const rawDiagnosis = backendResults.detected_issues?.[0] || 'Healthy';
      const diagnosis: Diagnosis = rawDiagnosis in doctorRecommendations ? rawDiagnosis : 'Healthy';
      const advice = Array.isArray(backendResults.recommendations)
        ? backendResults.recommendations.join(' ')
        : 'Your scan is complete. If you feel pain, consult a dentist.';
      const doctors = doctorRecommendations[diagnosis] || doctorRecommendations['Healthy'];

      const finalResult = {
        result: diagnosis,
        advice,
        doctors,
      };
      setResult(finalResult);

      const latestScan = {
        id: Date.now().toString(),
        result: diagnosis,
        advice,
        doctors,
        date: new Date().toLocaleString(),
        image: imageUri,
      };

      await AsyncStorage.setItem('latestScan', JSON.stringify(latestScan));
      router.push('/scan-result');
    } catch (error) {
      console.error('Detection error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      Alert.alert('Detection Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = (doctor: Doctor) => {
    const doctorQuery = encodeURIComponent(doctor.id);
    const conditionQuery = encodeURIComponent(result?.result || 'Dental Issue');
    router.push(`/appointments?doctor=${doctorQuery}&condition=${conditionQuery}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dental AI Detector</Text>
      
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text>No photo selected</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btn} onPress={pickImage}>
          <Text style={styles.btnText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.analyzeBtn, loading && {backgroundColor: '#ccc'}]} 
        onPress={() => analyzeTeeth()}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? "Analyzing..." : "Analyze Teeth"}</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>{result.result}</Text>
          <Text style={styles.adviceText}>{result.advice}</Text>

          {result.doctors?.map((doctor) => (
            <View key={doctor.id} style={styles.doctorCard}>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                <Text style={styles.doctorAvailability}>{doctor.availability}</Text>
              </View>
              <TouchableOpacity style={styles.bookButton} onPress={() => bookAppointment(doctor)}>
                <Text style={styles.bookButtonText}>Book</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2196F3', marginBottom: 20 },
  image: { width: 300, height: 300, borderRadius: 20, marginBottom: 20 },
  placeholder: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  buttonRow: { flexDirection: 'row', marginBottom: 20 },
  btn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, width: 120, alignItems: 'center' },
  analyzeBtn: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  resultBox: { marginTop: 20, padding: 20, backgroundColor: '#E8F5E9', borderRadius: 10, width: '100%', borderLeftWidth: 5, borderLeftColor: '#4CAF50' },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
  adviceText: { fontSize: 14, color: '#444', marginTop: 5 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, padding: 15, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#d7e8d9' },
  doctorInfo: { flex: 1, marginRight: 12 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#1e88e5' },
  doctorSpecialty: { fontSize: 13, color: '#555', marginTop: 4 },
  doctorAvailability: { fontSize: 12, color: '#777', marginTop: 4 },
  bookButton: { backgroundColor: '#1e88e5', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  bookButtonText: { color: '#fff', fontWeight: 'bold' }
});
