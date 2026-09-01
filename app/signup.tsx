import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BackendService from '../services/BackendService';

type SignupResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  user?: {
    id?: string;
    email: string;
    username: string;
    fullName: string;
  };
};

export default function SignupScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const baseUsername = `${firstName.trim()}${lastName.trim()}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const username = `${baseUsername}${Math.floor(100 + Math.random() * 900)}`;

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      setLoading(true);

      const response = await BackendService.signup(
        email.trim(),
        username,
        password,
        fullName
      );

      if (!response.ok || !response.data?.success) {
        Alert.alert(
          'Signup Failed',
          response.data?.error || response.data?.message || 'Unable to create account'
        );
        return;
      }

      if (response.data?.user) {
        await AsyncStorage.setItem(
          'loggedInUser',
          JSON.stringify(response.data.user)
        );
      }

      Alert.alert(
        'Success',
        'Account created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/detection'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Dental Care AI</Text>

          <Text style={styles.subtitle}>
            Create your account
          </Text>

          {/* First Name */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#999"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#999"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(!showPassword)
              }
              style={styles.eyeIcon}
            >
              <Ionicons
                name={
                  showPassword
                    ? 'eye-outline'
                    : 'eye-off-outline'
                }
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? 'Creating Account...'
                : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => router.push('/')}
            style={styles.secondaryLink}
          >
            <Text style={styles.linkTextBlue}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,

    alignItems: 'center',
  },

  title: {
    fontSize: 30,
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
    backgroundColor: '#1e88e5',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  secondaryLink: {
    marginTop: 20,
  },

  linkTextBlue: {
    color: '#1e88e5',
    fontSize: 14,
    fontWeight: '500',
  },
});