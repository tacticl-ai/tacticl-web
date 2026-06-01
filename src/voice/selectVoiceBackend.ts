/**
 * selectVoiceBackend — picks the live WebSocket backend when configured, else
 * the mock so the command-center demo always works with no backend present.
 *
 * Wiring is driven by env: set VITE_VOICE_WS_URL (and optionally
 * VITE_VOICE_TOKEN_URL) to go live. With neither set, the mock listen→think→
 * speak loop runs for design/review.
 */

import { createMockVoiceBackend, type VoiceBackend } from './useVoice';
import { createLiveVoiceBackend } from './createLiveVoiceBackend';
import { getAccessToken } from '../stores/auth-store';

export function selectVoiceBackend(): VoiceBackend {
  const wsUrl = import.meta.env.VITE_VOICE_WS_URL as string | undefined;
  if (!wsUrl) {
    return createMockVoiceBackend();
  }
  return createLiveVoiceBackend({
    wsUrl,
    tokenUrl: import.meta.env.VITE_VOICE_TOKEN_URL as string | undefined,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string | undefined,
    getAuthToken: getAccessToken,
  });
}
