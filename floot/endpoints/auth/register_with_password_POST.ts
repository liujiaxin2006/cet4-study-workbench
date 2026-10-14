import { db } from "../../helpers/db";
import { schema } from "./register_with_password_POST.schema";
import { randomBytes } from "crypto";
import { sql } from "kysely";
import { setServerSession, SessionExpirationSeconds } from "../../helpers/getSetServerSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import superjson from "superjson";

const MAX_SIGNUPS_PER_HOUR = 60;
const MAX_SIGNUPS_PER_DAY = 200;

function fail(message: string, status: number) {
  return new Response(superjson.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function handle(request: Request) {
  try {
    const { email, password, displayName } = schema.parse(superjson.parse(await request.text()));
    const now = new Date();
    const hourStart = new Date(now.getTime() - 60 * 60 * 1000);
    const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const result = await db.transaction().execute(async (trx) => {
      // Serialize signups so simultaneous requests cannot bypass the global cap.
      await sql`SELECT pg_advisory_xact_lock(hashtextextended('cet4_signup_global', 0))`.execute(trx);

      const existing = await trx.selectFrom("users")
        .select("id")
        .where(sql`LOWER(BTRIM(users.email))`, "=", email)
        .executeTakeFirst();
      if (existing) return { type: "duplicate" as const };

      const hourly = await trx.selectFrom("users").select(trx.fn.countAll<number>().as("count"))
        .where("createdAt", ">=", hourStart).executeTakeFirstOrThrow();
      const daily = await trx.selectFrom("users").select(trx.fn.countAll<number>().as("count"))
        .where("createdAt", ">=", dayStart).executeTakeFirstOrThrow();
      if (Number(hourly.count) >= MAX_SIGNUPS_PER_HOUR || Number(daily.count) >= MAX_SIGNUPS_PER_DAY) {
        return { type: "limited" as const };
      }

      const passwordHash = await generatePasswordHash(password);
      const user = await trx.insertInto("users")
        .values({ email, displayName, role: "user" })
        .returning(["id", "email", "displayName", "createdAt"])
        .executeTakeFirstOrThrow();
      await trx.insertInto("userPasswords")
        .values({ userId: user.id, passwordHash }).execute();

      const sessionId = randomBytes(32).toString("hex");
      await trx.insertInto("sessions").values({
        id: sessionId,
        userId: user.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt: new Date(now.getTime() + SessionExpirationSeconds * 1000),
      }).execute();
      return { type: "created" as const, user, sessionId };
    });

    if (result.type === "duplicate") return fail("这个邮箱已注册，请直接登录。", 409);
    if (result.type === "limited") return fail("新用户注册暂时较多，请稍后再试。", 429);

    const response = new Response(superjson.stringify({ user: { ...result.user, role: "user" as const } }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
    await setServerSession(response, { id: result.sessionId, createdAt: now.getTime(), lastAccessed: now.getTime() });
    return response;
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "23505") return fail("这个邮箱已注册，请直接登录。", 409);
    console.error("Registration error:", error);
    return fail("注册失败，请检查输入或稍后重试。", 400);
  }
}
