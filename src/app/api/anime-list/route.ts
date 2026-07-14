import animeList from "@/utils/animeList"
import { apiHandler } from "@/lib/apiHandler"

export async function GET() {
  return apiHandler(() => animeList())
}
