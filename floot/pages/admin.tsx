"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, BookOpenCheck, CalendarDays, Clock3, RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminStats } from "../endpoints/admin-stats_GET.schema";
import styles from "./admin.module.css";

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours ? `${hours}小时${minutes ? `${minutes}分钟` : ""}` : `${minutes}分钟`;
}

function formatDay(day: string) {
  return new Date(`${day}T00:00:00+08:00`).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  });
}

export default function AdminDashboardPage() {
  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
    staleTime: 60_000,
  });

  const progressRate = data?.registeredUsers
    ? Math.round((data.progressUsers / data.registeredUsers) * 100)
    : 0;
  const maxRegistrations = Math.max(1, ...(data?.registrationsByDay.map((day) => day.registrations) ?? [0]));
  const updatedLabel = data
    ? new Date(data.generatedAt).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.backLink} to="/">
            <ArrowLeft size={17} aria-hidden="true" />
            <span>返回学习工作台</span>
          </Link>
          <div className={styles.headerRow}>
            <div>
              <p className={styles.eyebrow}>ADMIN · 汇总统计</p>
              <h1>使用数据面板</h1><Link className={styles.backLink} to="/library-review">真题资料库 · 审核样本 →</Link>
              <p className={styles.subtitle}>只看整体使用情况，不展示任何人的邮箱或个人学习内容。</p>
            </div>
            <button className={styles.refresh} type="button" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? styles.spinning : undefined} aria-hidden="true" />
              <span>{isFetching ? "更新中" : "刷新数据"}</span>
            </button>
          </div>
          {data && <p className={styles.updated}>数据更新于北京时间 {updatedLabel}</p>}
        </header>

        {isPending && (
          <section className={styles.loading} aria-live="polite">
            <span className={styles.spinner} />
            正在读取统计数据…
          </section>
        )}

        {error && (
          <section className={styles.error} role="alert">
            <strong>暂时无法读取数据</strong>
            <span>{error instanceof Error ? error.message : "请稍后重试。"}</span>
            <button type="button" onClick={() => void refetch()}>重新加载</button>
          </section>
        )}

        {data && (
          <>
            <section className={styles.heroGrid} aria-label="核心账号统计">
              <article className={styles.primaryCard}>
                <div className={styles.cardTop}>
                  <span>累计注册账号</span>
                  <span className={styles.iconBadge}><Users size={19} aria-hidden="true" /></span>
                </div>
                <strong className={styles.primaryValue}>{data.registeredUsers}</strong>
                <span className={styles.cardFoot}>近7天新增 {data.registrationsLast7Days} 个</span>
              </article>
              <article className={styles.progressCard}>
                <div className={styles.cardTop}>
                  <span>已保存学习进度</span>
                  <span className={styles.iconBadge}><BookOpenCheck size={19} aria-hidden="true" /></span>
                </div>
                <strong className={styles.primaryValue}>{data.progressUsers}<small> / {data.registeredUsers}</small></strong>
                <span className={styles.cardFoot}>注册账号中 {progressRate}% 保存过进度</span>
              </article>
            </section>

            <section className={styles.metricGrid} aria-label="近况与学习统计">
              <article className={styles.metricCard}>
                <span className={styles.metricIcon}><CalendarDays size={17} aria-hidden="true" /></span>
                <span className={styles.metricLabel}>近7天活跃账号</span>
                <strong>{data.activeAccountsLast7Days}</strong>
                <small>按登录会话去重估算</small>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricIcon}><BookOpenCheck size={17} aria-hidden="true" /></span>
                <span className={styles.metricLabel}>近7天更新进度</span>
                <strong>{data.progressUsersLast7Days}</strong>
                <small>有学习记录更新的账号</small>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricIcon}><Clock3 size={17} aria-hidden="true" /></span>
                <span className={styles.metricLabel}>累计学习时长</span>
                <strong className={styles.timeValue}>{formatMinutes(data.totalStudyMinutes)}</strong>
                <small>来自用户保存的学习进度</small>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricIcon}><BarChart3 size={17} aria-hidden="true" /></span>
                <span className={styles.metricLabel}>错题记录</span>
                <strong>{data.savedMistakes}</strong>
                <small>所有账号保存记录合计</small>
              </article>
            </section>

            <section className={styles.chartCard}>
              <div className={styles.chartHeading}>
                <div>
                  <p className={styles.eyebrow}>近14天</p>
                  <h2>每日新增注册</h2>
                </div>
                <span className={styles.chartTotal}>近7天新增 <strong>{data.registrationsLast7Days}</strong></span>
              </div>
              <div className={styles.chart} role="img" aria-label="最近14天每日新增注册账号数量柱状图">
                {data.registrationsByDay.map((day) => {
                  const height = day.registrations ? Math.max(8, (day.registrations / maxRegistrations) * 100) : 2;
                  return (
                    <div className={styles.barColumn} key={day.date} title={`${formatDay(day.date)}：新增 ${day.registrations} 个账号`}>
                      <span className={styles.barCount}>{day.registrations || ""}</span>
                      <div className={styles.barTrack}>
                        <span className={day.registrations ? styles.bar : styles.emptyBar} style={{ height: `${height}%` }} />
                      </div>
                      <span className={styles.barDate}>{formatDay(day.date)}</span>
                    </div>
                  );
                })}
              </div>
              <p className={styles.chartNote}>按北京时间统计注册日期；没有新增的日期显示为空柱。</p>
            </section>

            <section className={styles.notes} aria-label="统计口径">
              <h2>统计口径</h2>
              <ul>
                <li><strong>注册账号</strong>：数据库中创建的学习账号；匿名网页访客没有被记录，因此不代表总访问人数。</li>
                <li><strong>活跃账号</strong>：近7天有访问会话的去重账号；会话可能来自不同设备，不能当作访问次数。</li>
                <li><strong>保留会话</strong>：当前尚未清理的登录会话记录，不是历史累计用户数。</li>
                <li><strong>学习时长和错题</strong>：仅统计用户保存到工作台的记录，不包含未保存或网站外学习。</li>
              </ul>
              <p className={styles.sessionNote}>当前保留登录会话 {data.retainedSessions} 条，近7天活跃会话 {data.sessionsLast7Days} 条；它们都不是独立人数。</p>
            </section>
          </>
        )}

        <footer className={styles.footer}>四级高效上岸工作台 · 管理员数据面板</footer>
      </div>
    </main>
  );
}
