import axios from 'axios';
import 'dotenv/config';
import scrapeGenreLists from '../lib/scrapeGenreLists';
import type { genre as genreType } from '../types/types';

const { BASEURL } = process.env;
const genreLists = async (): Promise<genreType[]> => {
  const response = await axios.get(`${BASEURL}/genre-list`);
  const result = scrapeGenreLists(response.data);

  return result;
};

export default genreLists;
