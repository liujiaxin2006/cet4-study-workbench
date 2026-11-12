// Headwords checked against the CET-4 portion of the 2016 official CET syllabus.
// Meanings, collocations, examples and notes are original learning aids, not copied from the syllabus.
const entries = [
  [
    "acknowledge",
    "承认；确认收到",
    "acknowledge a problem",
    "The manager acknowledged the problem and promised to investigate.",
    "经理承认了问题，并承诺调查。",
    "阅读中可表示承认某个事实。"
  ],
  [
    "adapt",
    "适应；改编",
    "adapt to change",
    "Students need time to adapt to a new learning environment.",
    "学生需要时间适应新的学习环境。",
    "adapt to 表示适应；adapt for 表示改编供……使用。"
  ],
  [
    "acquire",
    "获得；习得",
    "acquire a skill",
    "Regular practice helps learners acquire new skills.",
    "规律练习有助于学习者掌握新技能。",
    "acquisition 是名词。"
  ],
  [
    "advocate",
    "提倡；支持者",
    "advocate a policy",
    "Some researchers advocate a shorter working week.",
    "一些研究人员提倡缩短每周工作时间。",
    "既可作动词，也可作名词。"
  ],
  [
    "anticipate",
    "预期；期待",
    "anticipate a change",
    "The team anticipated a rise in demand.",
    "团队预计需求会上升。",
    "anticipate 后可接名词或动名词。"
  ],
  [
    "apparent",
    "明显的；表面上的",
    "become apparent",
    "The reason for the delay soon became apparent.",
    "延误的原因很快显现出来。",
    "apparently 表示看来、显然。"
  ],
  [
    "assess",
    "评估；估计",
    "assess the impact",
    "The school will assess the impact of the new program.",
    "学校将评估新项目的影响。",
    "assessment 是名词。"
  ],
  [
    "attribute",
    "把……归因于；属性",
    "attribute A to B",
    "Researchers attributed the change to better sleep.",
    "研究人员把这一变化归因于睡眠改善。",
    "作动词时常用 attribute A to B。"
  ],
  [
    "bias",
    "偏见；使有偏向",
    "avoid bias",
    "A good survey should avoid bias in its questions.",
    "好的调查应避免问题带有偏向。",
    "biased 为形容词。"
  ],
  [
    "category",
    "类别",
    "fall into a category",
    "These questions fall into three broad categories.",
    "这些问题分为三大类。",
    "复数形式是 categories。"
  ],
  [
    "coherent",
    "连贯的；条理清楚的",
    "a coherent argument",
    "Her essay presents a coherent argument.",
    "她的文章论证条理清楚。",
    "写作评价中常见。"
  ],
  [
    "compensate",
    "补偿；弥补",
    "compensate for",
    "Extra practice can compensate for a weak start.",
    "额外练习可以弥补起步较弱的不足。",
    "compensate for 表示弥补。"
  ],
  [
    "concept",
    "概念；观念",
    "a basic concept",
    "The teacher explained the concept with a simple example.",
    "老师用一个简单例子解释了这个概念。",
    "conceptual 是形容词。"
  ],
  [
    "consistent",
    "一致的；持续的",
    "be consistent with",
    "The results are consistent with earlier research.",
    "这些结果与早期研究一致。",
    "consistent with 表示与……一致。"
  ],
  [
    "contemporary",
    "当代的；同时代的",
    "contemporary society",
    "The article discusses a problem in contemporary society.",
    "文章讨论了当代社会的一个问题。",
    "在阅读中通常指当代的。"
  ],
  [
    "context",
    "语境；背景",
    "in context",
    "The meaning of the word is clearer in context.",
    "这个词在语境中的意思更清楚。",
    "不要脱离上下文猜词义。"
  ],
  [
    "controversy",
    "争议",
    "cause controversy",
    "The proposal caused controversy among residents.",
    "这项提议在居民中引起争议。",
    "controversial 是形容词。"
  ],
  [
    "cooperate",
    "合作",
    "cooperate with",
    "The two schools agreed to cooperate on the project.",
    "两所学校同意在该项目上合作。",
    "cooperate with sb；cooperate on sth。"
  ],
  [
    "coordinate",
    "协调；坐标",
    "coordinate activities",
    "The volunteers coordinated their activities online.",
    "志愿者们在线协调各项活动。",
    "作动词时重音与名词用法可能不同。"
  ],
  [
    "decline",
    "下降；拒绝",
    "a decline in",
    "The city saw a decline in traffic accidents.",
    "这座城市的交通事故数量下降了。",
    "可作名词或动词；注意 decline in。"
  ],
  [
    "derive",
    "源于；获得",
    "derive from",
    "Many English words derive from Latin.",
    "许多英语单词源于拉丁语。",
    "derive from 表示源于。"
  ],
  [
    "detect",
    "发现；察觉",
    "detect a change",
    "The device can detect small changes in temperature.",
    "这个设备能检测到微小的温度变化。",
    "detection 是名词。"
  ],
  [
    "diverse",
    "多样的",
    "diverse backgrounds",
    "Students come from diverse backgrounds.",
    "学生来自不同背景。",
    "diversity 是名词。"
  ],
  [
    "domestic",
    "国内的；家庭的",
    "domestic travel",
    "Domestic travel became more popular that year.",
    "那一年国内旅行更受欢迎。",
    "结合语境区分国内与家庭两个含义。"
  ],
  [
    "enhance",
    "提高；增强",
    "enhance performance",
    "Feedback can enhance students' writing skills.",
    "反馈能提高学生的写作能力。",
    "与 improve 意思接近。"
  ],
  [
    "expand",
    "扩大；扩展",
    "expand access",
    "The library plans to expand access to digital books.",
    "图书馆计划扩大数字图书的使用范围。",
    "expansion 是名词。"
  ],
  [
    "expose",
    "使接触；暴露",
    "be exposed to",
    "Children are exposed to different ideas through reading.",
    "孩子们通过阅读接触到不同观点。",
    "be exposed to 后接名词。"
  ],
  [
    "external",
    "外部的",
    "external factors",
    "External factors also influence the result.",
    "外部因素也会影响结果。",
    "与 internal 相对。"
  ],
  [
    "initial",
    "最初的；首字母",
    "initial stage",
    "The project is still in its initial stage.",
    "项目仍处于初期阶段。",
    "initially 是副词。"
  ],
  [
    "insight",
    "洞察；深入理解",
    "gain insight into",
    "The interview gave us insight into student needs.",
    "访谈让我们更了解学生的需求。",
    "常用 insight into。"
  ],
  [
    "interact",
    "互动；相互作用",
    "interact with",
    "Students learn more when they interact with others.",
    "学生与他人互动时学得更多。",
    "interaction 是名词。"
  ],
  [
    "internal",
    "内部的",
    "internal system",
    "The company updated its internal system.",
    "公司更新了内部系统。",
    "与 external 相对。"
  ],
  [
    "invest",
    "投资；投入",
    "invest in",
    "The school invested in new learning materials.",
    "学校投资购买了新的学习材料。",
    "invest in 可指投入时间、精力或资金。"
  ],
  [
    "justify",
    "证明……有理由",
    "justify a decision",
    "The evidence does not justify the decision.",
    "这些证据不足以证明该决定合理。",
    "justification 是名词。"
  ],
  [
    "perceive",
    "察觉；理解",
    "perceive a risk",
    "People may perceive the same risk differently.",
    "人们对同一种风险的理解可能不同。",
    "perception 是名词。"
  ],
  [
    "persist",
    "坚持；持续存在",
    "persist in doing",
    "She persisted in practicing every day.",
    "她坚持每天练习。",
    "persist in 后接动名词。"
  ],
  [
    "potential",
    "潜在的；潜力",
    "potential benefit",
    "The plan has potential benefits for students.",
    "这项计划可能给学生带来益处。",
    "potential 可作名词和形容词。"
  ],
  [
    "promote",
    "促进；推广",
    "promote health",
    "Regular exercise can promote better health.",
    "规律运动有助于增进健康。",
    "promotion 是名词。"
  ],
  [
    "pursue",
    "追求；继续进行",
    "pursue a goal",
    "He decided to pursue his goal of becoming a teacher.",
    "他决定继续追求成为教师的目标。",
    "pursuit 是名词。"
  ],
  [
    "recover",
    "恢复；找回",
    "recover from",
    "The town recovered from the storm gradually.",
    "这个城镇逐渐从暴风雨中恢复过来。",
    "recover from 表示从……恢复。"
  ]
];
export const officialStarterWords = entries.map(([word, meaning, collocation, example, translation, note]) => ({ word, meaning, collocation, example, translation, note, phonetic: "" }));
