/**
 * Emergency Sound Utility - Completely Silenced / Disabled by default to prevent unexpected sounds.
 */

export const stopEmergencySiren = () => {
  // Silent no-op, ensures no audio context or oscillators are running
  try {
    if (window.AudioContext || window.webkitAudioContext) {
      // no-op
    }
  } catch (e) {}
};

export const playEmergencySiren = () => {
  // Completely disabled / muted as requested by user
  return;
};

export const playBeepAlert = () => {
  // Completely disabled / muted
  return;
};
