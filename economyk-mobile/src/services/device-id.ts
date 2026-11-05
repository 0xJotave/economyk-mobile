import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "economyk_device_id";

export async function getDeviceId(): Promise<string> {
  const existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (existingId) {
    return existingId;
  }

  const newId = Crypto.randomUUID();

  await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);

  return newId;
}
