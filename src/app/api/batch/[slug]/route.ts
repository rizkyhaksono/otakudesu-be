import { NextRequest } from "next/server"
import batch from "@/utils/batch"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  return apiHandler(() => batch({ batchSlug: params.slug }))
}
