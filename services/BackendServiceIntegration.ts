// Backend Service Integration Guide for React Native/React

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_IPS = ['192.168.100.71:8000', '192.168.18.114:8000'];
const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : `http://${LOCAL_IPS[0]}`;

// ============ AUTHENTICATION SERVICE ============

export const authService = {
  signup: async (email: string, username: string, password: string, fullName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth.php?action=signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          password,
          full_name: fullName
        })
      });
      const data = await response.json();
      
      if (response.ok && data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  signin: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth.php?action=signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok && data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }
      return data;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return { success: true };
      
      const response = await fetch(`${API_BASE_URL}/api/auth.php?action=logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      await AsyncStorage.removeItem('authToken');
      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  verifyToken: async (token?: string) => {
    try {
      const authToken = token || await AsyncStorage.getItem('authToken');
      if (!authToken) return { success: false, error: 'No token' };
      
      const response = await fetch(`${API_BASE_URL}/api/auth.php?action=verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: authToken })
      });
      return await response.json();
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }
};

// ============ PROFILE SERVICE ============

export const profileService = {
  getProfile: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/profile.php?action=profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/profile.php?action=profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  getProfileDetail: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/profile.php?action=detail`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get profile detail error:', error);
      throw error;
    }
  }
};

// ============ APPOINTMENTS SERVICE ============

export const appointmentsService = {
  list: async (status?: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      let url = `${API_BASE_URL}/api/appointments.php?action=list`;
      if (status) url += `&status=${status}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('List appointments error:', error);
      throw error;
    }
  },

  create: async (appointmentData: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/appointments.php?action=create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      return await response.json();
    } catch (error) {
      console.error('Create appointment error:', error);
      throw error;
    }
  },

  update: async (id: number, appointmentData: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/appointments.php?action=update&id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update appointment error:', error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/appointments.php?action=delete&id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Delete appointment error:', error);
      throw error;
    }
  },

  getDetail: async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/appointments.php?action=detail&id=${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get appointment detail error:', error);
      throw error;
    }
  }
};

// ============ DETECTION HISTORY SERVICE ============

export const historyService = {
  list: async (limit = 20, offset = 0) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${API_BASE_URL}/api/history.php?action=list&limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('List history error:', error);
      throw error;
    }
  },

  create: async (historyData: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/history.php?action=create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(historyData)
      });
      return await response.json();
    } catch (error) {
      console.error('Create history error:', error);
      throw error;
    }
  },

  getDetail: async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/history.php?action=detail&id=${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get history detail error:', error);
      throw error;
    }
  },

  update: async (id: number, historyData: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/history.php?action=update&id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(historyData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update history error:', error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/history.php?action=delete&id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Delete history error:', error);
      throw error;
    }
  }
};

// ============ DETECTION SERVICE ============

export const detectionService = {
  uploadImage: async (imageUri: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'dental_scan.jpg'
      } as any);
      
      const response = await fetch(`${API_BASE_URL}/api/detection.php?action=upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  },

  analyzeImage: async (imagePath: string, detectionType = 'dental_scan') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/detection.php?action=analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_path: imagePath,
          detection_type: detectionType
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Analyze image error:', error);
      throw error;
    }
  },

  getResults: async (detectionId: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${API_BASE_URL}/api/detection.php?action=results&id=${detectionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Get detection results error:', error);
      throw error;
    }
  }
};

export default {
  authService,
  profileService,
  appointmentsService,
  historyService,
  detectionService
};
