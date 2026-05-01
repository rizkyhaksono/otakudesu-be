import { load, CheerioAPI } from 'cheerio';
import type { movie } from '@/types/types';

const scrapeMovie = (html: string): movie | undefined => {
  const $ = load(html);
  const title = $('.venutama .posttl').text();
  if (!title) return undefined;

  return {
    title,
    iframe_src: $('#pembed iframe').attr('src'),
    download_urls: {
      mp4: parseDownloadList($, '.download ul:first li', /([A-z][A-z]\d )/),
      mkv: parseDownloadList($, '.download ul:last li', /([A-z][A-z][A-z] )/),
    },
  };
};

const parseDownloadList = (
  $: CheerioAPI,
  selector: string,
  resolutionStripPattern: RegExp,
) => {
  const result: {
    resolution: string | undefined
    urls: { provider: string | undefined; url: string | undefined }[]
  }[] = [];

  $(selector).each((_, li) => {
    const urls: { provider: string | undefined; url: string | undefined }[] = [];
    $(li).find('a').each((_, a) => {
      urls.push({ provider: $(a).text(), url: $(a).attr('href') });
    });
    result.push({
      resolution: $(li).find('strong').text()?.replace(resolutionStripPattern, ''),
      urls,
    });
  });

  return result;
};

export default scrapeMovie;
