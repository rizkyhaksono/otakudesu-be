import genreLists from "@/utils/genreLists"
import { apiHandler } from "@/lib/apiHandler"

export async function GET() {
  return apiHandler(() => genreLists())
}
