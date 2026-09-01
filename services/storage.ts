import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: string;
}

const LOGGED_IN_USER_KEY = 'loggedInUser';
const ACCOUNT_PREFIX = 'userAccount:';
const HISTORY_PREFIX = 'dentalHistory:';
const APPOINTMENTS_PREFIX = 'appointments:';
const LATEST_SCAN_PREFIX = 'latestScan:';

const normalizeKey = (key: string) => key.trim().toLowerCase();

export const getLoggedInUser = async (): Promise<AppUser | null> => {
  const stored = await AsyncStorage.getItem(LOGGED_IN_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveLoggedInUser = async (user: AppUser): Promise<void> => {
  await AsyncStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
};

export const clearLoggedInUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(LOGGED_IN_USER_KEY);
};

export const saveUserAccount = async (user: AppUser): Promise<void> => {
  const key = `${ACCOUNT_PREFIX}${normalizeKey(user.email)}`;
  await AsyncStorage.setItem(key, JSON.stringify(user));
  await saveLoggedInUser(user);
};

export const getUserAccount = async (email: string): Promise<AppUser | null> => {
  const key = `${ACCOUNT_PREFIX}${normalizeKey(email)}`;
  const stored = await AsyncStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
};

export const updateUserAccount = async (user: AppUser): Promise<void> => {
  await saveUserAccount(user);
};

const historyKey = (email: string) => `${HISTORY_PREFIX}${normalizeKey(email)}`;
const appointmentsKey = (email: string) => `${APPOINTMENTS_PREFIX}${normalizeKey(email)}`;
const latestScanKey = (email: string) => `${LATEST_SCAN_PREFIX}${normalizeKey(email)}`;

export const getHistoryItems = async (email: string) => {
  const stored = await AsyncStorage.getItem(historyKey(email));
  return stored ? JSON.parse(stored) : [];
};

export const addHistoryItem = async (email: string, item: any) => {
  const history = await getHistoryItems(email);
  const updated = [item, ...history];
  await AsyncStorage.setItem(historyKey(email), JSON.stringify(updated));
  await AsyncStorage.setItem(latestScanKey(email), JSON.stringify(item));
  return updated;
};

export const getLatestScan = async (email: string) => {
  const stored = await AsyncStorage.getItem(latestScanKey(email));
  return stored ? JSON.parse(stored) : null;
};

export const getAppointments = async (email: string) => {
  const stored = await AsyncStorage.getItem(appointmentsKey(email));
  return stored ? JSON.parse(stored) : [];
};

export const addAppointment = async (email: string, appointment: any) => {
  const appointments = await getAppointments(email);
  const updated = [appointment, ...appointments];
  await AsyncStorage.setItem(appointmentsKey(email), JSON.stringify(updated));
  return updated;
};

export const getSummaryCounts = async (email: string) => {
  const history = await getHistoryItems(email);
  const appointments = await getAppointments(email);
  return {
    scans: history.length,
    appointments: appointments.length,
    lastScan: history[0] || null,
  };
};
