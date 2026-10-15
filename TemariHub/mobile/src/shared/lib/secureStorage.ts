import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const WEB_PREFIX = 'temari.secure.';

async function webGet(key: string): Promise<string | null> {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(`${WEB_PREFIX}${key}`);
}

async function webSet(key: string, value: string): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(`${WEB_PREFIX}${key}`, value);
}

async function webDelete(key: string): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(`${WEB_PREFIX}${key}`);
}

/**
 * Secure persistence for session tokens (MOB-15).
 * Native → SecureStore. Web falls back to localStorage for Expo web only.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webGet(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await webSet(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await webDelete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
