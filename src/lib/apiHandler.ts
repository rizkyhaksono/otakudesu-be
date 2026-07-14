import { NextResponse } from "next/server";
import { axios } from "@/lib/http";

export async function apiHandler<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();

    if (data === undefined || data === null || data === false) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("BASEURL")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return NextResponse.json({ error: "Upstream request timed out" }, { status: 504 });
      }

      const upstreamStatus = error.response?.status;
      if (upstreamStatus === 404) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }

      return NextResponse.json({ error: "Upstream request failed" }, { status: 502 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
