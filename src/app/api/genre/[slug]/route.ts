import { NextRequest } from "next/server"
import animeByGenre from "@/utils/animeByGenre"
import { apiHandler } from "@/lib/apiHandler"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  const { searchParams } = new URL(request.url)
  const reqPage = searchParams.get("page")
  const pageNumber = reqPage ? parseInt(reqPage, 10) : 1

  return apiHandler(async () => {
    if (Number.isNaN(pageNumber) || pageNumber < 1) {
      throw new Error("Invalid page")
    }
    return animeByGenre(params.slug, pageNumber)
  })
}
