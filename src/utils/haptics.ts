/**
 * Mobile Haptic Feedback utility with navigator.vibrate feature detection
 * - 10ms vibration when a coin is collected
 * - 50ms vibration on a near-miss with a train/obstacle
 * - 200ms vibration when the player crashes
 */
function canVibrate(): boolean {
  return (
    typeof window !== 'undefined' &&
    'navigator' in window &&
    typeof navigator.vibrate === 'function'
  );
}

export const haptics = {
  coin: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore on restricted devices
      }
    }
  },

  nearMiss: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate(50);
      } catch {
        // Ignore
      }
    }
  },

  crash: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate(200);
      } catch {
        // Ignore
      }
    }
  },

  jump: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore
      }
    }
  },

  slide: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore
      }
    }
  },

  powerup: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate([30, 20, 40]);
      } catch {
        // Ignore
      }
    }
  },

  boost: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate(50);
      } catch {
        // Ignore
      }
    }
  },

  revive: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate([40, 30, 80]);
      } catch {
        // Ignore
      }
    }
  },

  click: () => {
    if (canVibrate()) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore
      }
    }
  },
};
