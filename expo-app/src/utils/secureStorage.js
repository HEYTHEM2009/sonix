import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Auth secrets (token, cached user) live in the OS keychain/keystore
// (encrypted at rest) instead of plaintext AsyncStorage. AsyncStorage is
// used only as a fallback for environments without SecureStore (e.g. web)
// and for non-secret keys (onboarded flag, drafts, cache).
const SECURE_KEYS = new Set(["token", "user"]);

let availability = null;

async function isSecureAvailable() {
  if (availability !== null) return availability;
  try {
    availability = await SecureStore.isAvailableAsync();
  } catch (e) {
    availability = false;
  }
  return availability;
}

export async function secureGetItem(key) {
  try {
    if (SECURE_KEYS.has(key) && (await isSecureAvailable())) {
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;
    }
  } catch (e) {
    // fall through to AsyncStorage
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export async function secureSetItem(key, value) {
  try {
    if (SECURE_KEYS.has(key) && (await isSecureAvailable())) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch (e) {
    // oversized values or unavailable store -> fall back to AsyncStorage
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    // never throw — callers expect best-effort persistence
  }
}

export async function secureRemoveItem(key) {
  try {
    if (SECURE_KEYS.has(key) && (await isSecureAvailable())) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (e) {
    // ignore
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}

export async function secureMultiGet(keys) {
  const results = [];
  for (const key of keys) {
    results.push([key, await secureGetItem(key)]);
  }
  return results;
}

export async function secureMultiSet(pairs) {
  for (const [key, value] of pairs) {
    await secureSetItem(key, value);
  }
}

export async function secureMultiRemove(keys) {
  for (const key of keys) {
    await secureRemoveItem(key);
  }
}
