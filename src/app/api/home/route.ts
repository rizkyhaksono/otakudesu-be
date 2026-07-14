import home from "@/utils/home"
import { apiHandler } from "@/lib/apiHandler"

export async function GET() {
  return apiHandler(() => home())
}
