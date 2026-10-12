/** Place your sound file at `public/notification.mp3` (or .wav / .ogg). */
export const ORDER_NOTIFICATION_SOUND = "/notification.mp3";

export function playNewOrderNotification(): void {
  if (typeof window === "undefined") return;
  const audio = new Audio(ORDER_NOTIFICATION_SOUND);
  audio.volume = 1;
  void audio.play().catch(() => {
    /* File missing or autoplay blocked — add public/notification.mp3 */
  });
}
