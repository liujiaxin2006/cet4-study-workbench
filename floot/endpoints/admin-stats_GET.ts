import { sql } from "kysely";
import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";

type RawSummary = {
  registered_users: number | string;
  admin_users: number | string;
  registrations_last_7_days: number | string;
  active_accounts_last_7_days: number | string;
  retained_sessions: number | string;
  sessions_last_7_days: number | string;
  progress_users: number | string;
  progress_users_last_7_days: number | string;
  total_study_minutes: number | string;
  saved_mistakes: number | string;
};

type RawRegistrationDay = {
  date: string;
  registrations: number | string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Vary": "Cookie",
    },
  });
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return json({ error: "需要管理员权限。" }, 403);
    }

    const summaryResult = await sql<RawSummary>`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS registered_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS admin_users,
        (SELECT COUNT(*)::int FROM users WHERE created_at >= now() - interval '7 days') AS registrations_last_7_days,
        (SELECT COUNT(DISTINCT user_id)::int FROM sessions WHERE last_accessed >= now() - interval '7 days') AS active_accounts_last_7_days,
        (SELECT COUNT(*)::int FROM sessions) AS retained_sessions,
        (SELECT COUNT(*)::int FROM sessions WHERE last_accessed >= now() - interval '7 days') AS sessions_last_7_days,
        (SELECT COUNT(*)::int FROM study_progress) AS progress_users,
        (SELECT COUNT(*)::int FROM study_progress WHERE updated_at >= now() - interval '7 days') AS progress_users_last_7_days,
        (SELECT COALESCE(SUM(COALESCE((state->>'minutes')::int, 0)), 0)::int FROM study_progress) AS total_study_minutes,
        (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(state->'mistakes', '[]'::jsonb))), 0)::int FROM study_progress) AS saved_mistakes
    `.execute(db);

    const trendResult = await sql<RawRegistrationDay>`
      WITH date_range AS (
        SELECT generate_series(
          (now() AT TIME ZONE 'Asia/Shanghai')::date - 13,
          (now() AT TIME ZONE 'Asia/Shanghai')::date,
          interval '1 day'
        )::date AS day
      ),
      registrations AS (
        SELECT (created_at AT TIME ZONE 'Asia/Shanghai')::date AS day, COUNT(*)::int AS registrations
        FROM users
        WHERE created_at >= now() - interval '14 days'
        GROUP BY 1
      )
      SELECT to_char(date_range.day, 'YYYY-MM-DD') AS date,
        COALESCE(registrations.registrations, 0)::int AS registrations
      FROM date_range
      LEFT JOIN registrations USING (day)
      ORDER BY date_range.day
    `.execute(db);

    const summary = summaryResult.rows[0];
    if (!summary) return json({ error: "统计数据暂不可用。" }, 500);

    return json({
      registeredUsers: Number(summary.registered_users),
      adminUsers: Number(summary.admin_users),
      registrationsLast7Days: Number(summary.registrations_last_7_days),
      activeAccountsLast7Days: Number(summary.active_accounts_last_7_days),
      retainedSessions: Number(summary.retained_sessions),
      sessionsLast7Days: Number(summary.sessions_last_7_days),
      progressUsers: Number(summary.progress_users),
      progressUsersLast7Days: Number(summary.progress_users_last_7_days),
      totalStudyMinutes: Number(summary.total_study_minutes),
      savedMistakes: Number(summary.saved_mistakes),
      generatedAt: new Date().toISOString(),
      registrationsByDay: trendResult.rows.map((row) => ({
        date: row.date,
        registrations: Number(row.registrations),
      })),
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return json({ error: "请先登录。" }, 401);
    }
    console.error("Admin dashboard query failed:", error);
    return json({ error: "统计数据暂不可用。" }, 500);
  }
}
