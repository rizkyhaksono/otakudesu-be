import axios from "axios";
import { load } from "cheerio";

const { BASEURL } = process.env;
const movie = async (slug: string): Promise<any> => {
  const { data } = await axios.get(`${BASEURL}episode/${slug}`);
  const $ = load(data);

  const checkUrl = $(".episodelist ul li span a").attr("href");
  const fixedUrl = checkUrl?.split("/")[4];

  const { data: movieData } = await axios.get(`${BASEURL}episode/${fixedUrl}`);
  const $$ = load(movieData);

  const title = $(".posttl").html() ?? $$(".posttl").html()
  const iframeSrc = $("iframe").attr("src") ?? $$("iframe").attr("src");
  const downloadLinks: { quality: string; links: { name: string; url: string }[] }[] = [];

  $(".yondarkness-title").each((index, element) => {
    const quality = $$(element).text().trim();
    const links: { name: string; url: string }[] = [];
    $$(element)
      .next(".yondarkness-item")
      .find("a")
      .each((i, el) => {
        const name = $$(el).text().trim();
        const url = $$(el).attr("href") ?? "";
        links.push({ name, url });
      });
    downloadLinks.push({ quality, links });
  });

  if (downloadLinks.length === 0) {
    $$(".yondarkness-item").each((index, element) => {
      const quality = $$(element).find("a").text().trim();
      const links: { name: string; url: string }[] = [];
      $$(element)
        .find("a")
        .each((i, el) => {
          const name = $$(el).text().trim();
          const url = $$(el).attr("href") ?? "";
          links.push({ name, url });
        });
      downloadLinks.push({ quality, links });
    });
  }

  return { title, iframeSrc, downloadLinks };
};

export default movie;
