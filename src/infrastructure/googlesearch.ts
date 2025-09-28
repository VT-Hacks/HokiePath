import axios from 'axios';
import { config } from '../config';

export const searchGoogle = async (query: string, num = 5) => {
  const params = {
    key: config.google.key,
    cx: config.google.id,
    q: query,
    num,
  };

  const response = await axios.get(
    'https://www.googleapis.com/customsearch/v1',
    { params }
  );
  return response.data.items || [];
};
