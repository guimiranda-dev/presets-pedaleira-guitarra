import { NextResponse } from "next/server";
import { revokeSession } from "@/lib/server/auth";
import { assertSameOrigin, sessionCookieName, sessionCookieOptions } from "@/lib/server/auth-settings";
import { errorResponse } from "@/lib/server/errors";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await revokeSession(request);
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(sessionCookieName(), "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) { return errorResponse(error); }
}
