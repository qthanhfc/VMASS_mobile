import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getDevServerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (!hostUri) return null;
  return hostUri.split(':')[0] || null;
}

export function resolveRuntimeApiUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;

  // Keep web behavior unchanged; only rewrite native runtime URLs.
  if (Platform.OS === 'web') return trimmed;

  try {
    const parsed = new URL(trimmed);
    const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (!isLocalHost) return trimmed;

    const devHost = getDevServerHost();
    if (!devHost) {
      // Android emulator can access host machine via 10.0.2.2 when host can't be inferred.
      if (Platform.OS === 'android') {
        parsed.hostname = '10.0.2.2';
        return parsed.toString().replace(/\/$/, '');
      }
      return trimmed;
    }

    parsed.hostname = devHost;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return trimmed;
  }
}
