import { supplementaryWords } from "./wordBankSupplement";
import { corpusRankedWords } from "./wordBankCorpus";

const starterWordBank = [
  {
    "word": "evidence",
    "phonetic": "/ˈevɪdəns/",
    "meaning": "证据；证明",
    "collocation": "strong evidence",
    "example": "The report provides evidence that the program works.",
    "note": "阅读中常用于作者论证，注意区分 evidence（证据）与 prove（证明）。",
    "translation": "这份报告提供了该项目有效的证据。"
  },
  {
    "word": "establish",
    "phonetic": "/ɪˈstæblɪʃ/",
    "meaning": "建立；证实",
    "collocation": "establish a link",
    "example": "Researchers established a link between sleep and memory.",
    "note": "阅读中也可表示“证实事实”。",
    "translation": "研究人员证实了睡眠与记忆之间的联系。"
  },
  {
    "word": "approach",
    "phonetic": "/əˈproʊtʃ/",
    "meaning": "方法；接近",
    "collocation": "a practical approach",
    "example": "We need a practical approach to the problem.",
    "note": "作名词表示“方法”时常接 to。",
    "translation": "我们需要一种切实可行的方法来解决这个问题。"
  },
  {
    "word": "available",
    "phonetic": "/əˈveɪləbəl/",
    "meaning": "可获得的；有空的",
    "collocation": "be available to",
    "example": "The information is available to all students.",
    "note": "注意 available for（可用于）与 available to（可供……使用）。",
    "translation": "所有学生都能获取这些信息。"
  },
  {
    "word": "benefit",
    "phonetic": "/ˈbenɪfɪt/",
    "meaning": "益处；使受益",
    "collocation": "benefit from",
    "example": "Students benefit from regular feedback.",
    "note": "注意 benefit from 表示“从……中受益”。",
    "translation": "学生能从定期反馈中受益。"
  },
  {
    "word": "concern",
    "phonetic": "/kənˈsɜːrn/",
    "meaning": "担忧；涉及",
    "collocation": "be concerned about",
    "example": "Many people are concerned about air quality.",
    "note": "阅读中常表示“关注的问题”或“使担忧”。",
    "translation": "许多人担心空气质量。"
  },
  {
    "word": "contribute",
    "phonetic": "/kənˈtrɪbjuːt/",
    "meaning": "贡献；促成",
    "collocation": "contribute to",
    "example": "Exercise contributes to better sleep.",
    "note": "contribute to 后接名词或动名词。",
    "translation": "运动有助于改善睡眠。"
  },
  {
    "word": "environment",
    "phonetic": "/ɪnˈvaɪrənmənt/",
    "meaning": "环境；周围状况",
    "collocation": "protect the environment",
    "example": "A quiet environment can improve concentration.",
    "note": "既可指自然环境，也可指学习环境。",
    "translation": "安静的环境能提高注意力。"
  },
  {
    "word": "factor",
    "phonetic": "/ˈfæktər/",
    "meaning": "因素",
    "collocation": "a key factor",
    "example": "Time is an important factor in the decision.",
    "note": "常见结构：factor in / factor affecting。",
    "translation": "时间是作决定的一个重要因素。"
  },
  {
    "word": "indicate",
    "phonetic": "/ˈɪndɪkeɪt/",
    "meaning": "表明；指出",
    "collocation": "indicate that",
    "example": "The results indicate that the plan is working.",
    "note": "图表题中常用来描述数据所显示的趋势。",
    "translation": "结果表明计划正在起作用。"
  },
  {
    "word": "maintain",
    "phonetic": "/meɪnˈteɪn/",
    "meaning": "维持；保养",
    "collocation": "maintain a balance",
    "example": "It is important to maintain a healthy balance.",
    "note": "注意不要与 obtain（获得）混淆。",
    "translation": "保持健康的平衡很重要。"
  },
  {
    "word": "occur",
    "phonetic": "/əˈkɜːr/",
    "meaning": "发生；出现",
    "collocation": "occur to someone",
    "example": "The idea occurred to her during a walk.",
    "note": "表示“某人突然想到”时用 occur to。",
    "translation": "她在散步时想到了这个主意。"
  },
  {
    "word": "particular",
    "phonetic": "/pərˈtɪkjələr/",
    "meaning": "特定的；特别的",
    "collocation": "in particular",
    "example": "One result in particular surprised the team.",
    "note": "in particular 常作“尤其、特别是”。",
    "translation": "有一项结果尤其令团队惊讶。"
  },
  {
    "word": "prevent",
    "phonetic": "/prɪˈvent/",
    "meaning": "阻止；预防",
    "collocation": "prevent someone from doing",
    "example": "Good planning can prevent avoidable mistakes.",
    "note": "被动结构中 from 不能省略。",
    "translation": "良好的规划可以避免本可避免的错误。"
  },
  {
    "word": "provide",
    "phonetic": "/prəˈvaɪd/",
    "meaning": "提供；给予",
    "collocation": "provide someone with something",
    "example": "The course provides students with useful practice.",
    "note": "也可用 provide something for someone。",
    "translation": "这门课程为学生提供了有用的练习。"
  },
  {
    "word": "require",
    "phonetic": "/rɪˈkwaɪər/",
    "meaning": "需要；要求",
    "collocation": "require attention",
    "example": "The problem requires careful attention.",
    "note": "require 后可接名词或动名词。",
    "translation": "这个问题需要认真关注。"
  },
  {
    "word": "resource",
    "phonetic": "/ˈriːsɔːrs/",
    "meaning": "资源；资料",
    "collocation": "learning resources",
    "example": "The library offers free learning resources.",
    "note": "可数名词，常见复数 resources。",
    "translation": "图书馆提供免费的学习资源。"
  },
  {
    "word": "respond",
    "phonetic": "/rɪˈspɑːnd/",
    "meaning": "回应；作出反应",
    "collocation": "respond to",
    "example": "The company responded to the request quickly.",
    "note": "respond 后常接 to，不直接接宾语。",
    "translation": "公司迅速回应了这一请求。"
  },
  {
    "word": "similar",
    "phonetic": "/ˈsɪmələr/",
    "meaning": "相似的",
    "collocation": "be similar to",
    "example": "The two methods are similar in several ways.",
    "note": "注意固定搭配 similar to。",
    "translation": "这两种方法在几个方面很相似。"
  },
  {
    "word": "source",
    "phonetic": "/sɔːrs/",
    "meaning": "来源；出处",
    "collocation": "a reliable source",
    "example": "Always check whether a source is reliable.",
    "note": "阅读中注意识别信息来源和证据出处。",
    "translation": "要始终核查信息来源是否可靠。"
  },
  {
    "word": "various",
    "phonetic": "/ˈveriəs/",
    "meaning": "各种各样的",
    "collocation": "for various reasons",
    "example": "People choose this method for various reasons.",
    "note": "后接可数名词复数。",
    "translation": "人们出于各种原因选择这种方法。"
  },
  {
    "word": "affect",
    "phonetic": "/əˈfekt/",
    "meaning": "影响",
    "collocation": "affect the result",
    "example": "Lack of sleep can affect your memory.",
    "note": "动词；名词“影响”常用 effect。",
    "translation": "睡眠不足会影响你的记忆力。"
  },
  {
    "word": "achieve",
    "meaning": "实现；取得",
    "collocation": "achieve a goal",
    "example": "Practice helps us achieve our goals.",
    "translation": "练习有助于我们实现目标。",
    "note": "achieve 常与 goal、success 连用。",
    "phonetic": ""
  },
  {
    "word": "improve",
    "meaning": "改善；提高",
    "collocation": "improve reading skills",
    "example": "Reading daily can improve your vocabulary.",
    "translation": "每天阅读可以提高你的词汇量。",
    "note": "既可表示主动改善，也可表示自身变好。",
    "phonetic": ""
  },
  {
    "word": "reduce",
    "meaning": "减少；降低",
    "collocation": "reduce waste",
    "example": "We can reduce waste by reusing bags.",
    "translation": "重复使用袋子可以减少浪费。",
    "note": "reduce by 表示减少了多少，reduce to 表示减少到多少。",
    "phonetic": ""
  },
  {
    "word": "increase",
    "meaning": "增加；增长",
    "collocation": "an increase in",
    "example": "The number of students has increased.",
    "translation": "学生人数增加了。",
    "note": "可作动词或名词；名词常接 in。",
    "phonetic": ""
  },
  {
    "word": "develop",
    "meaning": "发展；培养",
    "collocation": "develop a habit",
    "example": "It takes time to develop a new habit.",
    "translation": "培养新习惯需要时间。",
    "note": "可用于技能、习惯，也可指开发产品。",
    "phonetic": ""
  },
  {
    "word": "effective",
    "meaning": "有效的",
    "collocation": "an effective method",
    "example": "This is an effective way to review words.",
    "translation": "这是一种有效的单词复习方法。",
    "note": "effective 强调有效果；efficient 强调效率高。",
    "phonetic": ""
  },
  {
    "word": "efficient",
    "meaning": "效率高的",
    "collocation": "an efficient system",
    "example": "The new system is more efficient.",
    "translation": "新系统效率更高。",
    "note": "留意与 effective 的区别。",
    "phonetic": ""
  },
  {
    "word": "significant",
    "meaning": "显著的；重要的",
    "collocation": "a significant difference",
    "example": "There is a significant difference between the results.",
    "translation": "这些结果之间有显著差异。",
    "note": "阅读中常用来强调变化或差异。",
    "phonetic": ""
  },
  {
    "word": "individual",
    "meaning": "个人；个别的",
    "collocation": "individual needs",
    "example": "The course considers individual needs.",
    "translation": "这门课程考虑个人需求。",
    "note": "可作名词，也可作形容词修饰 needs。",
    "phonetic": ""
  },
  {
    "word": "opportunity",
    "meaning": "机会",
    "collocation": "an opportunity to do",
    "example": "The project offers an opportunity to learn.",
    "translation": "这个项目提供了学习的机会。",
    "note": "注意 an opportunity to do something。",
    "phonetic": ""
  },
  {
    "word": "challenge",
    "meaning": "挑战；质疑",
    "collocation": "face a challenge",
    "example": "Learning a language is a challenge.",
    "translation": "学习一门语言是一项挑战。",
    "note": "作动词时也可表示质疑某个观点。",
    "phonetic": ""
  },
  {
    "word": "demand",
    "meaning": "需求；要求",
    "collocation": "demand for",
    "example": "Demand for clean energy is growing.",
    "translation": "对清洁能源的需求正在增长。",
    "note": "名词 demand 常接 for。",
    "phonetic": ""
  },
  {
    "word": "supply",
    "meaning": "供应；供应量",
    "collocation": "supply and demand",
    "example": "The storm affected the water supply.",
    "translation": "暴风雨影响了供水。",
    "note": "与 demand 对照理解供需关系。",
    "phonetic": ""
  },
  {
    "word": "consume",
    "meaning": "消耗；消费",
    "collocation": "consume energy",
    "example": "Old machines consume more energy.",
    "translation": "旧机器消耗更多能源。",
    "note": "consumer 是消费者；consumption 是消费或消耗。",
    "phonetic": ""
  },
  {
    "word": "income",
    "meaning": "收入",
    "collocation": "a low income",
    "example": "Some families live on a low income.",
    "translation": "有些家庭靠低收入维持生活。",
    "note": "income 通常用作不可数名词。",
    "phonetic": ""
  },
  {
    "word": "expense",
    "meaning": "费用；开支",
    "collocation": "living expenses",
    "example": "Living expenses have increased.",
    "translation": "生活开支增加了。",
    "note": "常用复数 expenses 表示各项开支。",
    "phonetic": ""
  },
  {
    "word": "afford",
    "meaning": "负担得起",
    "collocation": "afford to do",
    "example": "We cannot afford to waste time.",
    "translation": "我们浪费不起时间。",
    "note": "通常与 can、could 连用。",
    "phonetic": ""
  },
  {
    "word": "consider",
    "meaning": "考虑；认为",
    "collocation": "consider doing",
    "example": "Consider taking a short break.",
    "translation": "考虑休息一小会儿。",
    "note": "表示考虑做某事时接动名词。",
    "phonetic": ""
  },
  {
    "word": "suggest",
    "meaning": "建议；暗示",
    "collocation": "suggest doing",
    "example": "She suggested reviewing the lesson.",
    "translation": "她建议复习这节课。",
    "note": "不能用 suggest someone to do 表示建议某人做。",
    "phonetic": ""
  },
  {
    "word": "recommend",
    "meaning": "推荐；建议",
    "collocation": "recommend doing",
    "example": "Teachers recommend reading every day.",
    "translation": "老师建议每天阅读。",
    "note": "recommend 后可接名词或动名词。",
    "phonetic": ""
  },
  {
    "word": "determine",
    "meaning": "确定；决定",
    "collocation": "determine the cause",
    "example": "We need to determine the cause of the problem.",
    "translation": "我们需要确定问题的原因。",
    "note": "be determined to do 表示下定决心做。",
    "phonetic": ""
  },
  {
    "word": "recognize",
    "meaning": "认出；认识到",
    "collocation": "recognize the importance of",
    "example": "People recognize the importance of sleep.",
    "translation": "人们认识到睡眠的重要性。",
    "note": "不仅表示认出人，也可表示承认或认识到。",
    "phonetic": ""
  },
  {
    "word": "identify",
    "meaning": "识别；确定",
    "collocation": "identify a problem",
    "example": "The study helped identify the problem.",
    "translation": "这项研究帮助找出了问题。",
    "note": "常用于找出原因、问题或特征。",
    "phonetic": ""
  },
  {
    "word": "compare",
    "meaning": "比较",
    "collocation": "compare A with B",
    "example": "Compare your answer with the example.",
    "translation": "把你的答案与例子比较。",
    "note": "comparison 是名词“比较”。",
    "phonetic": ""
  },
  {
    "word": "contrast",
    "meaning": "对比；差异",
    "collocation": "in contrast",
    "example": "The first task was easy. In contrast, the second was difficult.",
    "translation": "第一项任务很容易，相比之下第二项很难。",
    "note": "in contrast 提示上下文存在差异。",
    "phonetic": ""
  },
  {
    "word": "involve",
    "meaning": "涉及；包含",
    "collocation": "involve doing",
    "example": "The job involves working with children.",
    "translation": "这份工作需要与儿童一起工作。",
    "note": "involve 后接动名词。",
    "phonetic": ""
  },
  {
    "word": "participate",
    "meaning": "参与",
    "collocation": "participate in",
    "example": "All students can participate in the activity.",
    "translation": "所有学生都可以参加这项活动。",
    "note": "不直接接活动名称，通常用 participate in。",
    "phonetic": ""
  },
  {
    "word": "encourage",
    "meaning": "鼓励",
    "collocation": "encourage someone to do",
    "example": "Teachers encourage students to ask questions.",
    "translation": "老师鼓励学生提问。",
    "note": "注意 encourage someone to do 的结构。",
    "phonetic": ""
  },
  {
    "word": "support",
    "meaning": "支持；支撑",
    "collocation": "support an idea",
    "example": "The evidence supports her idea.",
    "translation": "证据支持她的观点。",
    "note": "阅读中注意 evidence 与观点之间的支持关系。",
    "phonetic": ""
  },
  {
    "word": "responsible",
    "meaning": "负责任的；负责的",
    "collocation": "be responsible for",
    "example": "She is responsible for the project.",
    "translation": "她负责这个项目。",
    "note": "责任 responsibility 为其名词形式。",
    "phonetic": ""
  },
  {
    "word": "likely",
    "meaning": "可能的",
    "collocation": "be likely to do",
    "example": "Regular readers are likely to learn more words.",
    "translation": "经常阅读的人可能学到更多单词。",
    "note": "likely 表示可能性，不表示必然。",
    "phonetic": ""
  },
  {
    "word": "despite",
    "meaning": "尽管",
    "collocation": "despite the difficulty",
    "example": "She continued despite the difficulty.",
    "translation": "尽管有困难，她仍然继续。",
    "note": "despite 后接名词或动名词，不直接接完整句子。",
    "phonetic": ""
  },
  {
    "word": "although",
    "meaning": "虽然",
    "collocation": "although + 从句",
    "example": "Although it was difficult, he finished the task.",
    "translation": "虽然很难，他还是完成了任务。",
    "note": "although 引导让步从句，一般不与 but 连用。",
    "phonetic": ""
  },
  {
    "word": "therefore",
    "meaning": "因此",
    "collocation": "therefore",
    "example": "The road was closed; therefore, we took another route.",
    "translation": "道路封闭了，因此我们走了另一条路线。",
    "note": "表示结果，帮助识别因果关系。",
    "phonetic": ""
  },
  {
    "word": "however",
    "meaning": "然而",
    "collocation": "however",
    "example": "The plan is useful. However, it takes time.",
    "translation": "这个计划有用，然而它需要时间。",
    "note": "提示转折，阅读时留意后面的信息。",
    "phonetic": ""
  },
  {
    "word": "instead",
    "meaning": "代替；反而",
    "collocation": "instead of",
    "example": "Try walking instead of driving.",
    "translation": "试试步行而不是开车。",
    "note": "instead 可独立作副词，instead of 后需接名词或动名词。",
    "phonetic": ""
  },
  {
    "word": "consequence",
    "meaning": "结果；后果",
    "collocation": "as a consequence",
    "example": "He missed the bus. As a consequence, he was late.",
    "translation": "他错过了公交车，因此迟到了。",
    "note": "常用于表达因果关系。",
    "phonetic": ""
  },
  {
    "word": "essential",
    "meaning": "必不可少的",
    "collocation": "be essential for",
    "example": "Sleep is essential for good health.",
    "translation": "睡眠对身体健康至关重要。",
    "note": "注意 essential for / to。",
    "phonetic": ""
  },
  {
    "word": "opinion",
    "meaning": "观点；意见",
    "collocation": "in my opinion",
    "example": "In my opinion, the plan needs more work.",
    "translation": "我认为这个计划还需要完善。",
    "note": "区分事实 fact 与观点 opinion。",
    "phonetic": ""
  },
  {
    "word": "attitude",
    "meaning": "态度",
    "collocation": "attitude toward",
    "example": "Her attitude toward learning has changed.",
    "translation": "她对学习的态度改变了。",
    "note": "阅读常考作者对某事的态度。",
    "phonetic": ""
  }
];

export const wordBank = [...starterWordBank, ...supplementaryWords, ...corpusRankedWords] as Array<{
  word: string; phonetic?: string; meaning: string; collocation?: string;
  example?: string; translation?: string; note?: string; sourceRank?: number;
}>;

