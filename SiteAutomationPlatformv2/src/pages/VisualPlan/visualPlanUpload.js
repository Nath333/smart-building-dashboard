// Visual Plan Upload Utilities
import {
  uploadImageToImgBB,
  saveImageToSQL,
  deleteImageFromImgBB,
  deleteImageFromSQL
} from '../../api/imageApi.js';

// Re-export with original names for backward compatibility
export const uploadToImgBB = uploadImageToImgBB;
export const deleteFromImgBB = deleteImageFromImgBB;
export const deleteFromSQL = deleteImageFromSQL;

// Export saveImageToSQL directly
export { saveImageToSQL };