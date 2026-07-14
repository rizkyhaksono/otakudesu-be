import { NextRequest } from "next/server"
import search from "@/utils/search"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ keyword: string }> }
) {
  const params = await props.params
  return apiHandler(() => search(decodeURIComponent(params.keyword)))
}
