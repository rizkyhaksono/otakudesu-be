import { radioStation } from "@/utils/radio/stations";
import { apiHandler } from "@/lib/shared/apiHandler";
import { parse } from "@/lib/shared/validate";
import { z } from "zod";

// radio-browser ids are UUIDs.
const idSchema = z.string().trim().uuid();

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return apiHandler(() => radioStation(parse(idSchema, id, "station id")), { sMaxAge: 21_600 });
}
