import { BookOpenCheck, Headphones, Languages, ListChecks, PenLine, Sparkles, Volume2 } from "lucide-react";
import { Button } from "./Button";
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

const miniDrills = [
  { type: "选词填空", prompt: "The new bus service has made commuting more ____ for residents.", options: ["A. convenient", "B. accurate", "C. private", "D. severe"], answer: "A. convenient", explanation: "句意是新公交服务让居民通勤更方便。make + 宾语 + 形容词；其他选项语义不合。" },
  { type: "长篇匹配", prompt: "段落：A community garden began with only six families. After neighbors started sharing tools and teaching children how to grow vegetables, more residents joined. The garden later became a regular place for people to meet.", options: ["匹配信息：社区项目如何加强邻里联系。", "匹配信息：城市交通费用为何上涨。"], answer: "匹配“社区项目如何加强邻里联系”。", explanation: "sharing tools、teaching children、a place to meet 都指向邻里互动。做匹配时找语义同义替换，不要只找相同单词。" },
  { type: "仔细阅读", prompt: "Online courses allow students to study at flexible times. However, some learners find it difficult to stay motivated without regular contact with teachers. Short weekly meetings can help them receive feedback and keep up with their studies.", options: ["A. 灵活的时间安排能解决所有学习困难。", "B. 定期交流和反馈能帮助部分线上学习者坚持。", "C. 线上课程不适合任何学生。", "D. 教师反馈会降低学习积极性。"], answer: "B", explanation: "证据是 Short weekly meetings can help them receive feedback and keep up with their studies。A、C、D 都比原文说得更绝对或与原文相反。" },
  { type: "听力理解", prompt: "先听短句再回答：What helped the team finish the project on time?", script: "The project was delayed at first. The team later divided the work into smaller tasks and reviewed its progress each week. As a result, members found problems early and finished the project on time.", options: ["A. 每周检查进度并及早发现问题。", "B. 临时增加了项目预算。", "C. 取消了所有小组会议。"], answer: "A", explanation: "抓因果信号 As a result；团队每周检查进度，及早发现问题，最后按时完成。" },
  { type: "写作审题", prompt: "Writing task: Some students think university students should take part in volunteer work. Do you agree? Give reasons and explain how students can balance volunteering with study.", options: ["动笔前先列：立场；两个理由或一个理由加例子；如何安排学习与志愿服务。"], answer: "参考提纲：同意适度参与；可服务社区并锻炼沟通/协作；用固定时段安排志愿活动，优先完成课程任务。", explanation: "题目有两个明确任务：表明是否同意并说明理由、解释如何平衡。漏答其中一个会偏题。答案是提纲示例，可形成自己的论证。" },
  { type: "段落翻译", prompt: "请先译成英文：近年来，越来越多的城市建设了公共自行车系统。它们为短途出行提供了便利，也有助于减少道路拥堵。", options: ["先拆为三层信息：近年来的趋势；公共自行车的用途；它带来的另一项好处。"], answer: "参考译文：In recent years, more and more cities have built public bicycle systems. They make short-distance travel more convenient and also help reduce traffic congestion.", explanation: "注意现在完成时表达近年来的变化；make + 宾语 + 形容词；help 后接动词原形。公共自行车也可按语境译为 bike-sharing systems。" },
];

const skillChecklist = [
  { title: "选词填空 · 10题 / 5%", focus: "词性、词形、搭配和上下文逻辑", steps: ["先通读首尾句，判断主题和语气。", "给15个备选词标注词性、可用词形和熟悉搭配。", "按空格结构预判词性：冠词后常接名词，be 后常接形容词/分词，副词常修饰动词或形容词。", "先填搭配和语法线索清楚的空，再回读检查时态、单复数、逻辑与重复使用限制。", "控制时间：它只占5%，不要挤占长篇匹配和仔细阅读。"] },
  { title: "长篇阅读 · 10题 / 10%", focus: "段落主旨和同义改写定位", steps: ["先读题干并圈名词、数字、专名、比较或因果关系。", "将题干改写成自己的短标签，再扫段首/段尾、转折句和例子句。", "逐题核对完整信息，不因只出现同一个单词就匹配。", "按题目说明处理段落复用；做完回看是否有题目和段落遗漏。"] },
  { title: "仔细阅读 · 10题 / 20%", focus: "细节、主旨、推断、词义、态度", steps: ["先读题目，定位段落和证据句；长难句先找主谓宾，再补从句和插入语。", "把原文证据换成简明中文，再对照四个选项的对象、范围、因果和程度。", "推断必须由文中证据支持；作者态度看评价词、转折和结论。", "排除与原文矛盾、未提及、过度扩大/缩小、因果倒置或张冠李戴的选项。"] },
  { title: "听力短篇新闻 · 7题 / 7%", focus: "事件框架与新闻导语", steps: ["听前利用间隙看选项，圈出人物/地点/时间/数字/原因的差别。", "开头优先抓谁、发生什么、何时何地；继续听原因、影响和后续措施。", "留意数字单位、日期、专名及否定；没听清一个词不要丢掉后续信息。"] },
  { title: "听力长对话 · 8题 / 8%", focus: "目的、问题、方案和说话人态度", steps: ["听前把选项缩成差异信息，不重读四个选项共同出现的内容。", "听开场判断场景与双方关系，再抓问题、原因、建议、决定。", "特别留意回答句、转折后的信息、委婉拒绝和语气；区分事实、计划与建议。"] },
  { title: "听力篇章 · 10题 / 20%", focus: "主旨、结构、例证、因果和结论", steps: ["先看选项的主题差异；听首句判断主题，按段落信号词建立结构。", "例子通常服务于观点；听出例子说明什么，而非只记例子细节。", "记录 however、although、instead、therefore、as a result 等逻辑方向。", "做完用原文或听力稿定位错因：词不认识、声音没辨出、逻辑误判还是选项误读。"] },
  { title: "短文写作 · 1题 / 15%", focus: "回应题目、结构清楚、语言可靠", steps: ["审题圈出主题、对象、立场和每个子任务，先列提纲再写。", "推荐三段：直接回应；理由一+解释/例子；理由二或解决办法+收束。", "段落只表达一个中心，使用准确的因果、转折、递进连接。", "最后检查漏答要点、主谓一致、时态、冠词、单复数、拼写和标点；用熟悉句式写完整。"] },
  { title: "汉译英段落 · 1题 / 15%", focus: "信息完整、句法正确、自然表达", steps: ["通读后按意群拆句，标出时间、主体、动作、因果/转折和修饰语。", "先写简单句主干，再处理定语、状语、非谓语和并列关系。", "关键词想不起时换成准确的简单表达，不要编造复杂句。", "检查信息漏译、时态语态、主谓一致、冠词、复数、搭配和拼写。"] },
];

const themeGroups = [
  { name: "校园、教育与学习", words: "课程、作业、评估、奖学金、学习策略、线上学习、学业表现", skills: "听力校园事务；阅读教育研究；写作学习习惯与能力培养" },
  { name: "科学研究与学术结论", words: "研究问题、实验、证据、样本、结果、限制、结论、相关性", skills: "听懂研究目的/发现；区分 correlation 与 causation；识别结论边界" },
  { name: "科技、数字生活与媒体", words: "设备、平台、隐私、算法、数据、人工智能、社交媒体、创新", skills: "听懂产品/项目说明；阅读科技对行为与社会的影响" },
  { name: "环境、能源与城市", words: "排放、资源、回收、可持续、公共交通、城市规划、污染", skills: "因果链和解决方案；比较政策效果；翻译环境与城市发展信息" },
  { name: "健康、心理与生活方式", words: "睡眠、营养、锻炼、压力、习惯、治疗、风险、幸福感", skills: "听懂建议/症状/结果；阅读研究限制；避免把相关性当成因果" },
  { name: "工作、就业与职业发展", words: "招聘、技能、培训、薪酬、劳动市场、远程工作、工作满意度", skills: "听力职业场景；阅读就业趋势和工作方式变化" },
  { name: "消费、营销与行为选择", words: "消费者、价格、折扣、需求、品牌、广告、决策、预算", skills: "听出购买意图和限制条件；识别调查数据与营销主张" },
  { name: "社会、社区与公共政策", words: "社区、公共服务、政策、资金、志愿服务、人口、公共参与", skills: "听清项目目的/资金/成效；阅读政策对象和执行结果" },
  { name: "文化、历史与传统", words: "传统、遗产、节日、手工艺、保护、传承、文化交流", skills: "翻译专名与文化概念；用解释性表达准确传达含义" },
  { name: "经济、数据与趋势", words: "收入、成本、就业率、增长、下降、比例、平均值、趋势", skills: "数字单位不漏；比较基数/时间段；区别 rise by 与 rise to" },
  { name: "旅行、交通与日常服务", words: "预订、路线、延误、换乘、设施、投诉、解决方案", skills: "听出人物需求、时间地点、变更和最终安排" },
  { name: "自然、动物与农业", words: "栖息地、物种、生态、农作物、土壤、气候、保护", skills: "识别说明文的分类、过程、影响和保护措施" },
];

const grammarTopics = [
  "句子主干与成分：主谓宾、主系表、宾补；先划主干，再读修饰语。",
  "时态与语态：一般/进行/完成时；主动与被动；时间线前后一致。",
  "主谓一致：主语中心词、并列主语、不定代词和数量表达。",
  "名词与限定词：可数/不可数、单复数、冠词 a/an/the、数量词。",
  "代词与指代：人称、单复数、this/that/they 的指向是否明确。",
  "形容词、副词与比较：位置、比较级/最高级、as...as、修饰对象。",
  "非谓语动词：to do、doing、done 的句法作用与逻辑主语。",
  "三类从句：定语从句、名词性从句、时间/原因/让步/条件状语从句。",
  "并列、连接与标点：and/but/or；however/therefore；逗号拼接句要避免。",
  "介词与固定结构：动词/形容词/名词 + 介词；动词后接 to do 或 doing。",
  "虚拟、条件和倒装：识别句意与常见结构，写作中只用自己掌握的形式。",
  "构词与词形：前后缀、词根；名词/动词/形容词/副词转换及拼写变化。",
  "篇章逻辑：因果、转折、让步、举例、递进、对比、结论、问题—解决。",
  "标点与拼写：句首大写、句末标点、逗号、单词拼写和专名格式。",
];

export function ExamCoverage() {
  return <section className={styles.wrap}>
    <header className={styles.hero}>
      <p className={styles.kicker}>CET-4 EXAM MAP</p>
      <h2>四级考点全景图</h2>
      <p>把考试题型、语言底座、主题场景、训练流程和复盘标准放进一张地图。它覆盖现行笔试考核范围；单词和练习数量仍会继续扩充，不能把这张地图误当成15年原题库。</p>
    </header>
    <aside className={styles.notice}>
      <strong>先说明当前工作台的真实覆盖度</strong>
      <p>当前词库为 160 个精选词，约 4,500 词的课程要求词汇范围尚未完整收录；下方现有 6 道原创示范题也不是题库。本站现在补上完整现行题型的考点清单、12 类主题训练地图、每日复盘流程和阶段路线。我们没有逐题取得并核算近 15 年全部考卷，所以不宣称覆盖全部历年考点、不伪造词频或命中率。你应把词库当作已启动的核心词卡，而不是完整词表。</p>
    </aside>
    <div className={styles.tableWrap}>
      <h3>官方笔试结构</h3>
      <div className={styles.table} role="table" aria-label="四级笔试结构">
        <div className={styles.rowHead} role="row"><span>部分</span><span>题型与题量</span><span>占比</span><span>时间</span></div>
        {examParts.map(row => <div className={styles.row} role="row" key={row.part}><strong>{row.part}</strong><span>{row.task}</span><span>{row.weight}</span><span>{row.time}</span></div>)}
      </div>
      <small>来源：中国教育考试网 CET-4 笔试结构及考核内容；总时长 125 分钟。分数为报道分，单题正确数不直接等于对应报道分。</small>
    </div>
    <section className={styles.library}>
      <header><div><span className={styles.eyebrow}>考点总账 · 按题型逐项自检</span><h3>这场考试究竟要会什么</h3></div><p>现行笔试的8个训练单元都列在这里。把“看过技巧”变成“做题时能执行的动作”。</p></header>
      <div className={styles.skillGrid}>{skillChecklist.map((unit, index) => <details className={styles.skillCard} key={unit.title} open={index < 2}>
        <summary><span className={styles.skillNumber}>{String(index + 1).padStart(2, "0")}</span><span><strong>{unit.title}</strong><small>{unit.focus}</small></span></summary>
        <ol>{unit.steps.map(step => <li key={step}>{step}</li>)}</ol>
      </details>)}</div>
    </section>
    <section className={styles.library}>
      <header><div><span className={styles.eyebrow}>阅读与听力材料主题</span><h3>12类内容场景，词汇放进语境学</h3></div><p>主题是练习素材的分类，不是押题。每个场景都需要认识关键词、常见搭配和表达关系。</p></header>
      <div className={styles.themeGrid}>{themeGroups.map((group, index) => <article className={styles.themeCard} key={group.name}><span>{String(index + 1).padStart(2, "0")}</span><h4>{group.name}</h4><p><strong>词汇场：</strong>{group.words}</p><p><strong>训练点：</strong>{group.skills}</p></article>)}</div>
    </section>
    <section className={styles.library}>
      <header><div><span className={styles.eyebrow}>语言基本功 · 阅读与写译共同底座</span><h3>语法和篇章检查清单</h3></div><p>不要求把术语背成定义；目标是在读句子、选词和写译时能认出并正确使用。</p></header>
      <ul className={styles.grammarGrid}>{grammarTopics.map((topic, index) => <li key={topic}><span>{String(index + 1).padStart(2, "0")}</span>{topic}</li>)}</ul>
    </section>
    <section className={styles.library}>
      <header><div><span className={styles.eyebrow}>每日60分钟 · 闭环练习</span><h3>别只刷新词数，要每天留下证据</h3></div></header>
      <div className={styles.routineGrid}>
        <article><strong>早上 20 分钟 · 词汇</strong><p>先做当天到期词；看英文先主动回忆中文，再看中文想英文。新词最多约20个；到期复习太多时减少新词。挑3个词各造一个短句，避免只认中文释义。</p></article>
        <article><strong>阅读 20 分钟 · 证据链</strong><p>轮换选词填空、长篇匹配和仔细阅读。每次至少写下“题干关键词—原文证据—同义改写—错项错因”；不要只抄答案。</p></article>
        <article><strong>听力 15 分钟 · 听懂再听</strong><p>先读选项并圈差异；盲听作答；再看原文找漏听原因；最后跟读关键句。每周轮换新闻、长对话和篇章，训练词块、熟词生义、数字、否定和转折。</p></article>
        <article><strong>写译 5 分钟 · 小输出</strong><p>当天选一项：列作文提纲、改写一个理由句，或把中文段落拆成意群翻译。最后检查主谓、时态、冠词、单复数和拼写。</p></article>
      </div>
      <div className={styles.reviewCycle}><strong>错题复盘四步</strong><span>归类错因</span><b>→</b><span>找原文证据</span><b>→</b><span>改写成自己的规则</span><b>→</b><span>隔天重做</span></div>
    </section>
    <section className={styles.library}>
      <header><div><span className={styles.eyebrow}>到12月12日的训练路线</span><h3>从恢复手感到整套稳定</h3></div><p>总训练时间约7周半；整套模考需要另留连续125分钟，不应塞进日常60分钟。</p></header>
      <div className={styles.phaseGrid}>
        <article><span>第1—2周 · 重启底座</span><p>词汇主动回忆与基础搭配；练拆句；阅读先不限时找证据；听力短句练辨音和数字。</p></article>
        <article><span>第3—4周 · 分题型</span><p>三种阅读、三种听力分开训练；每周写译各至少一次；按错因调整下一周重点。</p></article>
        <article><span>第5—6周 · 限时提稳</span><p>逐步加限时；至少完成两次完整125分钟模拟或可靠真题套卷；复盘用时、空题和错因。</p></article>
        <article><span>最后10天 · 查漏与节奏</span><p>回做错题和标记词；熟悉答题顺序与时间；少加新资料，保持睡眠并核对准考证要求。</p></article>
      </div>
    </section>
    <div className={styles.grid}>
      {points.map(({ icon: Icon, title, badge, items }) => <details className={styles.card} key={title} open={title === "词汇与语法底座" || title === "阅读三种题型"}>
        <summary><span className={styles.icon}><Icon size={19} /></span><span className={styles.cardTitle}>{title}</span><span className={styles.badge}>{badge}</span></summary>
        <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
      </details>)}
    </div>
    <section className={styles.drills}>
      <div><h3>6道原创示范题</h3><p>覆盖六种主要任务样式，先独立作答，再展开解析。每种目前只有一题，不能当成足量题库，也不是历年原题。</p></div>
      <div className={styles.drillGrid}>{miniDrills.map((drill, index) => <article className={styles.drill} key={drill.type}>
        <span className={styles.drillLabel}>{String(index + 1).padStart(2, "0")} · {drill.type}</span>
        <p>{drill.prompt}</p>
        {drill.script && <Button variant="outline" size="sm" onClick={() => { if (!("speechSynthesis" in window)) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(drill.script); utterance.lang = "en-US"; utterance.rate = 0.85; window.speechSynthesis.speak(utterance); }}><Volume2 size={15}/>播放短句</Button>}
        {drill.options && <ul>{drill.options.map(option => <li key={option}>{option}</li>)}</ul>}
        <details className={styles.answer}><summary>查看答案与解析</summary><p><strong>{drill.answer}</strong> {drill.explanation}</p></details>
      </article>)}</div>
    </section>
    <footer className={styles.sources}>
      <strong>参考资料与证据边界</strong>
      <a href="https://cet.neea.edu.cn/html1/report/16123/196-1.htm" target="_blank" rel="noreferrer">中国教育考试网：全国大学英语四级笔试（CET4）</a>
      <a href="https://cet.neea.edu.cn/xhtml1/report/16123/177-1.htm" target="_blank" rel="noreferrer">中国教育考试网：CET 笔试考核内容</a>
      <a href="https://cet.neea.edu.cn/res/Home/1704/55b02330ac17274664f06d9d3db8249d.pdf" target="_blank" rel="noreferrer">中国教育考试网：《全国大学英语四、六级考试大纲（2016年修订版）》</a>
      <a href="https://www.edu.cn/gao_jiao_788/20060323/t20060323_110131.shtml" target="_blank" rel="noreferrer">《大学英语课程教学要求（试行）》：约4,500词和700词组的推荐范围</a>
      <a href="https://jingxuan.douyin.com/m/video/7684969066745957673" target="_blank" rel="noreferrer">抖音公开系列：四级听力按主题练词块、熟词生义和同义替换（2026年9月）</a>
      <a href="https://www.douyin.com/video/7582204194128743738" target="_blank" rel="noreferrer">抖音公开内容：阅读选项须回到文章证据，不能只凭词面技巧排除</a>
      <a href="https://english-exam.lazynote.cn/cet4/words/stats/syllabus/" target="_blank" rel="noreferrer">第三方历年真题词频检索：页面说明其统计口径与语料；本站未独立复核</a>
      <p>官方材料用于确认题型和大纲；社交平台内容只作学习方法线索，不等于命题数据。小红书公开索引未返回可独立核验的四级笔记正文，因此本版没有把未经核验的笔记或热度当作来源。第三方词频页声称按历年真题统计，但本站没有取得并复算其全部底层试卷，故只作为外部查阅入口，不导入排名。本站未逐题收录近15年试卷；真题频次排名必须基于有出处、可复核的完整语料统计。真题版权题目不在此复制。</p>
    </footer>
  </section>;
}
