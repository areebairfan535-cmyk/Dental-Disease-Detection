import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Dental Care AI</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          {/* First Name Input */}
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="First Name" 
              placeholderTextColor="#999"
            />
          </View>

          {/* Last Name Input */}
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Last Name" 
              placeholderTextColor="#999"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.linkTextBlue}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>
              Follow us on: <Text style={styles.linkTextBlue}>Facebook</Text> | <Text style={styles.linkTextBlue}>WhatsApp</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    paddingRight: 15,
  },
  button: {
    backgroundColor: '#117182',
    width: '1000%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerLinks: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkTextBlue: {
    color: '#1e88e5',
    fontSize: 14,
    fontWeight: '500',
  },
  footerText: {
    marginTop: 15,
    color: '#666',
    fontSize: 13,
  },
});