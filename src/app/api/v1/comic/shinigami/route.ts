import { shinigamiStatus } from "@/utils/comic/shinigami";
import { apiHandler } from "@/lib/shared/apiHandler";

export async function GET() {
  return apiHandler(() => shinigamiStatus(), {
    sMaxAge: 1800,
    staleWhileRevalidate: 3600,
  });
}
