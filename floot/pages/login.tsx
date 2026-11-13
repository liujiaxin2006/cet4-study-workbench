"use client";

import { useState } from "react";
import {Link,useLocation} from "react-router-dom";
import {safeReturnPath} from "../helpers/safeReturnPath";
import {useAuth} from "../helpers/useAuth";
import { Helmet } from "react-helmet";
import { BookOpen, CheckCircle2, Leaf, ShieldCheck } from "lucide-react";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import styles from "./login.module.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const location=useLocation();
  const {authState}=useAuth();
  const target=safeReturnPath(new URLSearchParams(location.search).get("next"));
  const adminEntry=target==="/admin"||target.startsWith("/admin?")||target.startsWith("/library-review");
  return (
    <main className={styles.page}>
      <Helmet><title>CET-4 Copilot</title><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><meta name="theme-color" content="#f8f7ff" /><link rel="manifest" href="/manifest.json" /></Helmet>
      <section className={styles.intro}>
        <a className={styles.brand} href="/"><span className={styles.brandIcon}><Leaf size={20} /></span>CET-4 Copilot</a>
        <div className={styles.introCopy}>
          <p className={styles.eyebrow}>CET-4 COPILOT</p>
          <h1>每天稳稳学，<br />一步步过四级。</h1>
          <p>给 2026 年四级备考准备的学习空间。手机和电脑使用同一账号，进度保存在云端。</p>
          <div className={styles.promise}><span><CheckCircle2 size={17} /> 每日 60 分钟学习计划</span><span><CheckCircle2 size={17} /> 词汇主动回忆与阅读训练</span><span><ShieldCheck size={17} /> 每个账号的数据独立保存</span></div>
        </div>
        <div className={styles.quote}><BookOpen size={19} /><span>Start small. Keep going.</span></div>
      </section>
      <section className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.mobileBrand}><span className={styles.brandIcon}><Leaf size={18} /></span>CET-4 Copilot</div>
          <p className={styles.eyebrow}>{mode === "login" ? "欢迎回来" : "新建学习账号"}</p>
          <h2>{mode === "login" ? (adminEntry?"登录管理后台":"登录工作台") : "注册一个新账号"}</h2>
          <p className={styles.formIntro}>{mode === "login" ? (adminEntry?"使用管理员账号查看用户、板块统计和题库。":"用你的邮箱和密码继续学习。") : "注册后，手机和电脑登录同一账号即可同步进度。"}</p>
          {authState.type==="authenticated"&&<p className={styles.formIntro}>当前已登录：{authState.user.displayName} · <Link to={target}>继续前往{adminEntry?"后台":"工作台"} →</Link></p>}
          {mode === "login" ? <PasswordLoginForm /> : <PasswordRegisterForm />}
          <p className={styles.switchMode}>{mode === "login" ? "还没有账号？" : "已经注册过？"} <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "免费注册" : "返回登录"}</button></p>
          {!adminEntry&&<p className={styles.switchMode}><Link to="/login?next=%2Fadmin">管理后台登录 →</Link></p>}
          <p className={styles.dataNote}>账号数据保存在工作台的云端数据库；我们不会读取你的其他网站账号。</p>
        </div>
      </section>
    </main>
  );
}
