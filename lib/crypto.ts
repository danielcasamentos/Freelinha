/**
 * Freelinha — crypto.ts
 * Lightweight XOR + Base64 message encryption for chat.
 * Purpose: reduce sensitive content stored as plaintext in Supabase,
 * keep CPU overhead near-zero (no heavy algorithms like AES).
 *
 * The key is a hard-coded application secret. Messages are still
 * server-readable if someone has the source code, but it deters
 * casual data exposure and keeps the DB lighter via base64 packing.
 */

const APP_KEY = 'FreelinhaChat2025XOR';

function xor(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/** Encrypt a plaintext message → base64-encoded XOR ciphertext */
export function packAndEncrypt(plaintext: string): string {
  try {
    const xored = xor(plaintext, APP_KEY);
    return btoa(unescape(encodeURIComponent(xored)));
  } catch {
    // Fallback: return plaintext prefixed so receiver knows it's unencrypted
    return 'RAW:' + plaintext;
  }
}

/** Decrypt a base64-encoded XOR ciphertext → plaintext */
export function decryptAndUnpack(ciphertext: string): string {
  try {
    if (ciphertext.startsWith('RAW:')) return ciphertext.slice(4);
    const xored = decodeURIComponent(escape(atob(ciphertext)));
    return xor(xored, APP_KEY);
  } catch {
    // If decryption fails, return raw text (backward compat with old messages)
    return ciphertext;
  }
}

/**
 * Play a subtle double-chime notification using the Web Audio API.
 * Two short sine tones at a high frequency with a short gap between them.
 */
export function playNotificationSound(): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const playTone = (startTime: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(now, 880, 0.12);        // First chime: A5
    playTone(now + 0.18, 1108, 0.15); // Second chime: C#6 (slightly higher)

    // Auto-close the context after sounds finish
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Silently fail if AudioContext is blocked (e.g., no user gesture)
  }
}
