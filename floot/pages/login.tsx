"use client";

import { useState } from "react";
import { Helmet } from "react-helmet";
import { BookOpen, CheckCircle2, Leaf, ShieldCheck } from "lucide-react";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import styles from "./login.module.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <main className={styles.page}>
      <Helmet><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><meta name="theme-color" content="#275c46" /><link rel="manifest" href="/manifest.json" /></Helmet>
      <section className={styles.intro}>
        <a className={styles.brand} href="/"><span className={styles.brandIcon}><Leaf size={20} /></span>四级上岸</a>
        <div className={styles.introCopy}>
          <p className={styles.eyebrow}>CET-4 STUDY COMPANION</p>
          <h1>每天稳稳学，<br />一步步过四级。</h1>
          <p>给 2026 年四级备考准备的学习空间。手机和电脑使用同一账号，进度保存在云端。</p>
          <div className={styles.promise}><span><CheckCircle2 size={17} /> 每日 60 分钟学习计划</span><span><CheckCircle2 size={17} /> 词汇主动回忆与阅读训练</span><span><ShieldCheck size={17} /> 每个账号的数据独立保存</span></div>
        </div>
        <div className={styles.quote}><BookOpen size={19} /><span>Start small. Keep going.</span></div>
      </section>
      <section className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.mobileBrand}><span className={styles.brandIcon}><Leaf size={18} /></span>四级上岸</div>
          <p className={styles.eyebrow}>{mode === "login" ? "欢迎回来" : "新建学习账号"}</p>
          <h2>{mode === "login" ? "登录工作台" : "注册一个新账号"}</h2>
          <p className={styles.formIntro}>{mode === "login" ? "用你的邮箱和密码继续学习。" : "注册后，手机和电脑登录同一账号即可同步进度。"}</p>
          {mode === "login" ? <PasswordLoginForm /> : <PasswordRegisterForm />}
          <p className={styles.switchMode}>{mode === "login" ? "还没有账号？" : "已经注册过？"} <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "免费注册" : "返回登录"}</button></p>
          <p className={styles.dataNote}>账号数据保存在工作台的云端数据库；我们不会读取你的其他网站账号。</p>
        </div>
      </section>
    </main>
  );
}
