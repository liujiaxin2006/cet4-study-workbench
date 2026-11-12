import { z } from "zod";

const registrationDaySchema = z.object({
  date: z.string(),
  registrations: z.number().int().nonnegative(),
});

export const adminStatsSchema = z.object({
  registeredUsers: z.number().int().nonnegative(),
  adminUsers: z.number().int().nonnegative(),
  registrationsLast7Days: z.number().int().nonnegative(),
  activeAccountsLast7Days: z.number().int().nonnegative(),
  retainedSessions: z.number().int().nonnegative(),
  sessionsLast7Days: z.number().int().nonnegative(),
  progressUsers: z.number().int().nonnegative(),
  progressUsersLast7Days: z.number().int().nonnegative(),
  totalStudyMinutes: z.number().int().nonnegative(),
  savedMistakes: z.number().int().nonnegative(),
  generatedAt: z.string().datetime(),
  registrationsByDay: z.array(registrationDaySchema),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;

export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch("/_api/admin-stats", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(response.status === 403 ? "当前账号没有管理员权限。" : "暂时无法读取数据，请稍后重试。");
  }
  return adminStatsSchema.parse(result);
}
