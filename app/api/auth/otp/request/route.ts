import { requestOtp } from "@/lib/server/auth";
import { assertSameOrigin } from "@/lib/server/auth-settings";
import { emailSchema, readAuthBody } from "@/lib/server/auth-body";
import { errorResponse, HttpError, json } from "@/lib/server/errors";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = emailSchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new HttpError(400, "Informe um e-mail válido.");
    await requestOtp(parsed.data.email);
    return json({ message: "Se este e-mail estiver autorizado, você receberá um código de acesso." }, 202);
  } catch (error) { return errorResponse(error, "otp-request"); }
}
