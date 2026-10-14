import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";
import { Json } from "../helpers/schema";
import { schema } from "./study-progress_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await request.text()));
    const now = new Date();
    const state = input.state as Json;
    if (input.revision === 0) {
      const created = await db.insertInto("studyProgress")
        .values({ userId: user.id, state, revision: 1, updatedAt: now })
        .onConflict((conflict) => conflict.column("userId").doNothing())
        .returning("revision")
        .executeTakeFirst();
      if (!created) return new Response(superjson.stringify({ error: "另一台设备刚保存了进度，请刷新后重试。" }), { status: 409, headers: { "Content-Type": "application/json" } });
      return new Response(superjson.stringify({ revision: created.revision }), { headers: { "Content-Type": "application/json" } });
    }
    const updated = await db.updateTable("studyProgress")
      .set({ state, revision: input.revision + 1, updatedAt: now })
      .where("userId", "=", user.id)
      .where("revision", "=", input.revision)
      .returning("revision")
      .executeTakeFirst();
    if (!updated) return new Response(superjson.stringify({ error: "另一台设备刚保存了进度，请刷新后重试。" }), { status: 409, headers: { "Content-Type": "application/json" } });
    return new Response(superjson.stringify({ revision: updated.revision }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const isAuth = error instanceof NotAuthenticatedError;
    return new Response(superjson.stringify({ error: isAuth ? "请先登录。" : "保存学习进度失败，请检查内容后重试。" }), {
      status: isAuth ? 401 : 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}
