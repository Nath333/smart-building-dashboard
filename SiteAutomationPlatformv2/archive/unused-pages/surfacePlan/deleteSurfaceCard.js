import axios from 'axios';
import { message } from 'antd';
import { API_BASE_URL } from '../../api/apiConfig';
import getDeleteUrlFromSQL from './getDeleteUrlFromSQL';

const deleteSurfaceCard = async (delete_urls, site, title) => {
  try {
    // If single string passed, convert to array
    if (!Array.isArray(delete_urls)) {
      if (!delete_urls && site && title) {
        console.warn('ℹ️ delete_urls missing, fetching from SQL...');
        delete_urls = await getDeleteUrlFromSQL(site, title);
      } else if (typeof delete_urls === 'string') {
        delete_urls = [delete_urls];
      } else {
        throw new Error('❌ No delete_url(s) provided and site/title missing');
      }
    }

    if (!delete_urls.length) {
      throw new Error('❌ No delete_urls to delete');
    }

    console.log(`📡 Deleting ${delete_urls.length} image(s)...`);

    for (const url of delete_urls) {
      console.log('🚮 Deleting from ImgBB:', url);

      // 1. Delete from ImgBB
      const res = await axios.post(`${API_BASE_URL}/images/delete-imgbb`, {
        delete_url: url,
      });
      console.log('📥 ImgBB response:', res.data);

      const success =
        res.data.success === true || res.data.message?.includes('deleted');
      if (!success) {
        console.warn(`⚠️ Failed to delete from ImgBB for url: ${url}`);
      }

      // 2. Delete from SQL
      const res2 = await axios.post(`${API_BASE_URL}/images/delete-sql`, {
        delete_url: url,
      });
      console.log('🗄️ SQL delete response:', res2.data);

      const success2 =
        res2.data.success === true || res2.data.message?.includes('deleted');
      if (!success2) {
        console.warn(`⚠️ Failed to delete from SQL for url: ${url}`);
      }
    }

    message.success(`✅ ${delete_urls.length} image(s) deleted`);
    return true;
  } catch (err) {
    console.error('❌ deleteSurfaceCard failed:', err);
    message.error('Erreur lors de la suppression');
    throw err;
  }
};

export default deleteSurfaceCard;
