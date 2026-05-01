import { load } from 'cheerio';
import type { batch as batchType } from '@/types/types';

const scrapeBatch = (html: string): batchType => {
  const $ = load(html);
  const batch = $('.download2 .batchlink h4').text();
  const download_urls: batchType['download_urls'] = [];

  $('.download2 .batchlink ul li').each((_, li) => {
    const urls: { provider: string | undefined; url: string | undefined }[] = [];
    $(li).find('a').each((_, a) => {
      urls.push({
        provider: $(a).text(),
        url: $(a).attr('href'),
      });
    });

    download_urls.push({
      resolution: $(li).find('strong').text().replace(/([A-z][A-z][0-9] )/, ''),
      file_size: $(li).find('i').text(),
      urls,
    });
  });

  return { batch, download_urls };
};

export default scrapeBatch;
