import { currentUserId, userStore } from "@/lib/user-store";
import type { UserPrefs } from "@/lib/user-types";

export async function PATCH(request: Request) {
  const patch = (await request.json()) as Partial<UserPrefs>;
  const uid = await currentUserId();
  userStore.updatePrefs(uid, patch);
  return Response.json(userStore.prefs(uid));
}
