import { requireUser } from "@/lib/server/auth";
import { errorResponse, json } from "@/lib/server/errors";
import { listSongs } from "@/lib/server/repertoire";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return json({ songs: await listSongs(user.uid) });
  } catch (error) {
    return errorResponse(error);
  }
}
