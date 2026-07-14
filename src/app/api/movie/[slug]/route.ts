import { NextRequest } from "next/server"
import movie from "@/utils/movie"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  return apiHandler(() => movie(params.slug))
}
