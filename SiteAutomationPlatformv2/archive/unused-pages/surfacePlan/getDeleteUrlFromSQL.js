import axios from 'axios';
import { API_BASE_URL } from '../../api/apiConfig';

const getDeleteUrlFromSQL = async (site, title = null) => {
  try {
    const payload = { site };
    if (title) {
      payload.title = title;
    }
    
    const res = await axios.post(`${API_BASE_URL}/images/get-delete-url`, payload);

    return res.data?.delete_urls || []; // return array
  } catch (err) {
    console.error('❌ Failed to fetch delete_urls from SQL:', err);
    return [];
  }
};

export default getDeleteUrlFromSQL;
