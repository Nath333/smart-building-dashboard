import axios from 'axios';
import { API_BASE_URL } from '../config/app.config.js';

export const uploadImageToImgBB = async (file, site, type, title) => {
  console.log('🔧 uploadImageToImgBB called with:', {
    fileType: file?.constructor?.name,
    fileName: file?.name,
    fileSize: file?.size,
    site,
    type,
    title
  });

  const formData = new FormData();
  formData.append('image', file);
  formData.append('site', site);
  formData.append('type', type);
  formData.append('title', title);

  console.log('📦 FormData created, sending to backend...');

  try {
    const response = await axios.post(`${API_BASE_URL}/images/upload-imgbb`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('✅ Backend response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ uploadImageToImgBB failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      fullError: error.response?.data?.details || error.response?.data?.error || 'No details available'
    });
    throw error;
  }
};

export const saveImageToSQL = async (params) => {
  const {
    url, url_viewer, delete_url, site, type, zone_name, title,
    image_id, shapes, width, height,
    crop_transform_x, crop_transform_y,
    crop_transform_width, crop_transform_height,
    card_id, x, y, label, image_url, module_type, comments, devis_name,
    url_thumb, url_medium
  } = params;

  const response = await axios.post(`${API_BASE_URL}/images/upload-sql`, {
    url_viewer: url_viewer || url,
    delete_url,
    site,
    type,
    zone_name,
    title,
    image_id,
    shapes,
    width,
    height,
    crop_transform_x,
    crop_transform_y,
    crop_transform_width,
    crop_transform_height,
    card_id,
    x,
    y,
    label,
    image_url,
    module_type,
    comments,
    devis_name,
    url_thumb,
    url_medium
  });
  return response.data;
};

export const deleteImageFromImgBB = async (delete_url) => {
  return await axios.post(`${API_BASE_URL}/images/delete-imgbb`, { delete_url });
};

export const deleteImageFromSQL = async (delete_url) => {
  return await axios.post(`${API_BASE_URL}/images/delete-sql`, { delete_url });
};

export const fetchSqlImages2 = async (site) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/images/get-sql-images`, { site });
    return res.data;
  } catch (error) {
    console.error('❌ SQL image fetch failed:', error);
    throw error;
  }
};
