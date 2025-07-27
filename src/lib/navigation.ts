/**
 * Navigation utility for handling back navigation with fallback
 * Provides functionality to return to the previous page or fallback to dashboard
 */

const REFERRER_KEY = 'navigation_referrer';
const DEFAULT_FALLBACK = '/dashboard';

/**
 * Store the current page as the referrer for future back navigation
 * Call this when entering a page that might need back navigation
 */
export function storeReferrer(): void {
  // Only store if we have a valid referrer from within our app
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      const currentUrl = new URL(window.location.href);
      
      // Only store if referrer is from the same origin (our app)
      if (referrerUrl.origin === currentUrl.origin) {
        // Don't store login page as referrer
        if (!referrerUrl.pathname.includes('/login')) {
          sessionStorage.setItem(REFERRER_KEY, document.referrer);
          return;
        }
      }
    } catch (error) {
      console.log('Error processing referrer:', error);
    }
  }
  
  // If no valid referrer, use dashboard as fallback
  sessionStorage.setItem(REFERRER_KEY, DEFAULT_FALLBACK);
}

/**
 * Get the stored referrer URL or fallback to dashboard
 */
export function getReferrer(): string {
  const stored = sessionStorage.getItem(REFERRER_KEY);
  if (stored) {
    try {
      const url = new URL(stored);
      // Ensure it's still our domain
      if (url.origin === window.location.origin) {
        return stored;
      }
    } catch (error) {
      console.log('Error parsing stored referrer:', error);
    }
  }
  return DEFAULT_FALLBACK;
}

/**
 * Navigate back to the previous page or dashboard
 * @param preserveQuery - Whether to preserve current query parameters
 */
export function goBack(preserveQuery: boolean = false): void {
  let targetUrl = getReferrer();
  
  if (preserveQuery && window.location.search) {
    try {
      const url = new URL(targetUrl);
      const currentParams = new URLSearchParams(window.location.search);
      
      // Merge current query params with target URL
      currentParams.forEach((value, key) => {
        if (!url.searchParams.has(key)) {
          url.searchParams.set(key, value);
        }
      });
      
      targetUrl = url.toString();
    } catch (error) {
      console.log('Error preserving query parameters:', error);
    }
  }
  
  window.location.href = targetUrl;
}

/**
 * Get the back URL for use in href attributes
 * @param preserveQuery - Whether to preserve current query parameters
 */
export function getBackUrl(preserveQuery: boolean = false): string {
  let targetUrl = getReferrer();
  
  if (preserveQuery && window.location.search) {
    try {
      const url = new URL(targetUrl);
      const currentParams = new URLSearchParams(window.location.search);
      
      // Merge current query params with target URL
      currentParams.forEach((value, key) => {
        if (!url.searchParams.has(key)) {
          url.searchParams.set(key, value);
        }
      });
      
      targetUrl = url.toString();
    } catch (error) {
      console.log('Error preserving query parameters:', error);
    }
  }
  
  return targetUrl;
}

/**
 * Clear the stored referrer
 */
export function clearReferrer(): void {
  sessionStorage.removeItem(REFERRER_KEY);
}

/**
 * Handle browser back button to work with our navigation system
 * Call this in pages that need custom back behavior
 */
export function handleBrowserBack(callback?: () => void): void {
  window.addEventListener('popstate', (event) => {
    if (callback) {
      callback();
    } else {
      // Default behavior: go to our stored referrer
      const referrer = getReferrer();
      if (referrer !== window.location.href) {
        window.location.href = referrer;
      }
    }
  });
}

/**
 * Initialize navigation system for a page
 * Call this on pages that need back navigation functionality
 */
export function initializeNavigation(): void {
  storeReferrer();
}
