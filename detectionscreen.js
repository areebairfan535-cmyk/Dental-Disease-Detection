import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function DetectionScreen() {
  const [image, setImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("Detection result will appear here.");

  // Function to pick an image from the gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult("Photo selected! Ready to scan.");
    }
  };

  // Python backend connection function
  const handleScan = async () => {
    if (!image) {
      Alert.alert("Error", "Please select a photo from the gallery first!");
      return;
    }

    setScanning(true);
    setResult("Connecting to the server...");

    try {
      let formData = new FormData();
      formData.append('image', {
        uri: image,
        name: 'teeth_photo.jpg',
        type: 'image/jpeg',
      });

      // Your laptop IP address: 192.168.100.71
      const response = await fetch('http://192.168.100.71:5000/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      setResult(data.result); // The result from the server will show here

    } catch (error) {
      console.error(error);
      setResult("Connection failed! Make sure your phone and laptop are on the same Wi-Fi network.");
      Alert.alert("Error", "Connection failed. Please check your network.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dental AI Detection</Text>

      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <Text style={styles.placeholderText}>Click to select Teeth Photo</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.resultText}>{result}</Text>

      <TouchableOpacity 
        style={[styles.button, scanning && { backgroundColor: '#ccc' }]} 
        onPress={handleScan}
        disabled={scanning}
      >
        {scanning ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Start AI Scan</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20, color: '#3