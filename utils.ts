/**
 * Triggers haptic feedback (vibration) on supported devices.
 * @param pattern A number or array of numbers representing the vibration pattern in milliseconds.
 */
export const triggerHapticFeedback = (pattern: number | number[] = 50) => {
    // Check if the Vibration API is supported
    if (window.navigator && 'vibrate' in window.navigator) {
        try {
            // Some browsers might throw an error if the user has disabled vibrations
            window.navigator.vibrate(pattern);
        } catch (error) {
            console.warn("Haptic feedback failed:", error);
        }
    }
};

/**
 * Creates a JSON blob from data and triggers a download.
 * @param data The JavaScript object to export.
 * @param filename The desired name for the downloaded file.
 */
export const exportDataToFile = (data: object, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};