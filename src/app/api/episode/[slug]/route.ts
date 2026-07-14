import { NextRequest } from "next/server"
import episode from "@/utils/episode"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  return apiHandler(() => episode({ episodeSlug: params.slug }))
}
