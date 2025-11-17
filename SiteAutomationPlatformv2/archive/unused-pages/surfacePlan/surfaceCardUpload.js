import {
  batchUploadToImgBB,
  saveBatchMetadataToSQL
} from '../../utils/commonUploadUtils';
import drawPolygonsOnImage from './drawPolygonsOnImage';
import { getSiteName } from '../../utils/siteContext';
import axios from 'axios';
import { API_BASE_URL } from '../../api/apiConfig';

const uploadToImgBB = async (cards, name) => {
  // Get siteName from centralized utility
  const siteName = getSiteName();

  try {
    // ❌ REMOVED: Don't delete all cards - allow adding new cards alongside existing ones
    // This was causing all existing images to be deleted when uploading new ones
    // console.log('🗑️ Deleting existing surface cards...');
    // await deleteSurfaceCard(null, siteName, 'surface');

    const allRows = [];
    console.log('📤 Uploading surface cards to ImgBB:', name);

    for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
      const card = cards[cardIndex];
      if (!card.image) continue;

      // Generate only annotated image for surface cards
      const annotatedImage = await drawPolygonsOnImage(card.image, card.shapes || []);

      // Prepare single annotated image for upload
      const imagesToUpload = [
        {
          dataUrl: annotatedImage,
          name: `${name}-card-${cardIndex}-annotated`
        }
      ];

      // Use common batch upload utility
      const [annotatedResult] = await batchUploadToImgBB(imagesToUpload);

      const shapesStr = JSON.stringify(card.shapes || []);
      const now = new Date();

      // Generate unique card_id for this card using cardIndex and random to avoid duplicates
      const cardId = card.card_id || `surface-card-${cardIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      // Prepare SQL row - surface type image
      allRows.push({
        site: siteName,
        title: 'surface',
        type: 'surface',
        url_viewer: annotatedResult.url,
        delete_url: annotatedResult.delete_url,
        shapes: shapesStr,
        datetime: now,
        card_id: cardId,
      });
    }

    if (allRows.length > 0) {
      // Use common batch SQL save utility
      await saveBatchMetadataToSQL(allRows);
      console.log('✅ Surface plan upload successful:', allRows.length, 'entries');
    }
  } catch (err) {
    console.error('❌ Surface plan upload failed:', err);
    throw err; // Re-throw to allow error handling upstream
  }
};

export default uploadToImgBB;
