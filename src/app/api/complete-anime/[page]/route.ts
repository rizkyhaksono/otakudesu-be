import { NextRequest } from "next/server"
import completeAnime from "@/utils/completeAnime"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ page: string }> }
) {
  const params = await props.params
  return apiHandler(() => completeAnime(params.page))
}
