import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";
import { StudyState } from "./study-progress_GET.schema";
import superjson from "superjson";

const emptyState: StudyState = { version: 1, minutes: 0, daily: {}, words: {}, mistakes: [] };

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const row = await db.selectFrom("studyProgress")
      .select(["state", "revision"])
      .where("userId", "=", user.id)
      .executeTakeFirst();
    return new Response(superjson.stringify(row ? { state: row.state, revision: row.revision } : { state: emptyState, revision: 0 }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const isAuth = error instanceof NotAuthenticatedError;
    return new Response(superjson.stringify({ error: isAuth ? "请先登录。" : "读取学习进度失败，请重试。" }), {
      status: isAuth ? 401 : 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}
