import { requireUser } from "@/lib/server/auth";
import { errorResponse, json } from "@/lib/server/errors";

export async function GET(request: Request) {
  try { return json({ user: await requireUser(request) }); }
  catch (error) { return errorResponse(error); }
}
