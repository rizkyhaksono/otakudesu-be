import { radioTags } from "@/utils/radio/stations";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => radioTags(), { sMaxAge: 21_600, staleWhileRevalidate: 43_200 });
}
