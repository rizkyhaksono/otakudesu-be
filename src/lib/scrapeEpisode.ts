import { load, CheerioAPI } from 'cheerio';
import type { episode as episodeType } from '@/types/types';

const { BASEURL } = process.env;
const scrapeEpisode = (html: string): episodeType | undefined => {
  const $ = load(html);
  const episode = getEpisodeTitle($);
  const stream_url = getStreamUrl($);
  const download_urls = createDownloadData($);
  const previous_episode = getPrevEpisode($);
  const next_episode = getNextEpisode($);
  const anime = getAnimeData($);
  if (!episode) return undefined;

  return {
    episode,
    anime,
    has_next_episode: !!next_episode,
    next_episode,
    has_previous_episode: !!previous_episode,
    previous_episode,
    stream_url,
    download_urls,
  };
};

const getEpisodeTitle = ($: CheerioAPI) => {
  return $('.venutama .posttl').text();
};

const getStreamUrl = ($: CheerioAPI) => {
  return $('#pembed iframe').attr('src');
};

const createDownloadData = ($: CheerioAPI) => {
  const mp4 = getMp4DownloadUrls($);
  const mkv = getMkvDownloadUrls($);
  return {
    mp4,
    mkv,
  };
};

const getMp4DownloadUrls = ($: CheerioAPI) => {
  const result = [];
  const mp4DownloadEls = $('.download ul:first li')
    .toString()
    .split('</li>')
    .filter((item) => item.trim() !== '')
    .map((item) => `${item}</li>`);

  for (const el of mp4DownloadEls) {
    const $ = load(el);
    const downloadUrls = $('a')
      .toString()
      .split('</a>')
      .filter((item) => item.trim() !== '')
      .map((item) => `${item}</a>`);
    const urls = [];

    for (const downloadUrl of downloadUrls) {
      const $ = load(downloadUrl);
      urls.push({
        provider: $('a').text(),
        url: $('a').attr('href'),
      });
    }
    result.push({
      resolution: $('strong').text()?.replace(/([A-z][A-z]\d )/, ''),
      urls,
    });
  }

  return result;
};

const getMkvDownloadUrls = ($: CheerioAPI) => {
  const result = [];
  const mp4DownloadEls = $('.download ul:last li')
    .toString()
    .split('</li>')
    .filter((item) => item.trim() !== '')
    .map((item) => `${item}</li>`);

  for (const el of mp4DownloadEls) {
    const $ = load(el);
    const downloadUrls = $('a')
      .toString()
      .split('</a>')
      .filter((item) => item.trim() !== '')
      .map((item) => `${item}</a>`);
    const urls = [];

    for (const url of downloadUrls) {
      const $ = load(url);
      urls.push({
        provider: $('a').text(),
        url: $('a').attr('href'),
      });
    }
    result.push({
      resolution: $('strong').text()?.replace(/([A-z][A-z][A-z] )/, ''),
      urls,
    });
  }

  return result;
};

const getPrevEpisode = ($: CheerioAPI) => {
  const prevEpisodeLink = $('.flir a[title="Episode Sebelumnya"]').attr('href');

  if (prevEpisodeLink?.includes('/episode/')) {
    return {
      slug: prevEpisodeLink.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/episode\//, '').replace('/', ''),
      otakudesu_url: prevEpisodeLink,
    };
  } else {
    return null;
  }
};

const getNextEpisode = ($: CheerioAPI) => {
  const nextEpisodeLink = $('.flir a[title="Episode Selanjutnya"]').attr('href');

  if (nextEpisodeLink?.includes('/episode/')) {
    return {
      slug: nextEpisodeLink
        .replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/episode\//, '')
        .replace(/\/$/, ''),
      otakudesu_url: nextEpisodeLink,
    };
  } else {
    return null;
  }
};


const getAnimeData = ($: CheerioAPI) => {
  if ($('.flir a:nth-child(3)').text().trim() === '' || $('.flir a:nth-child(3)').text() === undefined) {
    return {
      slug: $('.flir a:first').attr('href')?.replace(`${BASEURL}/anime/`, '')?.replace('/', ''),
      otakudesu_url: $('.flir a:first').attr('href'),
    };
  }
  const animeUrl = $('.flir a:nth-child(2)').attr('href');
  return {
    slug: animeUrl?.split('/').slice(4).join('/'),
    otakudesu_url: $('.flir a:nth-child(2)').attr('href'),
  };
};

export default scrapeEpisode;