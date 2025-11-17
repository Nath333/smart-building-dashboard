// visualPlanApi.js - API functions for Page 3 (Visual Plan)
import { API_BASE_URL } from '../config/app.config.js';

/**
 * Fetch equipment counts from normalized database
 * Returns counts per zone for each equipment type
 */
export const fetchEquipmentCounts = async (siteName) => {
  // Properly encode siteName to handle special characters like é, à, etc.
  const encodedSiteName = encodeURIComponent(siteName);
  const res = await fetch(`${API_BASE_URL}/api/equipment-counts/${encodedSiteName}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch equipment counts');
  }

  return res.json();
};

/**
 * Save icon positions to visual_positions table
 */
export const saveVisualPositions = async (siteName, pageType, positions, imageId = null) => {
  const res = await fetch(`${API_BASE_URL}/api/visual-positions/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteName,
      pageType,
      positions,
      imageId
    })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to save positions');
  }

  return res.json();
};

/**
 * Fetch icon positions from visual_positions table
 */
export const fetchVisualPositions = async (siteName, pageType, imageId = null) => {
  // Properly encode siteName to handle special characters
  const encodedSiteName = encodeURIComponent(siteName);
  const url = imageId
    ? `${API_BASE_URL}/api/visual-positions/${encodedSiteName}/${pageType}/${imageId}`
    : `${API_BASE_URL}/api/visual-positions/${encodedSiteName}/${pageType}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch positions');
  }

  return res.json();
};

/**
 * Convert equipment counts to icon list for draggable components
 * Example: { aerotherme: [{ zone: 'Zone 1', count: 5 }] }
 * Returns: [{ id: 'aero-Zone 1-1', type: 'aerotherme', zone: 'Zone 1', x: 0, y: 0 }, ...]
 */
export const convertCountsToIcons = (counts) => {
  const icons = [];

  // Process aerotherme
  if (counts.aerotherme) {
    counts.aerotherme.forEach(({ zone, count }) => {
      for (let i = 1; i <= count; i++) {
        icons.push({
          id: `aero-${zone || 'default'}-${i}`,
          type: 'aerotherme',
          zone: zone || null,
          x: 0,
          y: 0
        });
      }
    });
  }

  // Process clim_ir
  if (counts.clim_ir) {
    counts.clim_ir.forEach(({ zone, count }) => {
      for (let i = 1; i <= count; i++) {
        icons.push({
          id: `clim_ir-${zone || 'default'}-${i}`,
          type: 'clim_ir',
          zone: zone || null,
          x: 0,
          y: 0
        });
      }
    });
  }

  // Process clim_wire
  if (counts.clim_wire) {
    counts.clim_wire.forEach(({ zone, count }) => {
      for (let i = 1; i <= count; i++) {
        icons.push({
          id: `clim_wire-${zone || 'default'}-${i}`,
          type: 'clim_wire',
          zone: zone || null,
          x: 0,
          y: 0
        });
      }
    });
  }

  // Process rooftop
  if (counts.rooftop) {
    counts.rooftop.forEach(({ zone, count }) => {
      for (let i = 1; i <= count; i++) {
        icons.push({
          id: `rooftop-${zone || 'default'}-${i}`,
          type: 'rooftop',
          zone: zone || null,
          x: 0,
          y: 0
        });
      }
    });
  }

  // Process comptage_aerotherme
  if (counts.comptage_aerotherme) {
    counts.comptage_aerotherme.forEach(({ zone, count }) => {
      for (let i = 1; i <= count; i++) {
        icons.push({
          id: `comptage_aerotherme-${zone || 'default'}-${i}`,
          type: 'comptage_aerotherme',
          zone: zone || null,
          x: 0,
          y: 0
        });
      }
    });
  }

  // Process comptage_climate
  if (counts.comptage_climate) {
    counts.comptage_climate.forEach(({ zone, count }) => {
      for (let i = 1; i <= count; i++) {
        icons.push({
          id: `comptage_climate-${zone || 'default'}-${i}`,
          type: 'comptage_climate',
          zone: zone || null,
          x: 0,
          y: 0
        });
      }
    });
  }

  // Process comptage_rooftop
  if (counts.comptage_rooftop) {
    counts.comptage_rooftop.forEach(({ zone, count }) => {
      for (let i = 1; i <= count; i++) {
        icons.push({
          id: `comptage_rooftop-${zone || 'default'}-${i}`,
          type: 'comptage_rooftop',
          zone: zone || null,
          x: 0,
          y: 0
        });
      }
    });
  }

  // Process comptage_lighting
  if (counts.comptage_lighting) {
    counts.comptage_lighting.forEach(({ zone, count }) => {
      for (let i = 1; i <= count; i++) {
        icons.push({
          id: `comptage_lighting-${zone || 'default'}-${i}`,
          type: 'comptage_lighting',
          zone: zone || null,
          x: 0,
          y: 0
        });
      }
    });
  }

  return icons;
};

/**
 * Merge saved positions with generated icons
 * Positions from DB take precedence
 */
export const mergeIconsWithPositions = (icons, savedPositions) => {
  const positionMap = new Map(savedPositions.map(p => [p.id, p]));

  return icons.map(icon => {
    const savedPos = positionMap.get(icon.id);
    if (savedPos) {
      return {
        ...icon,
        x: savedPos.x,
        y: savedPos.y
      };
    }
    return icon;
  });
};
