import comicBrowse from "./browse";
import type { ComicGenre } from "@/types/comic";

/** The genre list is embedded in every catalogue page, so reuse that request. */
const comicGenres = async (): Promise<ComicGenre[]> => (await comicBrowse()).genres;

export default comicGenres;
