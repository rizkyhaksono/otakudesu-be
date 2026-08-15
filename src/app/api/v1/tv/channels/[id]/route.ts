import { tvChannel } from "@/utils/tv/channels";
import { apiHandler } from "@/lib/shared/apiHandler";
import { channelIdSchema, parse } from "@/lib/shared/validate";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return apiHandler(() => tvChannel(parse(channelIdSchema, id, "channel id")), {
    sMaxAge: 21_600,
  });
}
