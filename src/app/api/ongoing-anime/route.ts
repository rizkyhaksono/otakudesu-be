import ongoingAnime from "@/utils/ongoingAnime"
import { apiHandler } from "@/lib/apiHandler"

export async function GET() {
  return apiHandler(() => ongoingAnime())
}
