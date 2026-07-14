import { NextRequest } from "next/server"
import episodes from "@/utils/episodes"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  return apiHandler(() => episodes(params.slug))
}
