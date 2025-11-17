import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

/**
 * Unified Page Data Fetcher Hook
 * Handles async data fetching with loading states and error handling
 *
 * @param {string} siteName - The site identifier to fetch data for
 * @param {Function} fetchFn - Async function that fetches data (receives siteName as argument)
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Auto-fetch on mount (default: true)
 * @param {boolean} options.showErrorMessage - Show error message to user (default: true)
 * @param {string} options.errorContext - Context for error messages (default: 'Data fetch')
 * @param {Array} options.dependencies - Additional dependencies to trigger refetch
 *
 * @returns {Object} Data state object
 * @property {*} data - Fetched data (null if not loaded)
 * @property {boolean} loading - Loading state
 * @property {Error|null} error - Error object if fetch failed
 * @property {Function} refresh - Manually trigger data refetch
 * @property {Function} setData - Manually update data state
 *
 * @example
 * // Basic usage
 * const { data, loading, error } = usePageData(siteName, fetchSiteForm2Data);
 *
 * @example
 * // With manual refresh
 * const { data, loading, refresh } = usePageData(siteName, fetchSqlImages2);
 * // Later: refresh();
 *
 * @example
 * // Disable auto-fetch
 * const { data, loading, refresh } = usePageData(siteName, fetchData, { autoFetch: false });
 * // Later: refresh();
 */
export const usePageData = (siteName, fetchFn, options = {}) => {
  const {
    autoFetch = true,
    showErrorMessage = true,
    errorContext = 'Data fetch',
    dependencies = []
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    // Skip if no valid site name
    if (!siteName || siteName === 'unknown') {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(siteName);
      setData(result);
      return result;
    } catch (err) {
      console.error(`❌ ${errorContext} failed:`, err);
      setError(err);

      if (showErrorMessage) {
        const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
        message.error(`${errorContext} failed: ${errorMsg}`);
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [siteName, fetchFn, errorContext, showErrorMessage]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, refresh, ...dependencies]);

  return {
    data,
    loading,
    error,
    refresh,
    setData // Allow manual data updates
  };
};

/**
 * Variant: Fetch multiple data sources in parallel
 *
 * @param {string} siteName - The site identifier
 * @param {Array<Function>} fetchFunctions - Array of fetch functions
 * @param {Object} options - Configuration options (same as usePageData)
 *
 * @returns {Object} Combined state
 * @property {Array} data - Array of fetched data (same order as fetchFunctions)
 * @property {boolean} loading - True if ANY fetch is loading
 * @property {Array} errors - Array of errors (null if no error for that fetch)
 * @property {Function} refresh - Refetch all data sources
 *
 * @example
 * const { data: [formData, images], loading } = usePageDataMulti(
 *   siteName,
 *   [fetchSiteForm2Data, fetchSqlImages2]
 * );
 */
export const usePageDataMulti = (siteName, fetchFunctions, options = {}) => {
  const {
    autoFetch = true,
    showErrorMessage = true,
    errorContext = 'Data fetch',
    dependencies = []
  } = options;

  const [data, setData] = useState(fetchFunctions.map(() => null));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(fetchFunctions.map(() => null));

  const refresh = useCallback(async () => {
    if (!siteName || siteName === 'unknown') {
      setData(fetchFunctions.map(() => null));
      setErrors(fetchFunctions.map(() => null));
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.allSettled(
        fetchFunctions.map(fn => fn(siteName))
      );

      const newData = [];
      const newErrors = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          newData[index] = result.value;
          newErrors[index] = null;
        } else {
          newData[index] = null;
          newErrors[index] = result.reason;
          console.error(`❌ ${errorContext} [${index}] failed:`, result.reason);

          if (showErrorMessage) {
            const errorMsg = result.reason?.response?.data?.message || result.reason?.message || 'Unknown error';
            message.error(`${errorContext} failed: ${errorMsg}`);
          }
        }
      });

      setData(newData);
      setErrors(newErrors);
      return newData;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteName, errorContext, showErrorMessage]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, refresh, ...dependencies]);

  return {
    data,
    loading,
    errors,
    refresh
  };
};
