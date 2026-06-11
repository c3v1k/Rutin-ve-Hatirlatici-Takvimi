/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Request user permission for standard web browser push/desktop notifications.
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Bu tarayıcı masaüstü bildirimlerini desteklemiyor.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    console.error("Bildirim izni istenirken hata oluştu:", e);
    return false;
  }
}

/**
 * Triggers a native system alert as well as logging it.
 */
export function sendBrowserNotification(title: string, message: string): boolean {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: message,
        icon: "/favicon.ico", // standard fallback
      });
      return true;
    } catch (e) {
      console.warn("Masaüstü bildirimi gönderilemedi, doğrudan uygulamada gösterilecek.", e);
      return false;
    }
  }
  return false;
}

/**
 * Generates an elegant ambient beep confirmation tone using Pure Web Audio API.
 * This completely avoids external file assets or network requests, securing a 100% local experience.
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Warm, beautiful chime sound
    oscillator.type = "sine";
    // Play a dual tone chime: E5 (659.25Hz) rapidly sliding into A5 (880.00Hz)
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (error) {
    console.warn("Web Audio ses çalınamadı (kullanıcı henüz sayfa ile etkileşime girmedi):", error);
  }
}

/**
 * Optional system chime for complete task tick-offs
 */
export function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
    oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6

    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.6);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.6);
  } catch (error) {
    console.warn("Success sound failure:", error);
  }
}
