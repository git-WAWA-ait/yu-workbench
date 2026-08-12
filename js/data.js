// ===== 语寓原型 · 样例数据（前端 mock，演示用）=====

// 考试成绩样例数据生成（演示用，含姓名+身份证后6位供家长/学生自助查询）
const SUBMAX = { 语文:120, 数学:120, 英语:120, 物理:100, 道法:50, 历史:50, 体育:60 };
function buildExamScores(){
  const base = [
    { name:"李梓涵", id6:"210821", s:{语文:113,数学:118,英语:116,物理:95,道法:48,历史:49,体育:60} },
    { name:"王思远", id6:"110612", s:{语文:108,数学:109,英语:110,物理:88,道法:45,历史:46,体育:58} },
    { name:"陈雨桐", id6:"111119", s:{语文:110,数学:112,英语:108,物理:92,道法:47,历史:48,体育:59} },
    { name:"赵欣怡", id6:"110928", s:{语文:105,数学:104,英语:106,物理:85,道法:44,历史:45,体育:57} },
    { name:"周子涵", id6:"120829", s:{语文:95,数学:100,英语:94,物理:80,道法:40,历史:42,体育:55} },
    { name:"钱多多", id6:"121024", s:{语文:90,数学:96,英语:88,物理:78,道法:39,历史:41,体育:53} },
    { name:"张子轩", id6:"120305", s:{语文:92,数学:98,英语:90,物理:75,道法:38,历史:40,体育:54} },
    { name:"刘昊然", id6:"120710", s:{语文:88,数学:85,英语:82,物理:70,道法:35,历史:37,体育:52} },
  ];
  const adj = {
    monthly:{},
    mid:{ 李梓涵:3, 王思远:5, 陈雨桐:2, 赵欣怡:4, 周子涵:1, 钱多多:6, 张子轩:8, 刘昊然:10 },
    final:{ 李梓涵:5, 王思远:9, 陈雨桐:4, 赵欣怡:7, 周子涵:3, 钱多多:9, 张子轩:12, 刘昊然:14 },
  };
  const mk = (name,date,delta)=>({ name, date, rows: base.map(st=>{
    const d = delta[st.name]||0;
    const s = {}; for(const k in st.s) s[k] = Math.min(SUBMAX[k], st.s[k]+d);
    return { name:st.name, id6:st.id6, s };
  }) });
  return {
    monthly: mk("第一次月考","2026-03-15", adj.monthly),
    mid:     mk("期中考试","2026-04-28", adj.mid),
    final:   mk("期末考试","2026-06-30", adj.final),
  };
}

window.DB = {
  user: { name: "思思老师", role: "初三语文 · 班主任", school: "明德中学", avatar: "" },

  // 节次时间表（周一~周五，演示用）
  periodTimes: [
    { p:1, t:"08:00" }, { p:2, t:"08:50" }, { p:3, t:"09:40" }, { p:4, t:"10:40" },
    { p:5, t:"11:30" }, { p:6, t:"14:00" }, { p:7, t:"14:50" }, { p:8, t:"15:40" },
  ],

  // 教师课表（day: 1=周一 … 5=周五；period 对应 periodTimes；演示用）
  classSchedule: [
    { day:1, period:1, subject:"语文",     className:"初三(3)班", room:"301" },
    { day:1, period:3, subject:"语文",     className:"初二(1)班", room:"208" },
    { day:1, period:6, subject:"作文指导", className:"初三(3)班", room:"301" },
    { day:2, period:2, subject:"语文",     className:"初三(3)班", room:"301" },
    { day:2, period:5, subject:"名著阅读", className:"初二(1)班", room:"208" },
    { day:3, period:1, subject:"语文",     className:"初二(1)班", room:"208" },
    { day:3, period:4, subject:"语文",     className:"初三(3)班", room:"301" },
    { day:3, period:7, subject:"答疑辅导", className:"初三(3)班", room:"301" },
    { day:4, period:3, subject:"语文",     className:"初三(3)班", room:"301" },
    { day:4, period:6, subject:"作文指导", className:"初二(1)班", room:"208" },
    { day:5, period:2, subject:"语文",     className:"初二(1)班", room:"208" },
    { day:5, period:5, subject:"语文",     className:"初三(3)班", room:"301" },
    { day:5, period:8, subject:"班会/总结", className:"初三(3)班", room:"301" },
  ],

  todos: [
    { id:"td1", t: "初三(3)班 第3单元作文待批改", n: 12, tag: "red",    deadline:"2026-08-12", prio:1 },
    { id:"td2", t: "初二(1)班 单元测试成绩待分析", n: 1,  tag: "amber",  deadline:"2026-08-13", prio:1 },
    { id:"td3", t: "教研组：共享《岳阳楼记》课件评审", n: 1, tag: "blue",  deadline:"2026-08-15", prio:2 },
    { id:"td4", t: "家长通知：周末安全提醒 待发布", n: 1, tag: "green",  deadline:"2026-08-10", prio:2 },
    { id:"td5", t: "初三(3)班 值日表 待更新", n: 1,     tag: "purple", deadline:"2026-08-11", prio:3 },
  ],
  // 学校通知样例（工作台·今日待办「拆解通知」演示用；可粘贴真实通知文本）
  noticeSamples: [
    "【教务处通知】请各班于8月12日前完成暑假作业检查并上报未交名单；8月15日中午前提交本学期教研计划；务必重视防溺水安全教育，本周五前发放告家长书并回收回执。",
    "【德育处】下周一（8月18日）前各班更新班级值日表与班委分工；本月底前完成困难学生家访台账；期中家长会方案请于9月1日前报备。",
  ],

  // 常用备课网址（按板块聚合；首次加载使用示例数据，用户增删后存本机）
  sites: [
    { name:'国家中小学智慧教育平台', url:'https://basic.smartedu.cn/',
      desc:'教育部官方免费资源：课程、电子教材、名师优课，对标新课标。', tag:'官方资源', ico:'🏫', group:'官方平台', rc:'rc6' },
    { name:'国家教育资源公共服务平台', url:'https://www.eduyun.cn/',
      desc:'一师一优课、名师工作室，跨区域优质课例共享。', tag:'优课共享', ico:'🌐', group:'官方平台', rc:'rc4' },
    { name:'学科网', url:'https://www.zxxk.com/',
      desc:'K12 资源量最大之一，课件/教案/试卷可按知识点智能组卷。', tag:'题库组卷', ico:'📚', group:'题库组卷', rc:'rc3' },
    { name:'智学网', url:'https://www.zhixue.com/',
      desc:'考试数据分析与智能组卷，适合阶段测试与质量分析。', tag:'考试数据', ico:'🧠', group:'题库组卷', rc:'rc1' },
    { name:'希沃白板', url:'https://www.seewo.com/',
      desc:'互动课件、课堂游戏、班级优化大师，海量学科模板一键套用。', tag:'互动课件', ico:'📺', group:'互动课件', rc:'rc2' },
    { name:'教研网', url:'http://www.jiaoyanw.com/',
      desc:'教师备课社区与素材集市，涵盖课件、学案与微课。', tag:'备课社区', ico:'💡', group:'备课社区', rc:'rc5' },
    { name:'整本阅读资源库', url:'http://www.zhengbenyuedu.com/',
      desc:'整本书阅读教学设计、导读课件与读后写作参考。', tag:'整本阅读', ico:'📖', group:'备课社区', rc:'rc4' },
    { name:'中国国家图书馆', url:'http://www.nlc.cn/',
      desc:'古籍电子版、方志、年鉴与数字阅读资源，免费检索。', tag:'数字阅读', ico:'📜', group:'数字阅读', rc:'rc6' },
  ],

  // 一课一标·新课标对应（按学段聚合课文；初版用现有 units 演绎，之后可按 DB.units 自动聚合）
  csByStage: {
    s1: ['1~2 年级 · 识字与阅读启蒙','结合生活情境识字；阅读浅近童话/儿歌，体会阅读乐趣。'],
    s2: ['3~4 年级 · 阅读与习作起步','阅读叙事/说明性文章，提取关键信息；学习清楚有条理地表达。'],
    s3: ['5~6 年级 · 综合性阅读与表达','阅读高阶叙事/议论/文学性文本，体会思想情感；学习围绕中心表达。'],
    s4: ['7~9 年级 · 思辨与文学鉴赏','阅读议论/文学/文言经典，把握观点与情感；运用多种表达方式有理有据地表达。'],
  },
  // 板块（学段）→ 典型学习任务群 + 教学建议
  stageTask: {
    s1: { tasks:['语言文字积累与梳理','实用性阅读与交流'], tips:['在情境中识字、积累语言经验','注重朗读与口语表达启蒙'] },
    s2: { tasks:['语言文字积累与梳理','实用性阅读与交流','文学阅读与创意表达'], tips:['把握关键信息与文章脉络','鼓励仿写片段、积累语言'] },
    s3: { tasks:['实用性阅读与交流','文学阅读与创意表达','思辨性阅读与表达'], tips:['注重文体特点与作者观点','学习用多种方式有理有据地表达'] },
    s4: { tasks:['文学阅读与创意表达','思辨性阅读与表达','整本书阅读','跨学科学习'], tips:['思辨性阅读与文学鉴赏并重','跨学科整合，写有立意的文章'] },
  },
  // 统编教材单元（双线组元：人文主题 + 语文要素 + 对应学段 stage）
  units: [
    { grade: "九年级下", unit: "第三单元", human: "家国之思 · 古文经典", skill: "诵读·积累·文言实词", stage: "s4",
      taskGroup: "语言文字积累与梳理", lessons: ["《鱼我所欲也》","《唐雎不辱使命》","《送东阳马生序》","《词四首》"] },
    { grade: "九年级下", unit: "第二单元", human: "世态人情 · 小说阅读", skill: "梳理情节·分析人物",
      taskGroup: "文学阅读与创意表达", lessons: ["《孔乙己》","《变色龙》","《溜索》","《蒲柳人家》"] },
    { grade: "八年级下", unit: "第一单元", stage: "s3", human: "民俗文化", skill: "体会民俗·品味语言",
      taskGroup: "实用性阅读与交流", lessons: ["《社戏》","《回延安》","《安塞腰鼓》","《灯笼》"] },
    { grade: "七年级下", unit: "第五单元", stage: "s2", human: "哲理之思 · 托物言志", skill: "托物言志·比较阅读",
      taskGroup: "文学阅读与创意表达", lessons: ["《紫藤萝瀑布》","《一棵小桃树》","《外国诗二首》","《古代诗歌五首》"] },
  ],

  lessonPlans: [
    { title: "《孔乙己》公开课教案", unit: "九下·第二单元", type: "公开课",
      obj: "语言运用/思维能力/审美创造", status: "已定稿", updated: "2026-08-05" },
    { title: "《送东阳马生序》常态课", unit: "九下·第三单元", type: "常态课",
      obj: "语言运用/文化自信", status: "草稿", updated: "2026-08-08" },
    { title: "单元整体教学设计：家国之思", unit: "九下·第三单元", type: "单元教案",
      obj: "四维核心素养", status: "评审中", updated: "2026-08-07" },
  ],

  // 作业（分层 + 作文量规）
  assignments: [
    { title: "第三单元 文言文分层作业", class: "初三(3)班", layer: "基础/提升/拓展", type: "书面+实践",
      due: "2026-08-12", submitted: 38, total: 45 },
    { title: "第3单元作文《把心安放》", class: "初三(3)班", layer: "统一", type: "作文",
      due: "2026-08-10", submitted: 33, total: 45 },
    { title: "《孔乙己》人物分析", type: "书面", class: "初二(1)班", layer: "提升",
      due: "2026-08-11", submitted: 40, total: 42 },
  ],

  // 班级错题与薄弱归因（作文批改页展示）
  errorStats: [
    { type: "错别字", count: 26 }, { type: "病句", count: 18 },
    { type: "论证逻辑", count: 14 }, { type: "卷面", count: 9 },
  ],

  // 作业批改 · 二级任务数据
  // 字词识记：教师上传的字词清单
  wordLists: [
    { id: "w1", title: "九年级上册·重点字词（第一单元）", grade: "九年级", words: [
      { w: "娉婷", py: "pīng tíng", mean: "形容女子姿态优美" },
      { w: "鲜妍", py: "xiān yán", mean: "鲜艳美丽" },
      { w: "忧戚", py: "yōu qī", mean: "忧伤烦恼" },
      { w: "飘逸", py: "piāo yì", mean: "洒脱自然，与众不同" },
      { w: "旁骛", py: "páng wù", mean: "在正业以外有所追求（易错：骛）" },
    ]},
    { id: "w2", title: "中考高频易错成语", grade: "中考", words: [
      { w: "不耻下问", py: "bù chǐ xià wèn", mean: "不以向地位低的人请教为耻" },
      { w: "莘莘学子", py: "shēn shēn xué zǐ", mean: "众多的学生（不读 xīn）" },
      { w: "趋之若鹜", py: "qū zhī ruò wù", mean: "像鸭子成群跑过去，多含贬义" },
    ]},
  ],
  // 诗文默写：教材必背篇目
  poems: [
    { id: "p1", title: "《沁园春·雪》", author: "毛泽东", dynasty: "现代",
      text: "北国风光，千里冰封，万里雪飘。望长城内外，惟余莽莽；大河上下，顿失滔滔。" },
    { id: "p2", title: "《岳阳楼记》", author: "范仲淹", dynasty: "宋",
      text: "先天下之忧而忧，后天下之乐而乐。衔远山，吞长江，浩浩汤汤，横无际涯。" },
    { id: "p3", title: "《行路难》", author: "李白", dynasty: "唐",
      text: "长风破浪会有时，直挂云帆济沧海。欲渡黄河冰塞川，将登太行雪满山。" },
  ],
  // 阅读训练：篇目 + 训练题
  readingExs: [
    { id: "r1", title: "记叙文《一盏灯》", grade: "九年级",
      passage: "老巷深处有盏灯，亮了三十年。灯下的人换了又换，光却一直暖着归家的人。",
      questions: [
        { q: "概括文章主旨。", a: "通过老巷一盏灯三十年不灭，赞美坚守与温情，表达对平凡善意的礼赞。" },
        { q: "赏析“亮了三十年”的表达效果。", a: "以时间之长突出坚守之可贵，看似平淡却极具张力。" },
      ]},
    { id: "r2", title: "说明文《指纹的秘密》", grade: "八年级",
      passage: "指纹由遗传与胚胎环境共同决定，终身不变，因此具有唯一性与稳定性。",
      questions: [
        { q: "指纹的特点是什么？", a: "唯一性、稳定性（终身不变）。" },
      ]},
  ],
  // 作文批改 · 教师上传的“评价标准”
  essayCriteria: [
    { id: "c1", title: "中考记叙文评分标准（学校通用）",
      content: "一类文(45-50)：立意深刻，结构严谨，描写生动，语言流畅；\n二类文(38-44)：中心明确，内容充实，语句通顺；\n三类文(30-37)：基本切题，有少量语病；\n四类文(0-29)：偏离题意，语病较多。\n卷面整洁、书写工整酌情加 1-3 分。" },
  ],
  // 作文批改记录（演示）
  essayGrades: [],

  // 素材资源库
  resources: [
    { title: "《岳阳楼记》文言实词卡", grade: "九年级", theme: "中华优秀传统文化", group: "语言文字积累与梳理",
      type: "古诗文", fav: true },
    { title: "《红星照耀中国》名著导读", grade: "八年级", theme: "革命文化", group: "整本书阅读",
      type: "名著导读", fav: true },
    { title: "群文阅读：家国情怀三篇", grade: "九年级", theme: "中华优秀传统文化", group: "文学阅读与创意表达",
      type: "群文阅读", fav: false },
    { title: "中考微写作范例12则", grade: "九年级", theme: "社会主义先进文化", group: "实用性阅读与交流",
      type: "写作范例", fav: false },
    { title: "《骆驼祥子》人物思辨单", grade: "七年级", theme: "社会主义先进文化", group: "整本书阅读",
      type: "名著导读", fav: false },
    { title: "跨学科：古诗中的物候", grade: "八年级", theme: "中华优秀传统文化", group: "跨学科学习",
      type: "群文阅读", fav: true },
  ],

  // 班级学情
  classScores: {
    name: "初三(3)班",
    distribution: [ { r: "≥108", c: 6 }, { r: "96-107", c: 14 }, { r: "84-95", c: 15 },
                    { r: "72-83", c: 7 }, { r: "<72", c: 3 } ],
    avg: 92.4, pass: 100, excellent: 44,
    radar: [ { d: "语言运用", v: 86 }, { d: "思维能力", v: 72 }, { d: "审美创造", v: 80 },
             { d: "文化自信", v: 88 } ],
    weak: [ { k: "论证逻辑", v: 38 }, { k: "文言实词", v: 52 }, { k: "修辞手法", v: 61 },
            { k: "信息提取", v: 70 }, { k: "书写规范", v: 78 } ],
  },
  students: [
    { name: "王思远", lang: 90, think: 68, aesthetic: 82, culture: 91, trend: "up",   conduct: 94, hl: "语文课代表，作文思辨见长，主动带动晨读氛围" },
    { name: "李梓涵", lang: 95, think: 88, aesthetic: 90, culture: 93, trend: "up",   conduct: 97, hl: "班长，综合领先且乐于帮扶同学，书法社团骨干" },
    { name: "张子轩", lang: 72, think: 55, aesthetic: 60, culture: 70, trend: "down", conduct: 78, hl: "劳动委员，值日认真负责，文言文基础待帮扶" },
    { name: "陈雨桐", lang: 88, think: 79, aesthetic: 85, culture: 90, trend: "up",   conduct: 92, hl: "学习委员，收发作业细致，校运会积极参与" },
    { name: "刘昊然", lang: 65, think: 48, aesthetic: 58, culture: 66, trend: "down", conduct: 70, hl: "曾出现考试焦虑，经疏导后情绪趋稳，需持续关注" },
  ],

  // 学生谈心谈话记录（班级学情 · 二级目录）
  talkRecords: [
    { date:"2026-08-05", target:"张子轩", type:"学习提升", method:"面对面",
      content:"文言文基础薄弱，约定每周三次错题库打卡，重点突破实词。",
      effect:"两周后测验实词正确率提升，学习主动性增强" },
    { date:"2026-08-03", target:"刘昊然家长", type:"家校沟通", method:"电话",
      content:"反馈近期课堂专注度下降，建议家庭端共同制定作息表。",
      effect:"家长配合调整，迟到与走神明显减少" },
    { date:"2026-07-28", target:"陈雨桐", type:"素养品行", method:"微信",
      content:"肯定其书法社团贡献，鼓励带动同学参与班级文化建设。",
      effect:"主动承担板报策划，班级归属感提升" },
    { date:"2026-07-22", target:"刘昊然", type:"心理健康", method:"面对面",
      content:"考试焦虑明显，进行情绪疏导与放松训练，约定后续跟踪。",
      effect:"情绪趋于平稳，主动表达困扰的意愿增强" },
    { date:"2026-07-18", target:"王思远", type:"学习提升", method:"微信",
      content:"针对作文立意浅的问题，推荐思辨阅读书单并定期交流。",
      effect:"作文思辨维度评分上升，阅读习惯初步养成" },
  ],

  // 班主任
  quant: [
    { name: "初三(3)班", attend: 44, homework: 41, discipline: 43, duty: 42, total: 170 },
    { name: "初二(1)班", attend: 41, homework: 38, discipline: 40, duty: 39, total: 158 },
  ],
  notices: [
    { t: "周末安全提醒", to: "初三(3)班全体家长", status: "已发布", signed: 38, total: 45 },
    { t: "期中家长会通知", to: "初二(1)班全体家长", status: "草稿", signed: 0, total: 42 },
  ],
  archive: [
    { name: "张子轩",品德:"主动分担班级事务",学业:"文言文薄弱，已建错题本",体美劳:"校运会800米第三" },
    { name: "李梓涵",品德:"值日认真负责",学业:"综合领先，担任小导师",体美劳:"书法社团成员" },
  ],

  // 学生信息（班主任页 · 二级目录；演示数据已脱敏，实际须加密存储）
  studentInfo: [
    { name:"王思远", gender:"男", idNo:"3301022011****0612", nation:"汉", stuNo:"G330102201106120612",
      address:"明德街道文澜路12号", ssCard:"A3301****0012", parents:"王建国 / 李芳", phone:"138****0612",
      parentId:"3301021985****1530", status:"在读" },
    { name:"李梓涵", gender:"女", idNo:"3301022011****0821", nation:"汉", stuNo:"G330102201108210821",
      address:"明德街道书香苑3幢", ssCard:"A3301****0088", parents:"李伟 / 张敏", phone:"139****0821",
      parentId:"3301021983****2046", status:"在读" },
    { name:"张子轩", gender:"男", idNo:"3301022012****0305", nation:"回", stuNo:"G330102201203050305",
      address:"和平街道和平里5号", ssCard:"A3301****0211", parents:"张磊 / 王丽", phone:"137****0305",
      parentId:"3301021986****3318", status:"休学" },
    { name:"陈雨桐", gender:"女", idNo:"3301022011****1119", nation:"汉", stuNo:"G330102201111191119",
      address:"江滨街道滨江苑8幢", ssCard:"A3301****0456", parents:"陈强 / 刘静", phone:"135****1119",
      parentId:"3301021984****7722", status:"在读" },
    { name:"刘昊然", gender:"男", idNo:"3301022012****0710", nation:"满", stuNo:"G330102201207100710",
      address:"城西街道西园路21号", ssCard:"A3301****0678", parents:"刘洋 / 赵婷", phone:"136****0710",
      parentId:"3301021982****9043", status:"转学" },
    { name:"赵欣怡", gender:"女", idNo:"3301022011****0928", nation:"汉", stuNo:"G330102201109280928",
      address:"湖滨街道湖光里16号", ssCard:"A3301****0901", parents:"赵刚 / 孙燕", phone:"133****0928",
      parentId:"3301021987****1255", status:"在读" },
  ],

  // 学生资助（班主任页 · 二级目录；演示数据已脱敏）
  studentAid: [
    { name:"张子轩", family:"父亲张磊（务工）/ 母亲王丽（务农）", idNo:"3301022012****0305", phone:"137****0305", status:"已认定" },
    { name:"刘昊然", family:"父亲刘洋（待业）/ 母亲赵婷（保洁）", idNo:"3301022012****0710", phone:"136****0710", status:"待审核" },
    { name:"陈雨桐", family:"父亲陈强（个体）/ 母亲刘静（病休）", idNo:"3301022011****1119", phone:"135****1119", status:"已认定" },
    { name:"赵欣怡", family:"父亲赵刚（退休）/ 母亲孙燕（务工）", idNo:"3301022011****0928", phone:"133****0928", status:"待审核" },
  ],

  // 班委设置（班主任页 · 二级目录；演示数据）
  classCommittee: {
    // 六大委员
    leaders: [
      { role:"班长", holder:"李梓涵", note:"统筹班级事务，对接班主任与各委员" },
      { role:"副班长", holder:"王思远", note:"协助班长，分管纪律、考勤与临时事务" },
      { role:"学习委员", holder:"陈雨桐", note:"组织晨读、收发作业、汇总学情反馈" },
      { role:"纪律委员", holder:"赵欣怡", note:"课堂与自习纪律记录、及时提醒" },
      { role:"劳动委员", holder:"张子轩", note:"值日排表、卫生区检查与评比" },
      { role:"心理健康委员", holder:"孙悦", note:"观察同学情绪，转介需关注的同学并保密" },
    ],
    // 各科课代表
    subjectReps: [
      { subject:"语文", holder:"陈雨桐" },
      { subject:"数学", holder:"王思远" },
      { subject:"英语", holder:"李梓涵" },
      { subject:"物理", holder:"刘昊然" },
      { subject:"化学", holder:"周子涵" },
      { subject:"历史", holder:"赵欣怡" },
      { subject:"道法", holder:"张子轩" },
      { subject:"生物", holder:"孙悦" },
    ],
  },

  // 1530 安全教育（工作台 · 二级目录；演示数据）
  // 1530 模式：每日放学前 1 分钟 / 每周五放学前 5 分钟 / 节假日前 30 分钟
  safety1530: [
    { type:"节假日30分钟", date:"2026-08-05", theme:"暑期安全总教育",
      content:"防溺水、交通、消防、网络、食品、防拐综合宣讲；发放《暑期安全告家长书》并回收回执。", teacher:"林老师" },
    { type:"每日1分钟", date:"2026-08-09", theme:"防溺水",
      content:"不私自下水游泳、不盲目施救，同伴落水立即呼救并拨打 110/120。", teacher:"林老师" },
    { type:"每日1分钟", date:"2026-08-08", theme:"交通安全",
      content:"过马路走斑马线、不闯红灯；乘车系好安全带、不将头手伸出窗外。", teacher:"林老师" },
    { type:"每周5分钟", date:"2026-08-07", theme:"防电信网络诈骗",
      content:"不轻信陌生来电与中奖信息；游戏充值须家长同意；不泄露家长支付密码与验证码。", teacher:"林老师" },
    { type:"每日1分钟", date:"2026-08-06", theme:"防校园欺凌",
      content:"不嘲笑、不孤立同学；遭遇或目睹欺凌及时向老师、家长报告，守护彼此安全。", teacher:"林老师" },
    { type:"每日1分钟", date:"2026-08-04", theme:"消防安全",
      content:"不玩火、不带火种进校园；熟悉逃生通道，牢记火警电话 119。", teacher:"林老师" },
  ],

  // 主题班会记录（班主任工作 · 二级目录；演示数据，字段与后端 class_meetings 对齐）
  meetings: [
    { id:"m1", theme:"暑期安全教育", date:"2026-08-05", host:"林老师",
      content:"围绕防溺水、交通、消防、防诈、防拐展开，学生签安全承诺书。", summary:"全员知晓暑期安全红线，家长回执回收率100%。" },
    { id:"m2", theme:"新学期·好习惯养成", date:"2026-09-01", host:"林老师",
      content:"明确班规、作息与读书计划，重温课堂礼仪。", summary:"班级秩序明显提升，晨读参与度提高。" },
    { id:"m3", theme:"爱国主义教育", date:"2026-10-09", host:"林老师",
      content:"结合国庆，讲好家国故事，布置红色阅读任务。", summary:"学生家国情怀增强，读后感质量提升。" },
  ],

  // 校园工作日历（工作台 · 工作日历；可上传覆盖）与校历假期（续命进度条倒计时用）
  termStart: "2026-08-01", // 当前工作周期起点（用于"续命进度条"进度计算）
  schoolHolidays: [
    { name:"暑期放假", start:"2026-08-15", end:"2026-08-31" },
    { name:"中秋节",   start:"2026-09-25", end:"2026-09-27" },
    { name:"国庆节",   start:"2026-10-01", end:"2026-10-07" },
    { name:"元旦",     start:"2027-01-01", end:"2027-01-03" },
    { name:"春节",     start:"2027-01-28", end:"2027-02-10" },
    { name:"清明节",   start:"2027-04-05", end:"2027-04-07" },
    { name:"劳动节",   start:"2027-05-01", end:"2027-05-05" },
    { name:"端午节",   start:"2027-06-19", end:"2027-06-21" },
  ],
  calendarEvents: [
    { date:"2026-08-10", title:"教研组集体备课", type:"教研" },
    { date:"2026-08-12", title:"暑期安全家长会", type:"班务" },
    { date:"2026-08-20", title:"新学期开学典礼", type:"校务" },
    { date:"2026-08-30", title:"班级环境布置", type:"班务" },
    { date:"2026-09-15", title:"第一次月考", type:"考试" },
    { date:"2026-10-08", title:"秋季运动会", type:"校务" },
    { date:"2026-10-20", title:"期中质量分析会", type:"教研" },
    { date:"2026-11-12", title:"家长开放日", type:"班务" },
    { date:"2026-12-20", title:"迎新文艺汇演", type:"校务" },
    { date:"2027-01-10", title:"期末复习动员", type:"考试" },
  ],

  // 考试成绩（班级学情 · 二级目录；演示数据）
  examSubjects: ["语文","数学","英语","物理","道法","历史","体育"],
  examScores: buildExamScores(),

  // 素材资源库 · 学科试卷（可上传 文档/PDF/图片；演示数据）
  papers: [
    { id:"p1", title:"2026 初三语文一模试卷", subject:"语文", grade:"九年级", fileType:"pdf", fileName:"语文一模.pdf", size:"2.4MB", date:"2026-08-01", note:"含参考答案与评分标准" },
    { id:"p2", title:"议论文写作专项训练卷", subject:"语文", grade:"九年级", fileType:"doc", fileName:"议论文训练.docx", size:"1.1MB", date:"2026-08-03", note:"8 篇范文 + 病文修改" },
    { id:"p3", title:"古诗文默写过关卷（扫描件）", subject:"语文", grade:"九年级", fileType:"image", fileName:"默写过关.jpg", size:"3.6MB", date:"2026-08-05", note:"学生手写扫描，可转 OCR" },
    { id:"p4", title:"名著阅读检测卷《水浒传》", subject:"语文(名著)", grade:"八年级", fileType:"pdf", fileName:"水浒检测.pdf", size:"1.8MB", date:"2026-07-28", note:"" },
  ],

  // 素材资源库 · 知识点讲解（视频文件 / 链接 / 抖音·小红书·哔哩哔哩·小程序视频；演示数据）
  explains: [
    { id:"e1", title:"《岳阳楼记》文言实词串讲", subject:"语文", platform:"哔哩哔哩", url:"https://b23.tv/demo", duration:"12:30", icon:"📺", note:"UP 主：语文名师，适合课前预习" },
    { id:"e2", title:"议论文论证结构动画拆解", subject:"语文", platform:"抖音", url:"https://v.douyin.com/demo", duration:"01:48", icon:"🎬", note:"短视频，课间投屏用" },
    { id:"e3", title:"名著《骆驼祥子》整本导读", subject:"语文", platform:"小红书", url:"https://xhslink.com/demo", duration:"图文", icon:"📕", note:"笔记型，配阅读计划表" },
    { id:"e4", title:"古诗词鉴赏方法 · 本地录课", subject:"语文", platform:"视频文件", url:"", fileType:"mp4", fileName:"诗词鉴赏.mp4", duration:"18:05", icon:"🎞", note:"已上传至本库" },
    { id:"e5", title:"校小程序 · 晨读跟读音频", subject:"语文", platform:"小程序视频", url:"wxapp://reading/demo", duration:"05:20", icon:"📲", note:"微信小程序内播放" },
  ],

  // 素材资源库 · 整本阅读（整本书阅读资源；演示数据）
  readings: [
    { id:"r1", title:"《水浒传》", author:"施耐庵", grade:"九年级", icon:"📗", progress:"通读完成", note:"配合检测卷使用" },
    { id:"r2", title:"《骆驼祥子》", author:"老舍", grade:"八年级", icon:"📘", note:"祥子三起三落人物梳理" },
    { id:"r3", title:"《红星照耀中国》", author:"埃德加·斯诺", grade:"八年级", icon:"📙", note:"纪实作品阅读策略" },
    { id:"r4", title:"《朝花夕拾》", author:"鲁迅", grade:"七年级", icon:"📔", note:"温馨的回忆与理性的批判" },
  ],

  // 素材资源库 · 整本阅读 · 考题训练（按书目 bookId 关联；演示数据）
  readingQuestions: [
    { id:"q1", bookId:"r1", q:"《水浒传》的作者是谁？", type:"填空", options:[], answer:"施耐庵", analysis:"元末明初小说家，中国第一部歌颂农民起义的长篇章回体小说。", difficulty:"易" },
    { id:"q2", bookId:"r1", q:"下列人物中属于『梁山一百单八将』的是？", type:"选择", options:["宋江","曹操","林冲","武松"], answer:"宋江、林冲、武松", analysis:"曹操为《三国演义》人物，不在梁山好汉之列。", difficulty:"中" },
    { id:"q3", bookId:"r1", q:"简述『鲁智深拳打镇关西』所体现的侠义精神。", type:"简答", options:[], answer:"路见不平、除暴安良，三拳打死欺压金氏父女的郑屠，体现嫉恶如仇、粗中有细。", analysis:"结合情节分析人物性格与小说主题。", difficulty:"难" },
    { id:"q4", bookId:"r2", q:"祥子最大的愿望是什么？", type:"填空", options:[], answer:"拥有一辆属于自己的洋车", analysis:"三起三落围绕这一目标展开。", difficulty:"易" },
    { id:"q5", bookId:"r2", q:"导致祥子最终堕落的主要社会原因有哪些？", type:"简答", options:[], answer:"军阀混战、特务敲诈、车厂主剥削，以及虎妞之死、小福子自杀等接连打击。", analysis:"从个人悲剧上升到时代悲剧的分析。", difficulty:"难" },
    { id:"q6", bookId:"r3", q:"《红星照耀中国》的作者埃德加·斯诺是哪国人？", type:"选择", options:["美国","英国","法国","苏联"], answer:"美国", analysis:"纪实文学作品，作者为美国记者。", difficulty:"易" },
    { id:"q7", bookId:"r4", q:"《朝花夕拾》是一部什么类型的作品？", type:"选择", options:["小说","散文集","诗歌","戏剧"], answer:"散文集", analysis:"鲁迅回忆性散文集，原名《旧事重提》。", difficulty:"易" },
  ],

  // 荣誉扫描册（扫描/归档奖状的数字化相册）
  honors: [
    { title: "第20届『叶圣陶杯』全国中学生新作文大赛", award: "全国一等奖", awardee: "李梓涵", level: "国家级", cat: "学生荣誉", type: "竞赛获奖", date: "2026-05-18" },
    { title: "市中小学生经典诵读大赛", award: "一等奖", awardee: "初三(3)班代表队", level: "市级", cat: "班级荣誉", type: "诵读展演", date: "2026-04-22" },
    { title: "校『书香班级』评比", award: "十佳书香班级", awardee: "初三(3)班", level: "校级", cat: "班级荣誉", type: "班级建设", date: "2026-03-30" },
    { title: "区初中语文青年教师优质课", award: "二等奖", awardee: "林老师", level: "区级", cat: "教师荣誉", type: "教学竞赛", date: "2026-06-10" },
    { title: "『语文报杯』主题征文", award: "特等奖", awardee: "王思远", level: "国家级", cat: "学生荣誉", type: "竞赛获奖", date: "2026-05-06" },
    { title: "校青年教师教学能手", award: "教学能手", awardee: "林老师", level: "校级", cat: "教师荣誉", type: "教学竞赛", date: "2026-02-15" },
    { title: "市汉字听写大会", award: "二等奖", awardee: "陈雨桐", level: "市级", cat: "学生荣誉", type: "竞赛获奖", date: "2026-04-01" },
    { title: "校运动会精神文明班级", award: "精神文明奖", awardee: "初三(3)班", level: "校级", cat: "班级荣誉", type: "班级建设", date: "2026-05-20" },
  ],
};
