/**
 * Site Context Utilities
 * Centralized site name retrieval and management for all pages
 */

/**
 * Get the current site name from localStorage
 * @returns {string} Site name or 'unknown' if not found/error
 */
export const getSiteName = () => {
  try {
    const saved = localStorage.getItem('simpleFormData');
    if (!saved) return 'unknown';
    const parsed = JSON.parse(saved);
    return parsed?.site || 'unknown';
  } catch (error) {
    console.warn('Failed to parse simpleFormData from localStorage:', error);
    return 'unknown';
  }
};

/**
 * Get the current site name using alternative storage key
 * @returns {string} Site name or 'unknown' if not found/error
 */
export const getCurrentSite = () => {
  try {
    const saved = localStorage.getItem('currentSite');
    if (saved) return saved;
    // Fallback to simpleFormData
    return getSiteName();
  } catch (error) {
    console.warn('Failed to get currentSite from localStorage:', error);
    return getSiteName();
  }
};

/**
 * Get site name with multiple fallback strategies
 * @returns {string} Site name or 'unknown' as last resort
 */
export const getReliableSiteName = () => {
  // Try currentSite first, then simpleFormData, then fallback
  const currentSite = getCurrentSite();
  if (currentSite !== 'unknown') return currentSite;
  
  return getSiteName();
};