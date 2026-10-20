import { BookOpenCheck, Headphones, Languages, ListChecks, PenLine, Sparkles } from "lucide-react";
import styles from "./ExamCoverage.module.css";

const examParts = [
  { part: "写作", task: "短文写作 1 题", weight: "15%", time: "30 分钟" },
  { part: "听力", task: "短篇新闻 7 题；长对话 8 题；听力篇章 10 题", weight: "35%", time: "约 25 分钟" },
  { part: "阅读", task: "选词填空 10 题；长篇匹配 10 题；仔细阅读 10 题", weight: "35%", time: "40 分钟" },
  { part: "翻译", task: "汉译英段落 1 题", weight: "15%", time: "30 分钟" },
];

const points = [
  { icon: Sparkles, title: "词汇与语法底座", badge: "贯穿四项", items: ["词义要放回上下文判断：熟词生义、词性变化、近义词辨析。", "构词法：常见前缀、后缀、词根；名词、动词、形容词、副词之间的转换。", "固定搭配与介词：动词 + 介词、形容词 + 介词、名词 + 介词，以及动词后接 to do / doing。", "句子主干：主谓宾、主系表；主谓一致、时态语态、比较结构、代词指代。", "长难句：定语从句、名词性从句、状语从句、非谓语、并列与插入成分。", "篇章逻辑：因果、转折、让步、举例、递进、对比、结论；识别 however、therefore、rather than 等信号。"] },
  { icon: BookOpenCheck, title: "阅读三种题型", badge: "占总分 35%", items: ["选词填空：先判断空格词性和语法形式，再看搭配与上下文；不要只凭中文意思硬套。", "长篇匹配：先读题干关键词并标注同义替换，再扫段落主题句和专有名词；一段可能对应多题，按题目要求判断。", "仔细阅读：题干定位原文证据，识别同义改写；区分主旨、细节、推断、词义和作者态度题。", "干扰项排除：原文未提、偷换对象或范围、因果倒置、过度绝对化、把例子当结论。", "复盘格式：题干关键词 → 原文证据句 → 正确项改写 → 错项错因。不要只记选项字母。"] },
  { icon: Headphones, title: "听力三种题型", badge: "占总分 35%", items: ["短篇新闻：听事件、人物、地点、时间、原因和结果；留心数字、专名及新闻导语。", "长对话：听双方身份、谈话目的、问题与解决方案；转折后常出现关键信息。", "听力篇章：抓主题句、段落结构、举例用途、因果关系和结尾结论。", "常见陷阱：只听到原词却忽略否定；数字/日期混淆；把建议当事实；忽略 but、although、instead 等转折。", "训练流程：先限时听题并作答，再看原文定位漏听处，最后跟读关键句；重复播放不能代替理解。当前站内音频是浏览器合成语音，不是四级真题录音。"] },
  { icon: PenLine, title: "写作", badge: "30 分钟 · 15%", items: ["先审题：明确主题、对象、写作任务和必须覆盖的要点，再列 2—3 段提纲。", "常见训练任务：观点表达与论证、现象原因与建议、问题解决、图表或材料信息概括、应用场景写作。具体以当次题目要求为准。", "结构：开头回应题目；主体每段只讲一个理由并给解释或例子；结尾总结或提出行动。", "语言得分点：主谓一致、时态稳定、冠词/单复数、连接词准确、句式有变化但不冒险。", "交卷前检查：是否答全题目要点、句子是否完整、拼写标点、重复用词、字迹与篇幅。背模板不能替代切题。"] },
  { icon: Languages, title: "汉译英段落", badge: "30 分钟 · 15%", items: ["先通读段落，划分意群；确定主干，再处理修饰信息，不要逐词硬翻。", "重点语法：时态与语态、主谓一致、定语/状语从句、非谓语、比较结构、名词单复数和冠词。", "常见主题素材：传统文化与节日、教育与学习、科技与生活、社会发展、环境与健康、城市与经济。它们是练习主题分类，不代表官方预测。", "检查：信息是否完整、逻辑关系是否准确、专名/数字是否遗漏、拼写和搭配是否自然。遇到不会的词先换成正确的简单表达。"] },
  { icon: ListChecks, title: "考前 7 周训练顺序", badge: "每天约 60 分钟", items: ["第 1—2 周：补高频基础词与核心语法；阅读训练定位证据；听力练数字、转折和主旨。", "第 3—4 周：按选词、匹配、仔细阅读分题型练；每周至少完成 2 次短写作或段落翻译。", "第 5—6 周：做整套或分模块限时训练；记录每类错因，优先补最常错的一类。", "第 7 周：回做错题与薄弱题型，熟悉流程和时间分配；保持睡眠，避免临时堆新内容。", "日常安排保持你的 20 分钟词汇 + 20 分钟阅读 + 15 分钟听力 + 5 分钟写译；整套模拟另找连续时间完成。"] },
];

export function ExamCoverage() {
  return <section className={styles.wrap}>
    <header className={styles.hero}>
      <p className={styles.kicker}>CET-4 EXAM MAP</p>
      <h2>四级考点全景图</h2>
      <p>按现行笔试结构整理的系统复习清单。可用它查缺补漏；具体题目仍要靠持续练习和错题复盘。</p>
    </header>
    <aside className={styles.notice}>
      <strong>先说明当前工作台的真实覆盖度</strong>
      <p>现有词库补充后为 160 个精选词（并非完整四级词表）；站内练习仍较少：1 篇阅读短文（1 道题）、1 句合成语音、1 句翻译练习，没有成套写作题和完整真题卷。因此工作台尚未覆盖完整四级词汇或近 15 年真题。这里新增的是全部现行题型的考点地图与训练方法，不是 15 年真题题库，也不提供未经统计的“最高频”排名。</p>
    </aside>
    <div className={styles.tableWrap}>
      <h3>官方笔试结构</h3>
      <div className={styles.table} role="table" aria-label="四级笔试结构">
        <div className={styles.rowHead} role="row"><span>部分</span><span>题型与题量</span><span>占比</span><span>时间</span></div>
        {examParts.map(row => <div className={styles.row} role="row" key={row.part}><strong>{row.part}</strong><span>{row.task}</span><span>{row.weight}</span><span>{row.time}</span></div>)}
      </div>
      <small>来源：中国教育考试网 CET-4 笔试结构及考核内容；总时长 125 分钟。分数为报道分，单题正确数不直接等于对应报道分。</small>
    </div>
    <div className={styles.grid}>
      {points.map(({ icon: Icon, title, badge, items }) => <details className={styles.card} key={title} open={title === "词汇与语法底座" || title === "阅读三种题型"}>
        <summary><span className={styles.icon}><Icon size={19} /></span><span className={styles.cardTitle}>{title}</span><span className={styles.badge}>{badge}</span></summary>
        <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
      </details>)}
    </div>
    <footer className={styles.sources}>
      <strong>官方参考</strong>
      <a href="https://cet.neea.edu.cn/html1/report/16123/196-1.htm" target="_blank" rel="noreferrer">中国教育考试网：全国大学英语四级笔试（CET4）</a>
      <a href="https://cet.neea.edu.cn/xhtml1/report/16123/177-1.htm" target="_blank" rel="noreferrer">中国教育考试网：CET 笔试考核内容</a>
      <p>“近 15 年最高频词/考点”必须用可核验的历年试卷逐题标注、去重后统计；目前没有把 15 年原卷纳入本站，因此这里不会伪造频次或声称真题全收录。真题版权题目也不在此复制。</p>
    </footer>
  </section>;
}
