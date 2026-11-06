import { NextResponse } from "next/server";
import { authConfig } from "@/config/auth";
import { verifyOtp } from "@/lib/server/auth";
import { assertSameOrigin, sessionCookieName, sessionCookieOptions } from "@/lib/server/auth-settings";
import { codeSchema, readAuthBody } from "@/lib/server/auth-body";
import { errorResponse, HttpError } from "@/lib/server/errors";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = codeSchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new HttpError(400, "Informe seu e-mail e o código de seis dígitos.");
    const { user, token } = await verifyOtp(parsed.data.email, parsed.data.code);
    const response = NextResponse.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(sessionCookieName(), token, { ...sessionCookieOptions(), maxAge: authConfig.sessionLifetimeMs / 1000 });
    return response;
  } catch (error) { return errorResponse(error); }
}
