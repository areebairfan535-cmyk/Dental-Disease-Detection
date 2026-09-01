import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_IPS = ['192.168.100.71:8000', '192.168.18.114:8000'];
export const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : `http://${LOCAL_IPS[0]}`;

const API_BASE_URLS = Platform.OS === 'web'
  ? ['http://localhost:8000', 'http://127.0.0.1:8000', ...LOCAL_IPS.map((ip) => `http://${ip}`)]
  : Platform.OS === 'android'
    ? ['http://10.0.2.2:8000', ...LOCAL_IPS.map((ip) => `http://${ip}`)]
    : ['http://localhost:8000', ...LOCAL_IPS.map((ip) => `http://${ip}`)];

type ApiResult<T = any> = {
  ok: boolean;
  data: T;
};

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (_error) {
    const preview = text.replace(/\s+/g, ' ').slice(0, 180);
    return {
      success: false,
      error: `Backend returned non-JSON response: ${preview || response.statusText}`,
    };
  }
};

class BackendService {
  async request(path: string, options: RequestInit = {}): Promise<Response> {
    let lastError: unknown = null;
    const attemptedUrls: string[] = [];

    for (const baseUrl of API_BASE_URLS) {
      const url = `${baseUrl}${path}`;
      attemptedUrls.push(url);

      try {
        return await fetch(url, options);
      } catch (error) {
        console.error('BackendService request failed for', url, error);
        lastError = error;
      }
    }

    const message = lastError instanceof Error
      ? `${lastError.message}. Tried: ${attemptedUrls.join(', ')}`
      : `Network request failed. Tried: ${attemptedUrls.join(', ')}`;

    throw new Error(message);
  }

  // Store token in AsyncStorage
  async setToken(token: string) {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Get token from AsyncStorage
  async getToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Clear token on logout
  async clearToken() {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  // Auth APIs
  async signup(email: string, username: string, password: string, fullName: string): Promise<ApiResult> {
    try {
      const response = await this.request('/api/auth.php?action=signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          full_name: fullName,
        }),
      });

      const data = await parseResponse(response);
      if (response.ok && data.token) {
        await this.setToken(data.token);
      }
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Signup error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async signin(email: string, password: string): Promise<ApiResult> {
    try {
      const response = await this.request('/api/auth.php?action=signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await parseResponse(response);
      if (response.ok && data.token) {
        await this.setToken(data.token);
      }
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Signin error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async logout(token?: string): Promise<ApiResult> {
    try {
      const authToken = token || (await this.getToken());
      await this.request('/api/auth.php?action=logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: authToken }),
      });
      await this.clearToken();
      return { ok: true, data: { success: true } };
    } catch (error) {
      console.error('Logout error:', error);
      await this.clearToken();
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  // Profile APIs
  async getProfile(): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request('/api/profile.php?action=profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Get profile error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async getProfileDetail(): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request('/api/profile.php?action=detail', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Get profile detail error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async updateProfile(profileData: Record<string, unknown>): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request('/api/profile.php?action=profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  // Appointment APIs
  async getAppointments(): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request('/api/appointments.php?action=list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Get appointments error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async createAppointment(appointmentData: Record<string, unknown>): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request('/api/appointments.php?action=create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Create appointment error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async uploadImage(imageUri: string): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const formData = new FormData();
      const uriParts = imageUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      const fileExt = fileName.split('.').pop()?.toLowerCase();
      const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: fileName,
        type: mimeType,
      } as any);

      const response = await this.request('/api/detection.php?action=upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Upload image error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async analyzeImage(imagePath: string, detectionType = 'dental_scan'): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request('/api/detection.php?action=analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_path: imagePath,
          detection_type: detectionType,
        }),
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Analyze image error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  // History APIs
  async getHistory(): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request('/api/history.php?action=list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Get history error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async saveDetectionResult(result: string, imagePath: string, advice = ''): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request('/api/history.php?action=create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result,
          image_path: imagePath,
          advice,
        }),
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Save detection result error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }

  async getHistoryDetail(id: string | number): Promise<ApiResult> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No auth token');

      const response = await this.request(`/api/history.php?action=detail&id=${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseResponse(response);
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Get history detail error:', error);
      return { ok: false, data: { error: errorMessage(error) } };
    }
  }
}

export default new BackendService();
