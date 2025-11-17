// formDataApi.js

import { API_BASE_URL } from '../config/app.config.js';

// 📡 Fetch the list of existing site names from the backend (POST /list-sites)
export const fetchSites = async () => {
  const res = await fetch(`${API_BASE_URL}/list-sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // Returns array of site names
};

// 📡 Fetch saved form data for a specific site (POST /get-page1)
export const fetchSiteData = async (site) => {
  const res = await fetch(`${API_BASE_URL}/get-page1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error); // Handles server error messages
  return data; // Returns site-related form data
};

// 📡 Submit new or updated form data to the server (POST /save-page1)
export const submitForm = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/save-page1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error); // Handles server error messages
  return result; // Returns success message from server
};



// 📡 Submit Page2 data to the backend (POST /save_page2)
export const submitForm2 = async (payload) => {
  try {
    console.log('🚀 [submitForm2] Sending data to backend:', {
      url: `${API_BASE_URL}/save_page2`,
      site: payload.site,
      fieldCount: Object.keys(payload).length,
      fields: Object.keys(payload)
    });

    const res = await fetch(`${API_BASE_URL}/save_page2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    console.log('✅ [submitForm2] Backend response:', {
      status: res.status,
      ok: res.ok,
      result
    });

    if (!res.ok) throw new Error(result.error);
    return result; // ✅ Return server success message
  } catch (err) {
    console.error('❌ [submitForm2] Erreur fetch:', err);
    throw err;
  }
};



export const fetchSiteForm2Data = async (site) => {
  const res = await fetch(`${API_BASE_URL}/get-page2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');

  console.log('📦 Données brutes reçues depuis la base:', data); // 👈 Log full response

  // ✅ Return data even if it's just { site: "..." } for new sites
  return data;
};


