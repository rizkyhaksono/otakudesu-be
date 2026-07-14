import { NextRequest } from "next/server"
import ongoingAnime from "@/utils/ongoingAnime"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  return apiHandler(() => ongoingAnime(params.id))
}
