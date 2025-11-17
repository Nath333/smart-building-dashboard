import { useState, useEffect } from 'react';
import { getSiteName } from '../utils/siteContext';

/**
 * Unified Site Context Hook
 * Provides centralized site name management with auto-sync across pages
 *
 * @returns {Object} Site context object
 * @property {string} siteName - Current site name from localStorage
 * @property {boolean} isValid - True if siteName exists and is not 'unknown'
 * @property {Function} refresh - Manually refresh site name from localStorage
 *
 * @example
 * const { siteName, isValid } = useSiteContext();
 * if (!isValid) return <div>Please select a site</div>;
 */
export const useSiteContext = () => {
  const [siteName, setSiteName] = useState(() => getSiteName());

  useEffect(() => {
    // Listen for storage changes across tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'simpleFormData' || e.key === 'currentSite') {
        setSiteName(getSiteName());
      }
    };

    // Listen for custom events within the same tab
    const handleSiteChange = () => {
      setSiteName(getSiteName());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('siteChanged', handleSiteChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('siteChanged', handleSiteChange);
    };
  }, []);

  const refresh = () => {
    setSiteName(getSiteName());
  };

  return {
    siteName,
    isValid: siteName !== 'unknown' && siteName !== '',
    refresh
  };
};
