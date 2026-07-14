import schedule from "@/utils/schedule"
import { apiHandler } from "@/lib/apiHandler"

export async function GET() {
  return apiHandler(() => schedule())
}
