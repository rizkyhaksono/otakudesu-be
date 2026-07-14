import { NextRequest } from "next/server"
import episode from "@/utils/episode"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string; episode: string }> }
) {
  const params = await props.params
  const episodeNumber = parseInt(params.episode, 10)

  return apiHandler(async () => {
    if (Number.isNaN(episodeNumber)) {
      throw new Error("Invalid episode")
    }

    return episode({
      animeSlug: params.slug,
      episodeNumber,
    })
  })
}
