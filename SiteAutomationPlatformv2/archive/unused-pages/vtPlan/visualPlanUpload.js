// uploadUtils.js - Refactored to use common utilities
import {
  uploadImageToImgBB,
  saveImageMetadataToSQL,
  deleteImageFromImgBB,
  deleteImageMetadataFromSQL,
  uploadVisualPlan
} from '../../utils/commonUploadUtils';

// Re-export common functions with original names for backward compatibility
export const uploadToImgBB = uploadImageToImgBB;
export const saveImageToSQL = saveImageMetadataToSQL;
export const deleteFromImgBB = deleteImageFromImgBB;
export const deleteFromSQL = deleteImageMetadataFromSQL;

// High-level visual plan upload function
export { uploadVisualPlan };