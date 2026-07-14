import { NextRequest } from "next/server"
import anime from "@/utils/anime"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  return apiHandler(() => anime(params.slug))
}
