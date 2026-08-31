/**
 * Quickly obtains the user's real physical GPS/browser location coordinates.
 * - Resolves immediately as soon as coordinates are available (typically < 500ms).
 * - Allows cached position within 60 seconds (maximumAge: 60000) for instant check-in/out.
 * - Fallbacks smoothly to standard accuracy if hardware satellite GPS is not available.
 * - Shows an error message if location is blocked or unavailable.
 */
export const getBrowserLocation = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    const tryGetPosition = (enableHighAccuracy, timeout, maximumAge, onFail) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (position?.coords?.latitude && position?.coords?.longitude) {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          } else {
            onFail(new Error('Invalid coordinates'));
          }
        },
        (error) => {
          onFail(error);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    };

    // Fast attempt 1: High accuracy (fast 3.5s timeout, allows recent 1-minute cache)
    tryGetPosition(true, 3500, 60000, (err1) => {
      if (err1?.code === 1) {
        // Permission was denied by user/browser
        return reject(
          new Error('Location access was blocked. Please allow location access in your browser address bar and try again.')
        );
      }

      // Fast attempt 2: Standard Wi-Fi / network accuracy (fast 3.5s timeout, 5-minute cache)
      tryGetPosition(false, 3500, 300000, (err2) => {
        console.error('Geolocation failed:', err2);
        let message = 'Could not get your location. Please try again.';
        if (err2?.code === 1) {
          message = 'Location access was blocked. Please allow location access in your browser address bar and try again.';
        } else if (err2?.code === 2) {
          message = 'Location is unavailable. Please ensure Location/GPS is enabled in your device settings and try again.';
        } else if (err2?.code === 3) {
          message = 'Location request timed out. Please check your connection and try again.';
        }
        reject(new Error(message));
      });
    });
  });
};
