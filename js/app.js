// ===== 语寓原型 · 应用逻辑 =====
const DB = window.DB;
const $ = (s, r=document) => r.querySelector(s);
const el = (html) => { const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; };
const content = $('#content');
let homeTab = 'overview'; // 班主任工作 · 二级目录当前页
let analyticsTab = 'overview'; // 班级学情 · 二级目录当前页
let dashTab = 'overview'; // 工作台 · 二级目录当前页
let resourceTab = 'material'; // 素材资源库 · 二级目录当前页
let currentView = 'dashboard'; // 当前一级页面（用于头像保存后刷新预览）
let readingTrainId = null;    // 整本阅读 · 当前打开考题训练的书目 id
let hwTab = 'word';            // 作业批改 · 二级任务当前页（字词识记/诗文默写/阅读训练/作文批改）
let lessonTab = 'plan';        // 备课中心 · 二级任务当前页（单元备课/常用备课网址/课标/教材）
let calMonth = null;       // 工作日历当前查看的月份 YYYY-MM
let classRemindTimer = null; // 上课提醒 · 概览页 30 秒刷新计时器

// 真实后端对接的数据源（默认用 mock，联网后由 API 覆盖）
let safetyData = (DB.safety1530 || []).slice();
let meetingData = (DB.meetings || []).slice();

// 今日待办完成状态：按日期记录 { 'YYYY-MM-DD': ['td1','td2',...] }
let todoDoneMap = {};
function loadTodoDone(){
  try{ const s = localStorage.getItem('yu_todo_done'); if(s) todoDoneMap = JSON.parse(s)||{}; }catch(e){ todoDoneMap = {}; }
}
function saveTodoDone(){ try{ localStorage.setItem('yu_todo_done', JSON.stringify(todoDoneMap)); }catch(e){} }
function todayDoneIds(){ return todoDoneMap[todayStr()] || []; }

function todayStr(){
  const d=new Date(), p=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
}
function parseD(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y, m-1, d); }

const titles = { dashboard:"工作台", lesson:"备课中心", homework:"作业批改",
  resource:"素材资源库", analytics:"班级学情", homeroom:"班主任工作", honor:"荣誉登记册", settings:"个人与设置" };

const views = {
  // ---------- 工作台 ----------
  dashboard(){
    const subs=[['overview','工作进度','📊'],['safety','1530安全教育','🛡'],['calendar','工作日历','📅']];
    return `
    ${surviveBar()}
    <div class="subnav hsub mb12" id="dashSubNav">
      ${subs.map(([v,t,ic])=>`<button class="sub-tab hitem ${dashTab===v?'active':''}" data-sub="${v}"><span class="hico">${ic}</span><span class="hlab">${t}</span></button>`).join('')}
    </div>
    <div id="dashSub">${dashboardSub()}</div>`;
  },

  // ---------- 备课中心（二级任务：教案 / 常用备课网址 / 课标 / 教材）----------
  lesson(){
    const subs=[['plan','教案','📘'],['sites','常用备课网址','🌐'],['standard','课标','📜'],['textbook','教材','📖']];
    return `
    <div class="subnav hsub mb12" id="lessonSubNav">
      ${subs.map(([v,t,ic])=>`<button class="sub-tab hitem ${lessonTab===v?'active':''}" data-sub="${v}"><span class="hico">${ic}</span><span class="hlab">${t}</span></button>`).join('')}
    </div>
    <div id="lessonSub">${lessonSub()}</div>`;
  },
  // 备课中心 · 二级目录分发
  lessonPlanView(){
    const icos=['📘','📗','📙','📕','📖'];
    const softs=['blue','green','amber','purple','blue'];
    const typeColor={ '已定稿':'green','评审中':'blue','草稿':'amber' };
    return `
    <div class="flex between mb12"><div class="section-title">📚 教案备课台 <span class="muted" style="font-size:12px;font-weight:400">统编教材 · 双线组元</span></div>
      <div class="flex gap8">
        <button class="btn line" data-action="uploadDraft" title="上传 Word/PDF/图片，自动识别梳理成教案">📎 上传资料梳理</button>
        <button class="btn" data-action="newPlan">＋ 新建教案</button>
      </div></div>
    <div class="section-title mb12" style="font-size:14px">备课单元</div>
    <div class="grid cols-3">
      ${DB.units.map((u,i)=>`
        <div class="card res" data-action="openUnit" data-unit="${u.grade}·${u.unit}" title="进入「${u.grade}·${u.unit}」备课台">
          <div class="flex between center"><div class="res-ico" style="background:var(--${softs[i%softs.length]}-soft)">${icos[i%icos.length]}</div>
            <span class="tag ${softs[i%softs.length]}">${u.taskGroup}</span></div>
          <h3 style="margin:12px 0 6px;font-size:15px">${u.grade} · ${u.unit}</h3>
          <div class="muted" style="font-size:13px;line-height:1.6">人文主题：${u.human}<br>语文要素：${u.skill}</div>
          <div class="chips">${u.lessons.map(l=>`<span class="tag">${l}</span>`).join('')}</div>
          <div class="res-open">进入备课台 →</div>
        </div>`).join('')}
      <div class="card res" style="border-style:dashed;align-items:center;justify-content:center;text-align:center" data-action="newPlan" title="从教材目录快速创建备课单元">
        <div class="res-ico" style="background:var(--accent-soft);color:var(--accent-strong);font-size:22px">＋</div>
        <h3 style="margin:12px 0 6px;font-size:15px">新建单元</h3>
        <div class="muted" style="font-size:13px">从教材目录快速创建备课单元</div>
        <div class="res-open">开始创建 →</div>
      </div>
    </div>
    <div class="section-title mt16 mb12" style="font-size:14px">我的教案</div>
    <div class="card"><div class="list">
      ${DB.lessonPlans.map((p,i)=>`
        <div class="row"><div class="lp-ico">${['📄','📝','🎬'][i%3]}</div><div class="main"><div class="title">${escapeHtml(p.title)}</div>
          <div class="meta">${escapeHtml(p.unit)} · 目标：${escapeHtml(p.obj)} · 更新 ${escapeHtml(p.updated)}</div></div>
          <span class="tag ${escapeAttr(typeColor[p.status]||'gray')}">${escapeHtml(p.status)}</span>
          <div style="display:flex;gap:6px">
            <button class="btn line sm" data-action="editPlan" data-id="${escapeAttr(p.id)}">编辑</button>
            <button class="btn line sm" data-action="exportPlan" data-id="${escapeAttr(p.id)}">导出</button>
            <button class="btn line sm" data-action="delPlan" data-id="${escapeAttr(p.id)}" title="删除教案">删除</button>
          </div></div>`).join('')}
    </div></div>`;
  },
  // 常用备课网址（按板块聚合 · 可增删 · 自动存本机 · 一键预览全部）
  lessonSitesView(){
    const sites = DB.sites || [];
    const groups = ['官方平台','题库组卷','互动课件','备课社区','数字阅读'];
    const colors = { '官方平台':'rc6', '题库组卷':'rc3', '互动课件':'rc1', '备课社区':'rc2', '数字阅读':'rc5' };
    const card = s => `
      <div class="card res sites-card" data-action="openSite" data-url="${escapeHtml(s.url)}" title="点击打开「${escapeHtml(s.name)}」">
        <button class="sites-card-del" data-action="delSite" data-url="${escapeHtml(s.url)}" title="移除">×</button>
        <div class="flex between center">
          <div class="res-ico" style="background:var(--${s.rc||colors[s.group]||'rc4'})">${s.ico||'🔗'}</div>
          <span class="tag">${escapeHtml(s.tag||s.group||'资源')}</span>
        </div>
        <h3 style="margin:12px 0 6px;font-size:15px">${escapeHtml(s.name)}</h3>
        <div class="muted" style="font-size:13px;line-height:1.6">${escapeHtml(s.desc||'')}</div>
        <div class="res-url">${escapeHtml(s.url.replace(/^https?:\/\//,''))}</div>
        <div class="res-open">打开网站 ↗</div>
      </div>`;
    return `
    <div class="sites-toolbar mb12">
      <div class="sites-saved">
        <span class="sites-dot"></span>
        <span>备课网址已聚合·修改自动保存到本机</span>
        <span class="muted" style="font-weight:400;margin-left:8px;font-size:12px">共 ${sites.length} 个资源</span>
      </div>
      <div class="sites-actions">
        <button class="btn line sm" data-action="previewAllSites" ${sites.length?'':'disabled'}>🔍 一键预览全部资源</button>
        <button class="btn sm" data-action="addSite">+ 添加网址</button>
      </div>
    </div>
    ${groups.filter(g=>sites.some(s=>s.group===g)).map(g=>`
      <div class="sites-group mb12">
        <div class="sites-group-head">
          <span class="sites-group-ico" style="background:var(--${colors[g]})">${({'官方平台':'🏛','题库组卷':'📝','互动课件':'📺','备课社区':'💡','数字阅读':'📜'})[g]||'🔗'}</span>
          <span class="sites-group-name">${g}</span>
          <span class="muted" style="font-size:12px">${sites.filter(s=>s.group===g).length} 个资源</span>
        </div>
        <div class="grid cols-3" id="siteGrid_${g}">
          ${sites.filter(s=>s.group===g).map(card).join('')}
        </div>
      </div>`).join('')}
    ${sites.length===0?`<div class="card" style="text-align:center;padding:48px 24px"><div style="font-size:40px;margin-bottom:12px">🌐</div><h3 style="margin:0 0 8px">还没有网址</h3><div class="muted">点击右上「+ 添加网址」把你的常用备课资源加进来</div></div>`:''}
    ${sites.length===0?'':`<div class="card sites-add-card" data-action="addSite">
      <div class="sites-add-ico">+</div>
      <div><div class="sites-add-title">添加备课网址</div><div class="muted">可在添加时选择所属板块</div></div>
    </div>`}`;
  },
  // 课标 —— 《义务教育语文课程标准（2022年版2025年日常修订版）》PDF 校正版
  lessonStandardView(){
    const core=['文化自信','语言运用','思维能力','审美创造'];
    const groups=[
      ['基础型 1',['语言文字积累与梳理'],'积累语言材料和语言经验，形成良好语感，掌握运用规范。'],
      ['发展型 3',['实用性阅读与交流','文学阅读与创意表达','思辨性阅读与表达'],'满足生活/学校/社会交流需要 → 文学体验 → 思维发展。'],
      ['拓展型 2',['整本书阅读','跨学科学习'],'提升阅读视野与综合素养，跨学科整合。'],
    ];
    const stages=[
      ['第一学段','1~2 年级 · 识字写字 + 阅读启蒙'],
      ['第二学段','3~4 年级 · 阅读与习作起步'],
      ['第三学段','5~6 年级 · 综合性阅读与表达'],
      ['第四学段','7~9 年级 · 思辨性阅读与文学鉴赏'],
    ];
    return `
    <div class="flex between mb12"><div class="section-title">📜 课标 · 义务教育语文课程标准</div>
      <button class="btn line sm" data-action="openSite" data-url="https://basic.smartedu.cn/">官方原文 ↗</button></div>

    <!-- 一课一标·新课标对应（交互式工具：选课文 → 对应学段/任务群/建议） -->
    <div class="card mb16 cs-tool">
      <div class="flex between center" style="margin-bottom:12px"><h3 style="margin:0;font-size:15px">📌 一课一标 · 新课标对应（2022版）</h3>
        <span class="muted" style="font-size:12px">选一篇课文，自动对应所属学段/板块/任务群/教学建议</span></div>
      <div class="grid cols-2 cs-tool-grid">
        <div class="cs-source">
          <div class="muted" style="font-size:12px;margin-bottom:6px">课文（来自统编教材单元）</div>
          <select class="field" id="csLessonSelect">
            ${DB.units.map(u=>`<optgroup label="${u.grade} · ${u.unit}（${u.human}）">
              ${u.lessons.map(l=>`<option value="${u.grade}|${u.unit}|${u.stage}">${l}</option>`).join('')}
            </optgroup>`).join('')}
          </select>
        </div>
        <div class="cs-target" id="csTarget">
          ${renderCsTarget(DB.units[0]?.grade, DB.units[0]?.unit, DB.units[0]?.stage || 's4')}
        </div>
      </div>
      <div class="muted cs-pdf" style="font-size:12px;margin-top:10px">
        依据：《义务教育语文课程标准（2022 年版 2025 年日常修订版）》PDF · 全文 105 页 · 教育部发布
      </div>
    </div>

    <div class="card mb12">
      <div class="muted" style="font-size:13px;line-height:1.75">
        <b>依据：《义务教育语文课程标准（2022 年版 2025 年日常修订版）》</b>（PDF，105 页）<br>
        以下为核心框架摘要，完整条文以教育部官方原文为准。
        <span class="tag" style="margin-left:6px">课程性质</span> 综合性、实践性课程，<b>工具性与人文性的统一</b>。
      </div>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <h3 style="margin:0 0 10px;font-size:15px">🎯 核心素养 <span class="muted" style="font-size:12px;font-weight:400">（四大维度）</span></h3>
        <div class="chips">${core.map(c=>`<span class="tag green">${c}</span>`).join('')}</div>
        <div class="muted mt12" style="font-size:12.5px;line-height:1.7">学生通过课程学习逐步形成的正确价值观、必备品格和关键能力，是课程育人价值的集中体现。</div>
      </div>
      <div class="card">
        <h3 style="margin:0 0 10px;font-size:15px">📐 学段要求 <span class="muted" style="font-size:12px;font-weight:400">（四个学段）</span></h3>
        ${stages.map((s,i)=>`
          <div class="field-row" style="padding:6px 0;${i<stages.length-1?'border-bottom:1px dashed var(--line)':''}">
            <span class="field-label">${s[0]}</span><span class="field-val">${s[1]}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="card mt16">
      <h3 style="margin:0 0 6px;font-size:15px">🧩 六大学习任务群 <span class="muted" style="font-size:12px;font-weight:400">（按内在逻辑关联的系列语文实践活动）</span></h3>
      <div class="muted" style="font-size:12px;line-height:1.7;margin-bottom:12px">围绕特定学习主题，体现情境性、实践性、综合性，共同指向学生核心素养发展。</div>
      <div class="grid cols-3">
        ${groups.map(g=>`
          <div class="mini-group">
            <div class="mini-group-title"><span class="tag" style="background:var(--accent-soft);color:var(--accent-strong);font-weight:600">${g[0]}</span></div>
            <div class="chips mt8">${g[1].map(t=>`<span class="tag">${t}</span>`).join('')}</div>
            <div class="muted" style="font-size:11.5px;line-height:1.6;margin-top:6px">${g[2]}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="card mt16">
      <h3 style="margin:0 0 10px;font-size:15px">💡 教学建议 <span class="muted" style="font-size:12px;font-weight:400">（用于教案与教材分析）</span></h3>
      <div class="muted" style="font-size:13px;line-height:1.9">
        • 立足核心素养，<b>充分发挥语文课程育人功能</b>；<br>
        • 构建语文学习任务群，<b>注重阶段性与发展性</b>；<br>
        • 突出课程内容的<b>时代性和典范性</b>，加强课程内容整合；<br>
        • 增强课程实施的<b>情境性和实践性</b>，促进学习方式变革；<br>
        • 倡导课程评价的<b>过程性和整体性</b>，重视评价的导向作用。
      </div>
    </div>`;
  },
  // 教材 —— 可外接小程序：人教版教材学习 / 电子版教科书（另附国家平台电子教材网页入口）
  lessonTextbookView(){
    const books=[
      {name:'国家中小学智慧教育平台 · 电子教材', desc:'教育部官方电子课本，按年级/版本在线预览与下载，免费正版。', type:'web', url:'https://basic.smartedu.cn/tchMaterial', note:'网页端直接打开'},
      {name:'人教版教材学习（小程序）', desc:'人教版教材同步学：课文朗读、知识点、课后题讲解，随身听读。', type:'mp', mp:'人教版教材学习', note:'微信小程序'},
      {name:'电子版教科书（小程序）', desc:'全学段电子课本集合，支持目录跳转、字号调节与离线查阅。', type:'mp', mp:'电子版教科书', note:'微信小程序'},
    ];
    return `
    <div class="flex between mb12"><div class="section-title">📖 教材 · 外接入口</div>
      <span class="muted" style="font-size:12px">网页资源直接打开；小程序请在微信中搜索</span></div>
    <div class="grid cols-3" id="bookGrid">
      ${books.map(b=>`
        <div class="card res" ${b.type==='web'?`data-action="openSite" data-url="${escapeAttr(b.url)}" title="点击打开「${escapeHtml(b.name)}」"`:''}>
          <div class="flex between center">
            <div class="res-ico" style="background:var(--${b.type==='mp'?'purple-soft':'green-soft'})">${b.type==='mp'?'💬':'📘'}</div>
            <span class="tag ${b.type==='mp'?'purple':'green'}">${escapeHtml(b.note)}</span></div>
          <h3 style="margin:12px 0 6px;font-size:15px">${escapeHtml(b.name)}</h3>
          <div class="muted" style="font-size:13px;line-height:1.6">${escapeHtml(b.desc)}</div>
          <div class="res-url">${b.type==='mp'?'微信小程序':escapeHtml(b.url.replace(/^https?:\/\//,''))}</div>
          ${b.type==='mp'
            ? `<div class="res-open" data-action="openMp" data-mp="${escapeAttr(b.mp)}">微信打开小程序</div>`
            : `<div class="res-open">打开网页 ↗</div>`}
        </div>`).join('')}
    </div>`;
  },

  // ---------- 作业批改（二级任务：字词识记 / 诗文默写 / 阅读训练 / 作文批改）----------
  homework(){
    const subs=[['word','字词识记','🔤'],['poem','诗文默写','📜'],['reading','阅读训练','📖'],['essay','作文批改','✍']];
    return `
    <div class="flex between mb12"><div class="section-title">📝 作业批改</div>
      <button class="btn" data-action="newHW">+ 分层作业设计</button></div>
    <div class="subnav hsub mb12" id="hwSubNav">
      ${subs.map(([v,t,ic])=>`<button class="sub-tab hitem ${hwTab===v?'active':''}" data-sub="${v}"><span class="hico">${ic}</span><span class="hlab">${t}</span></button>`).join('')}
    </div>
    <div id="hwSub">${homeworkSub()}</div>`;
  },

  // ---------- 素材资源库 ----------
  resource(){
    const subs=[['material','教学素材','📁'],['paper','学科试卷','📄'],['explain','知识点讲解','💡'],['reading','整本阅读','📚']];
    return `
    <div class="subnav hsub mb12" id="resSubNav">
      ${subs.map(([v,t,ic])=>`<button class="sub-tab hitem ${resourceTab===v?'active':''}" data-sub="${v}"><span class="hico">${ic}</span><span class="hlab">${t}</span></button>`).join('')}
    </div>
    <div id="resSub">${resourceSub()}</div>`;
  },

  // 教学素材（原有）
  materialView(){
    const filters = [['全部',''],['古诗文','古诗文'],['名著导读','名著导读'],['群文阅读','群文阅读'],['写作范例','写作范例']];
    const grades = [['全部',''],['七年级','七年级'],['八年级','八年级'],['九年级','九年级']];
    return `
    <div class="flex between mb12"><div class="section-title">❖ 教学素材资源库</div>
      <button class="btn" data-action="uploadRes">+ 上传素材</button></div>
    <div class="card mb12">
      <div class="flex gap8 wrap" id="fType">${filters.map((f,i)=>`<span class="pill ${i==0?'active':''}" data-v="${f[1]}">${f[0]}</span>`).join('')}</div>
      <div class="flex gap8 wrap mt16" id="fGrade">${grades.map((g,i)=>`<span class="pill ${i==0?'active':''}" data-v="${g[1]}">${g[0]}</span>`).join('')}</div>
    </div>
    <div class="grid cols-3" id="resGrid">
      ${DB.resources.map(r=>`
        <div class="card res" data-type="${r.type}" data-grade="${r.grade}">
          <div class="flex between"><h3 style="margin:0">${r.title}</h3>${r.fav?'<span>⭐</span>':''}</div>
          <div class="mt16 kpi-row">
            <span class="tag blue">${r.grade}</span><span class="tag red">${r.theme.slice(0,6)}</span>
            <span class="tag purple">${r.group}</span></div>
          <div class="mt16"><span class="tag green">${r.type}</span></div>
          <div class="flex gap8 mt16"><button class="btn line sm" data-action="useRes">引用到备课</button></div>
        </div>`).join('')}
    </div>`;
  },

  // 学科试卷（文档/PDF/图片 上传）
  paperView(){
    const ftIcon = { pdf:'📄', doc:'📝', image:'🖼' };
    return `
    <div class="flex between mb12"><div class="section-title">📑 学科试卷</div>
      <label class="btn" for="paperFile">+ 上传试卷（文档 / PDF / 图片）</label>
      <input type="file" id="paperFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" style="display:none"></div>
    <div class="grid cols-3" id="paperGrid">
      ${DB.papers.map(p=>`
        <div class="card res">
          <div class="flex between"><h3 style="margin:0">${p.title}</h3><span style="font-size:22px">${ftIcon[p.fileType]||'📄'}</span></div>
          <div class="mt16 kpi-row">
            <span class="tag blue">${p.grade}</span><span class="tag purple">${p.subject}</span>
            <span class="tag ${p.fileType==='pdf'?'red':p.fileType==='image'?'green':'amber'}">${p.fileType.toUpperCase()}</span></div>
          <div class="mt16 muted" style="font-size:12px">📎 ${p.fileName} · ${p.size} · ${p.date}</div>
          ${p.note?`<div class="mt8 muted" style="font-size:12px">${p.note}</div>`:''}
          <div class="flex gap8 mt16">
            <button class="btn line sm" data-action="useRes">引用到备课</button>
            <button class="btn line sm" data-action="previewFile" data-f="${p.fileName}">预览</button>
          </div>
        </div>`).join('')}
    </div>`;
  },

  // 知识点讲解（视频文件 / 链接 / 抖音·小红书·哔哩哔哩·小程序视频）
  explainView(){
    const platColor = { '哔哩哔哩':'pink', '抖音':'red', '小红书':'amber', '视频文件':'blue', '小程序视频':'green' };
    return `
    <div class="flex between mb12"><div class="section-title">🎬 知识点讲解（视频资源）</div>
      <button class="btn" data-action="addExplain">+ 添加讲解视频</button></div>
    <div class="card mb12 muted" style="font-size:12px">支持：本地视频文件上传、粘贴视频链接，以及抖音 / 小红书 / 哔哩哔哩 / 小程序视频 等平台资源嵌入。</div>
    <div class="grid cols-3" id="explainGrid">
      ${DB.explains.map(e=>`
        <div class="card res">
          <div class="flex between"><h3 style="margin:0">${e.title}</h3><span style="font-size:22px">${e.icon||'🎬'}</span></div>
          <div class="mt16 kpi-row">
            <span class="tag blue">${e.subject}</span>
            <span class="tag ${platColor[e.platform]||'gray'}">${e.platform}</span>
            <span class="tag gray">⏱ ${e.duration}</span></div>
          <div class="mt16 muted" style="font-size:12px">${escapeHtml(e.fileType?('📎 '+e.fileName+' · '):'')}${escapeHtml(e.note||'')}</div>
          <div class="flex gap8 mt16">
            ${e.url?`<a class="btn line sm" href="${escapeAttr(e.url)}" target="_blank" rel="noopener">▶ 打开</a>`:`<button class="btn line sm" data-action="previewFile" data-f="${escapeAttr(e.fileName||'')}">▶ 播放</button>`}
            <button class="btn line sm" data-action="copyLink" data-url="${escapeAttr(e.url||'')}">复制链接</button>
          </div>
        </div>`).join('')}
    </div>`;
  },

  // 整本阅读
  readingView(){
    const qCount = id => (DB.readingQuestions||[]).filter(q=>q.bookId===id).length;
    return `
    <div class="flex between mb12"><div class="section-title">📚 整本阅读</div>
      <div class="flex gap8">
        <button class="btn line" data-action="trainBank">📝 考题训练库</button>
        <button class="btn" data-action="addReading">+ 添加书目</button>
      </div></div>
    <div class="grid cols-3" id="readingGrid">
      ${DB.readings.map(b=>`
        <div class="card res">
          <div class="flex between"><h3 style="margin:0">${b.title}</h3><span style="font-size:26px">${b.icon||'📖'}</span></div>
          <div class="mt16 kpi-row">
            <span class="tag blue">${b.grade}</span>
            <span class="tag purple">${b.author}</span>
            ${b.progress?`<span class="tag green">${b.progress}</span>`:''}</div>
          ${b.note?`<div class="mt16 muted" style="font-size:12px">${b.note}</div>`:''}
          <div class="flex gap8 mt16">
            <button class="btn line sm" data-action="useRes">纳入阅读计划</button>
            <button class="btn line sm" data-action="trainReading" data-id="${b.id}">考题训练 <span class="tag gray">${qCount(b.id)}</span></button>
          </div>
        </div>`).join('')}
    </div>`;
  },

  // 整本阅读 · 单本考题训练
  readingTrainView(bookId){
    const book = DB.readings.find(x=>x.id===bookId) || { title:'书目', icon:'📖' };
    const qs = (DB.readingQuestions||[]).filter(q=>q.bookId===bookId);
    const diffColor = { '易':'green', '中':'amber', '难':'red' };
    return `
    <div class="flex between mb12">
      <div class="section-title">${book.icon||'📖'} ${book.title} · 考题训练</div>
      <div class="flex gap8">
        <button class="btn line sm" data-action="toggleAnswers">👁 自测模式（隐藏答案）</button>
        <button class="btn line sm" data-action="backReading">← 返回书目</button>
      </div>
    </div>
    <div class="card mb12 muted" style="font-size:12px">共 ${qs.length} 道考题；点击「自测模式」可隐藏答案用于课堂抽测，再次点击恢复显示。</div>
    <div id="qList">
      ${qs.length? qs.map((q,i)=>`
        <div class="card mb12">
          <div class="flex between"><div><b>Q${i+1}.</b> ${q.q}</div>
            <div class="flex gap8">
              <span class="tag ${q.type==='选择'?'blue':q.type==='填空'?'purple':'gray'}">${q.type}</span>
              <span class="tag ${diffColor[q.difficulty]||'gray'}">${q.difficulty}</span>
            </div></div>
          ${q.type==='选择'?`<div class="mt12 muted" style="font-size:13px">选项：${q.options.map(o=>`<span class="pill" style="margin:2px">${o}</span>`).join('')}</div>`:''}
          <div class="q-ans mt12"><span class="muted" style="font-size:12px">答案：</span><b>${q.answer}</b>
            ${q.analysis?`<div class="muted mt8" style="font-size:12px">解析：${q.analysis}</div>`:''}</div>
        </div>`).join('')
      : `<div class="card muted">该书目暂无考题，点击右下「+ 添加考题」开始命制。</div>`}
    </div>
    <button class="btn mt8" data-action="addReadingQ" data-id="${bookId}">+ 添加考题</button>`;
  },

  // 整本阅读 · 全部考题训练库（跨书目汇总）
  readingTrainBank(){
    const bookTitle = id => (DB.readings.find(x=>x.id===id)||{}).title || id;
    const qs = DB.readingQuestions||[];
    return `
    <div class="flex between mb12">
      <div class="section-title">📝 整本阅读 · 考题训练库</div>
      <button class="btn line sm" data-action="backReading">← 返回书目</button>
    </div>
    <div class="card mb12 muted" style="font-size:12px">跨书目汇总全部 ${qs.length} 道考题，便于统一组卷与复习抽测。</div>
    <div id="qList">
      ${qs.length? qs.map((q,i)=>`
        <div class="card mb12">
          <div class="flex between"><div><b>Q${i+1}.</b> ${q.q}</div>
            <div class="flex gap8"><span class="tag purple">${bookTitle(q.bookId)}</span>
              <span class="tag ${q.type==='选择'?'blue':q.type==='填空'?'purple':'gray'}">${q.type}</span></div></div>
          <div class="q-ans mt12"><span class="muted" style="font-size:12px">答案：</span><b>${q.answer}</b></div>
        </div>`).join('')
      : `<div class="card muted">暂无考题。</div>`}
    </div>`;
  },

  // 素材资源库 · 二级目录路由
  resourceSub(){
    if(resourceTab==='paper') return paperView();
    if(resourceTab==='explain') return explainView();
    if(resourceTab==='reading'){
      if(readingTrainId==='__bank__') return readingTrainBank();
      if(readingTrainId) return readingTrainView(readingTrainId);
      return readingView();
    }
    return materialView();
  },

  // ---------- 班级学情 ----------
  analytics(){
    const subs=[['overview','学情看板','📊'],['talk','谈心谈话','💬'],
      ['monthly','月考成绩','🗓'],['mid','期中考','📝'],['final','期末考','🏁'],['query','成绩查询','🔍']];
    return `
    <div class="subnav hsub mb12" id="anaSubNav">
      ${subs.map(([v,t,ic])=>`<button class="sub-tab hitem ${analyticsTab===v?'active':''}" data-sub="${v}"><span class="hico">${ic}</span><span class="hlab">${t}</span></button>`).join('')}
    </div>
    <div id="anaSub">${analyticsSub()}</div>`;
  },

  // ---------- 荣誉扫描册 ----------
  honor(){
    const h = DB.honors;
    const byCat = c => h.filter(x=>x.cat===c).length;
    const catColor = { '学生荣誉':'blue', '班级荣誉':'green', '教师荣誉':'purple' };
    const medal = { '国家级':'🥇', '省级':'🥇', '市级':'🥈', '区级':'🥉', '校级':'🏅' };
    const filters = [['全部',''],['学生荣誉','学生荣誉'],['班级荣誉','班级荣誉'],['教师荣誉','教师荣誉']];
    return `
    <div class="flex between mb12"><div class="section-title">🏅 荣誉登记册（荣誉电子化登记）</div>
      <div class="flex gap8">
        <button class="btn line" data-action="exportHonor">⬇ 导出登记册</button>
        <button class="btn" data-action="scanHonor">+ 录入登记</button>
      </div>
    </div>
    <div class="grid cols-4 mb12">
      <div class="card stat"><div class="num">${h.length}</div><div class="lbl">荣誉总数</div><div class="delta up">▲ 本学期 +5</div></div>
      <div class="card stat"><div class="num">${byCat('学生荣誉')}</div><div class="lbl">学生荣誉</div><div class="delta">个人竞赛获奖</div></div>
      <div class="card stat"><div class="num">${byCat('班级荣誉')}</div><div class="lbl">班级荣誉</div><div class="delta">集体建设成果</div></div>
      <div class="card stat"><div class="num">${byCat('教师荣誉')}</div><div class="lbl">教师荣誉</div><div class="delta">教学教研获奖</div></div>
    </div>
    <div class="card mb12">
      <div class="flex gap8 wrap" id="fHonor">${filters.map((f,i)=>`<span class="pill ${i==0?'active':''}" data-v="${f[1]}">${f[0]}</span>`).join('')}</div>
    </div>
    <div class="grid cols-3" id="honorGrid">
      ${h.map(x=>`
        <div class="card honor" data-cat="${x.cat}">
          <div class="cert">
            <div class="cert-level">${x.level}</div>
            <div class="cert-seal">${medal[x.level]||'🏅'}</div>
            <div class="cert-name">${x.award}</div>
          </div>
          <div class="honor-body">
            <div class="honor-title">${escapeHtml(x.title)}</div>
            <div class="kpi-row">
              <span class="tag ${catColor[x.cat]}">${x.cat}</span>
              <span class="tag blue">${x.type}</span>
            </div>
            <div class="honor-meta">获奖：${x.awardee} · ${x.date}</div>
          </div>
          <div class="flex gap8 mt12">
            <button class="btn line sm" data-action="viewHonor">查看</button>
            <button class="btn line sm" data-action="archiveHonor">归档</button>
          </div>
        </div>`).join('')}
    </div>`;
  },

  // ---------- 班主任工作 ----------
  homeroom(){
    const subs=[['overview','班级概览','⌂'],['students','学生信息','👥'],['aid','学生资助','🎗'],['committee','班委设置','🧑‍💼'],['meeting','主题班会记录','📋'],['docs','文档生成','📝']];
    return `
    <div class="section-title">⌂ 班主任工作台</div>
    <div class="subnav hsub mb12" id="homeSubNav">
      ${subs.map(([v,t,ic])=>`<button class="sub-tab hitem ${homeTab===v?'active':''}" data-sub="${v}"><span class="hico">${ic}</span><span class="hlab">${t}</span></button>`).join('')}
    </div>
    <div id="homeSub">${homeroomSub()}</div>`;
  },

  // ---------- 个人与设置 ----------
  settings(){
    return `
    <div class="section-title">⚙ 个人与设置</div>
    <div class="grid cols-2">
      <div class="card">
        <h3>👤 账号信息</h3>
        <div class="flex gap12 mt16" style="align-items:center">
          <div class="avatar lg" id="setAvatar">${DB.user.avatar?`<img src="${DB.user.avatar}">`:(DB.user.name||'师').slice(0,1)}</div>
          <button class="btn line" data-action="editAvatar">🖼 修改头像 / 昵称</button>
        </div>
        <div class="field mt16"><label>姓名</label><input id="setName" value="${DB.user.name}"></div>
        <div class="field"><label>角色</label><input id="setRole" value="${DB.user.role}"></div>
        <div class="field"><label>学校</label><input id="setSchool" value="${DB.user.school}"></div>
        <div class="field"><label>所属教研组</label><input id="setGroup" value="初中语文教研组"></div>
        <button class="btn" data-action="saveProfile">保存</button>
      </div>
      <div class="card">
        <h3>📤 数据导出中心（资产自主）</h3>
        <div class="list mt16">
          ${[['教案全集','lesson_plans.xlsx'],['成绩与学情','scores.xlsx'],
            ['作业批改记录','submissions.json'],['班主任台账','homeroom.xlsx'],
            ['素材收藏','resources.json']].map(([n,f])=>`
            <div class="row"><div class="main"><div class="title">${n}</div><div class="meta">${f}</div></div>
              <button class="btn line sm" data-action="export" data-f="${f}">导出</button></div>`).join('')}
        </div>
        <div class="muted mt16" style="font-size:12px">数据可随时导出、不被平台锁定（合规要求）</div>
      </div>
    </div>
    <div class="card mt16">
      <h3>🔗 数据与同步</h3>
      <div class="kpi-row mt16" id="syncStatus">
        <span class="tag green">✓ 本机保存</span><span class="tag gray">○ 云端同步（未连接）</span>
      </div>
      <div class="muted mt16" style="font-size:12px">当前为本地原型：数据保存在本机浏览器，刷新不丢、可导出。接入后端（设置 API 地址）后启用云端账号与多端同步。</div>
      <div class="field mt16"><label>后端 API 地址（可选，留空则纯本机模式）</label>
        <input id="apiBase" placeholder="https://你的后端域名">
        <div class="flex gap8 mt8">
          <button class="btn sm" data-action="saveApiBase">保存地址</button>
          <button class="btn line sm" data-action="testApi">测试连接</button>
          <span class="muted" id="apiTestResult" style="font-size:12px;align-self:center"></span>
        </div>
      </div>
    </div>
    <div class="card mt16">
      <h3>🐙 GitHub 数据备份（自动 / 可恢复）</h3>
      <div class="muted mt8" style="font-size:12px">把你在本机产生的全部数据（待办 / 教案 / 评语 / 学生 / 配置等）备份到你自己的 GitHub 仓库，支持「自动定时备份」与「一键恢复」。数据文件归你所有、完全私有可控。</div>
      <div class="grid cols-2 mt16">
        <div class="field"><label>仓库 owner / repo</label><input id="ghRepo" placeholder="如：username/yu-backup"></div>
        <div class="field"><label>分支（默认 main）</label><input id="ghBranch" placeholder="main"></div>
        <div class="field"><label>备份文件路径</label><input id="ghPath" placeholder="yu-backup/data.json"></div>
        <div class="field"><label>GitHub Token（仅本机保存）</label><input id="ghToken" type="password" placeholder="ghp_... 或个人访问令牌"></div>
      </div>
      <label class="flex gap8 mt12" style="align-items:center;font-size:14px">
        <input type="checkbox" id="ghAuto"> 开启自动备份（数据变动后每 60 秒静默备份一次）
      </label>
      <div class="muted mt8" style="font-size:12px">Token 需具备该仓库 <code>Contents: read &amp; write</code> 权限；建议使用「细粒度令牌」且只授权一个<b>私有</b>备份仓库。</div>
      <div class="field mt12"><label>🔐 凭据加密口令（可选，强烈建议）</label><input id="secPass" type="password" placeholder="设置后，Token / API Key 将以 AES-GCM 加密存本机，明文不再落盘">
        <div class="muted mt6" style="font-size:12px">设置口令后，保存时会把 GitHub Token 与挖挖 API Key 加密后再存浏览器；口令<b>只存在于本次会话内存</b>、关闭页面即失效，不会被保存。每次打开网页需重输口令「解锁」方能使用自动备份 / 挖挖 AI。留空则不加密（明文存储，风险较高）。</div>
      </div>
      <div class="flex gap8 mt8 wrap">
        <button class="btn line sm" id="secUnlock">🔓 解锁 / 显示已加密凭据</button>
        <span class="muted" id="secState" style="font-size:12px;align-self:center"></span>
      </div>
      <div class="flex gap8 mt16 wrap">
        <button class="btn sm" data-action="saveGithubCfg">保存配置</button>
        <button class="btn line sm" data-action="githubBackup">立即备份</button>
        <button class="btn line sm" data-action="githubRestore">从云端恢复</button>
        <span class="muted" id="ghStatus" style="font-size:12px;align-self:center"></span>
      </div>
      <div class="muted mt12" style="font-size:12px;color:var(--accent-strong)">⚠️ 隐私提醒：备份文件含学生姓名、成绩、评语等敏感信息，<b>请务必使用私有仓库</b>，切勿把 Token 泄露给他人。</div>
    </div>
    <div class="card mt16">
      <h3>🎨 个性化设置</h3>
      <div class="muted mt16" style="font-size:12px">自定义工作台背景，仅本机保存，刷新不丢。</div>
      <div class="flex gap12 wrap mt16" id="bgPresets">
        <button class="bg-swatch" data-bg="" style="background:var(--bg)">默认</button>
        <button class="bg-swatch" data-bg="linear-gradient(135deg,#e3f2fd,#f3e5f5)"></button>
        <button class="bg-swatch" data-bg="linear-gradient(135deg,#e0f7fa,#e8f5e9)"></button>
        <button class="bg-swatch" data-bg="linear-gradient(135deg,#fff3e0,#ffe0b2)"></button>
        <button class="bg-swatch" data-bg="linear-gradient(135deg,#ede7f6,#e8eaf6)"></button>
      </div>
      <div class="flex gap8 wrap mt16">
        <label class="btn line" for="bgFile">📁 上传自定义背景图</label>
        <input type="file" id="bgFile" accept="image/*" style="display:none">
        <button class="btn line" id="bgReset">恢复默认</button>
      </div>
    </div>
    <div class="card mt16">
      <h3>🐸 挖挖（大模型）</h3>
      <div class="muted mt16" style="font-size:12px">默认内置规则模式即可用（加待办 / 查课表 / 设提醒 / 学情 / 教案）。填下方「API Key」并保存后，挖挖可自由对话、调用工具处理任务。若保存后测试显示「网络 / 跨域被拦」，请用下方「🌉 中继地址」绕过（推荐）。<span class="tag gray">密钥仅存本机浏览器</span></div>
      <div class="grid cols-2 mt16">
        <div class="field"><label>接口地址（OpenAI 兼容）</label><input id="agentBase" placeholder="https://api.openai.com/v1"></div>
        <div class="field"><label>模型名</label><input id="agentModel" placeholder="gpt-4o-mini"></div>
      </div>
      <div class="muted mt8" style="font-size:12px;line-height:1.6">常用接口地址：DeepSeek <code>https://api.deepseek.com/v1</code> ｜ 通义 <code>https://dashscope.aliyuncs.com/compatible-mode/v1</code> ｜ 智谱 <code>https://open.bigmodel.cn/api/paas/v4</code> ｜ SiliconFlow <code>https://api.siliconflow.cn/v1</code>（模型名按平台填，如 deepseek-chat）</div>
      <div class="field"><label>API Key</label><input id="agentKey" type="password" placeholder="sk-... 或平台密钥"></div>
      <div class="field mt8"><label>🌉 中继地址（解决跨域 CORS，推荐）</label><input id="agentRelay" placeholder="https://你的中继服务网址/  （留空则浏览器直连）"></div>
      <div class="muted mt8" style="font-size:12px;line-height:1.6">若保存 Key 后测试提示「网络不可达 / 跨域拦截」，把密钥与接口地址配置到你自己的中继服务（如 Cloudflare Worker，仓库内含 <code>relay/worker.js</code>），此处填入该服务网址即可。密钥由中继保管，浏览器不再直连大模型，彻底绕过 CORS。</div>
      <div class="flex gap8 mt8">
        <button class="btn sm" id="agentCfgSave">保存配置</button>
        <button class="btn line sm" id="agentCfgClear">清除</button>
        <button class="btn line sm" id="agentTest">测试连接</button>
        <button class="btn line sm" id="agentTry">试用助手</button>
      </div>
      <div class="muted mt8" id="agentTestResult" style="font-size:12px"></div>
    </div>`;
  },
};

// 素材资源库的子视图（materialView/paperView/explainView/readingView/readingTrainView/readingTrainBank/resourceSub）
// 当初被写进了 views 对象内部，作为 method 无法被裸名调用（resource()→resourceSub() 会 ReferenceError）。
// 解构成模块级常量，供 resource()/resourceSub()/rerenderResourceSub() 等以裸名调用。
const { materialView, paperView, explainView, readingView, readingTrainView, readingTrainBank, resourceSub } = views;

// ================= 作业批改 · 二级任务 =================
function homeworkSub(){
  if(hwTab==='poem') return poemView();
  if(hwTab==='reading') return readingExView();
  if(hwTab==='essay') return essayView();
  return wordView();
}

// ---------- 二级任务 1：字词识记 ----------
function wordView(){
  const lists = DB.wordLists||[];
  return `
  <div class="flex between mb12">
    <div class="muted">教师上传字词清单，学生可进入「识记自测」巩固记忆。</div>
    <div class="flex gap8">
      <button class="btn line sm" data-action="newWordList">+ 上传字词清单</button>
      <input type="file" id="wordFile" accept=".csv,.txt" style="display:none">
    </div>
  </div>
  ${lists.length ? `<div class="grid cols-2">`+lists.map(w=>`
    <div class="card">
      <div class="flex between"><h3 style="margin:0">${escapeHtml(w.title)}</h3><span class="tag purple">${escapeHtml(w.grade||'—')}</span></div>
      <div class="list mt16">${w.words.map(x=>`
        <div class="row"><div class="main"><div class="title">${escapeHtml(x.w)} <span class="muted" style="font-size:12px">${escapeHtml(x.py)}</span></div>
          <div class="meta">${escapeHtml(x.mean)}</div></div></div>`).join('')}</div>
      <div class="flex gap8 mt12"><button class="btn sm" data-action="wordSelfTest" data-id="${w.id}">🎴 识记自测</button></div>
    </div>`).join('')+`</div>`
    : `<div class="card muted">暂无字词清单，点击右上角「上传字词清单」添加（支持 CSV / 文本，每行：词语,拼音,释义）。</div>`}
  `;
}

function importWordFile(inp){
  const f = inp.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    const lines = String(r.result).split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const words = lines.map(l=>{ const [w,py,mean]=l.split(/[,，\t]/).map(s=>s.trim()); return { w, py:py||'', mean:mean||'' }; })
      .filter(x=>x.w);
    if(!words.length){ toast('未解析到词语，请确认格式为「词语,拼音,释义」'); return; }
    DB.wordLists.unshift({ id:'w'+Date.now(), title:f.name.replace(/\.[^.]+$/,''), grade:'上传', words });
    saveHomework();
    $('#hwSub').innerHTML = wordView(); bindHomeworkSub();
    toast(`已上传字词清单：${words.length} 个词语（演示，已本地保存）`);
  };
  r.readAsText(f); inp.value='';
}

function wordSelfTest(id){
  const w = (DB.wordLists||[]).find(x=>x.id===id); if(!w) return;
  const items = w.words.slice();
  let i=0;
  const render=()=>{
    const it = items[i];
    const ov = el(`<div class="modal" id="wordTest"><div class="modal-box" style="max-width:440px">
      <h3>🎴 识记自测 · ${w.title}</h3>
      <div class="muted" style="font-size:12px">第 ${i+1} / ${items.length} 个</div>
      <div class="mt16" style="text-align:center;font-size:28px;font-weight:700">${it.w}</div>
      <div id="wtAns" class="mt12" style="display:none;text-align:center">
        <div class="muted">拼音：${it.py}</div><div class="mt8">释义：${it.mean}</div></div>
      <div class="modal-actions">
        <button class="btn line" id="wtReveal">显示答案</button>
        <button class="btn" id="wtNext">${i<items.length-1?'下一个':'完成'}</button>
      </div></div></div>`);
    document.body.appendChild(ov);
    ov.onclick=(e)=>{ if(e.target===ov) ov.remove(); };
    ov.querySelector('#wtReveal').onclick=()=>{ ov.querySelector('#wtAns').style.display='block'; };
    ov.querySelector('#wtNext').onclick=()=>{ ov.remove(); if(i<items.length-1){ i++; render(); } else toast('自测完成，继续加油！'); };
  };
  render();
}

// ---------- 二级任务 2：诗文默写 ----------
function poemView(){
  const poems = DB.poems||[];
  return `
  <div class="flex between mb12">
    <div class="muted">教材必背篇目；学生可「上传默写图片」自动识别并与原文逐字比对批改。</div>
    <button class="btn line sm" data-action="newPoem">+ 上传诗文</button>
  </div>
  <div class="grid cols-2 mb12">
    ${poems.map(p=>`
      <div class="card">
        <div class="flex between"><h3 style="margin:0">${escapeHtml(p.title)}</h3><span class="tag green">${escapeHtml(p.dynasty)}·${escapeHtml(p.author)}</span></div>
        <div class="muted mt12" style="font-size:13px;line-height:1.7">${escapeHtml(p.text)}</div>
        <div class="flex gap8 mt12"><button class="btn sm" data-action="poemUpload" data-id="${p.id}">📷 上传默写图片识别批改</button>
          <input type="file" class="poemFile" accept="image/*" data-id="${p.id}" style="display:none"></div>
      </div>`).join('')}
  </div>
  <div id="poemResult"></div>`;
}

async function gradePoemOCR(p, file){
  if(!file) return;
  const box = $('#poemResult');
  box.innerHTML = `<div class="card muted">正在识别图片（OCR，首次较慢）…</div>`;
  let text='';
  try{ text = await ocrImageFile(file); }
  catch(e){
    box.innerHTML = `<div class="card"><div class="muted">图片识别失败（需联网加载 OCR 引擎）：${e.message}</div>
      <div class="mt12"><textarea id="poemManual" class="field" rows="3" placeholder="在此粘贴 / 输入默写内容"></textarea>
      <button class="btn sm mt8" data-action="poemDiff" data-id="${p.id}" data-manual="1">比对原文并评分</button></div></div>`;
    return;
  }
  renderPoemResult(p, text);
}

function renderPoemResult(p, text){
  const box = $('#poemResult');
  box.innerHTML = `
   <div class="card mt12">
     <div class="flex between"><h3 style="margin:0">${escapeHtml(p.title)} · 默写批改</h3>
       <span class="muted" style="font-size:12px">识别文字可手动修正后比对</span></div>
     <textarea id="poemOcr_${p.id}" class="field mt12" rows="3">${escapeHtml(text)}</textarea>
     <div class="flex gap8 mt12"><button class="btn sm" data-action="poemDiff" data-id="${p.id}">比对原文并评分</button></div>
     <div id="poemDiff_${p.id}" class="mt12"></div>
   </div>`;
}

function doPoemDiff(id, manual){
  const p = (DB.poems||[]).find(x=>x.id===id); if(!p) return;
  const src = manual ? (document.getElementById('poemManual')?.value||'') : (document.getElementById('poemOcr_'+id)?.value||'');
  const { html, score, total, matched } = diffChinese(p.text, src);
  const box = document.getElementById('poemDiff_'+id) || document.getElementById('poemResult');
  const target = document.getElementById('poemDiff_'+id) || box;
  target.innerHTML = `
    <div class="diff-box">${html}</div>
    <div class="mt12 flex between">
      <span class="tag ${score>=80?'green':score>=60?'amber':'red'}">得分 ${score} 分（${matched}/${total} 字一致）</span>
      <span class="muted" style="font-size:12px">绿=正确 红=有误 空格∅=漏写</span>
    </div>
    <div class="mt8 muted" style="font-size:12px">说明：用字、标点、换行差异均按「非汉字非字母数字」忽略后逐字比对，仅作默写自查参考。</div>`;
}

// ---------- 二级任务 3：阅读训练 ----------
function readingExView(){
  const exs = DB.readingExs||[];
  return `
  <div class="flex between mb12">
    <div class="muted">阅读篇目与训练题；点「显示答案」核对，可切自测模式。</div>
    <button class="btn line sm" data-action="newReading">+ 上传阅读篇目</button>
  </div>
  ${exs.length ? exs.map(r=>`
    <div class="card mb12">
      <div class="flex between"><h3 style="margin:0">${escapeHtml(r.title)}</h3><span class="tag blue">${escapeHtml(r.grade||'—')}</span></div>
      <div class="muted mt12" style="font-size:13px;line-height:1.8">${escapeHtml(r.passage)}</div>
      <div class="list mt16">
        ${r.questions.map((q,i)=>`
          <div class="row col" data-q="${escapeAttr(r.id)}_${i}">
            <div class="main"><div class="title">${i+1}. ${escapeHtml(q.q)}</div>
              <div class="meta hide-ans" style="display:none;color:var(--brand)">答：${escapeHtml(q.a)}</div></div>
            <button class="btn line sm" data-action="readingReveal" data-q="${r.id}_${i}">显示答案</button>
          </div>`).join('')}
      </div>
    </div>`).join('')
    : `<div class="card muted">暂无阅读篇目，点击右上角「上传阅读篇目」添加。</div>`}
  `;
}

// ---------- 二级任务 4：作文批改 ----------
function essayView(){
  const crit = DB.essayCriteria||[];
  return `
  <!-- 作业与批改记录（原作业模块） -->
  <div class="grid cols-3 mb12">
    ${DB.assignments.map(a=>`
      <div class="card"><h3>${a.title}</h3>
        <div class="meta muted">${a.class} · ${a.type}</div>
        <div class="mt16"><span class="tag purple">分层：${a.layer}</span></div>
        <div class="mt16"><div class="flex between muted" style="font-size:12px"><span>提交进度</span><span>${a.submitted}/${a.total}</span></div>
          <div class="bar mt16"><i style="width:${a.submitted/a.total*100}%;background:var(--blue)"></i></div></div>
        <div class="flex gap8 mt16"><button class="btn sm" data-action="grade">去批改</button></div>
      </div>`).join('')}
  </div>
  <div class="card mb12">
    <h3>🐞 班级错题与薄弱归因</h3>
    <div class="list mt16">
      ${DB.errorStats.map(e=>`
        <div class="row"><div class="main"><div class="title">${e.type}</div></div>
          <div class="bar" style="width:120px"><i style="width:${e.count/26*100}%;background:var(--brand)"></i></div>
          <span class="muted">${e.count} 处</span></div>`).join('')}
    </div>
  </div>

  <!-- 教师端：评价标准 -->
  <div class="card mb12">
    <div class="flex between mb12"><h3 style="margin:0">📋 作文批改 · 教师评价标准</h3>
      <div class="flex gap8">
        <button class="btn line sm" data-action="newEssayCriteria">+ 上传评价标准</button>
        <input type="file" id="critFile" accept=".txt,.md,.csv" style="display:none">
      </div></div>
    <div class="list">${crit.map(c=>`
      <div class="row"><div class="main"><div class="title">${c.title}</div>
        <div class="meta" style="white-space:pre-wrap">${c.content}</div></div>
      <button class="btn line sm" data-action="useCriteria" data-id="${c.id}">选用</button></div>`).join('')}</div>
    <div class="muted mt12" style="font-size:12px">选用后在下方「学生上传批改」中作为评分依据；默认已内置《中考记叙文评分标准》。</div>
  </div>

  <!-- 学生端：上传图片识别批改 -->
  <div class="card">
    <h3>✍ 学生作文 · 上传图片识别批改</h3>
    <div class="muted mt8" style="font-size:12px">学生上传手写 / 打印作文图片 → 自动 OCR 识别文字 → 依据所选评价标准智能初评并生成批改报告。</div>
    <div class="flex gap8 mt12 wrap">
      <label class="btn sm" for="essayImg">📷 上传作文图片</label>
      <input type="file" id="essayImg" accept="image/*" style="display:none">
      <select class="field sm" id="essayCritSel" style="width:auto">${crit.map(c=>`<option value="${escapeAttr(c.id)}">${escapeHtml(c.title)}</option>`).join('')}</select>
      <button class="btn sm line" data-action="essaySmartGrade">⚙ 智能初评</button>
    </div>
    <div id="essayGradeBox" class="mt16"></div>
  </div>`;
}

function importCritFile(inp){
  const f = inp.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    DB.essayCriteria.push({ id:'c'+Date.now(), title:f.name.replace(/\.[^.]+$/,''), content:String(r.result) });
    saveHomework();
    $('#hwSub').innerHTML = essayView(); bindHomeworkSub();
    toast('评价标准已上传（演示，已本地保存）');
  };
  r.readAsText(f); inp.value='';
}

async function gradeEssayOCR(file){
  if(!file) return;
  const box = $('#essayGradeBox');
  box.innerHTML = `<div class="muted">正在识别作文图片（OCR，首次较慢）…</div>`;
  let text='';
  try{ text = await ocrImageFile(file); }
  catch(e){
    box.innerHTML = `<div class="muted">图片识别失败（需联网加载 OCR 引擎）：${e.message}</div>
      <div class="mt8"><textarea id="essayManual" class="field" rows="4" placeholder="在此粘贴 / 输入作文文字"></textarea>
      <button class="btn sm mt8" data-action="essaySmartGrade" data-manual="1">⚙ 智能初评</button></div>`;
    return;
  }
  renderEssayBox(text);
}

function renderEssayBox(text){
  const box = $('#essayGradeBox');
  box.innerHTML = `
    <div class="flex between"><h4 style="margin:0">识别文字（可手动修正）</h4><span class="muted" style="font-size:12px">${text.length} 字</span></div>
    <textarea id="essayText" class="field mt8" rows="4">${text}</textarea>
    <div class="flex gap8 mt8"><button class="btn sm" data-action="essaySmartGrade">⚙ 生成批改报告</button></div>
    <div id="essayReport" class="mt12"></div>`;
}

function genEssayReport(manual){
  const src = manual ? (document.getElementById('essayManual')?.value||'') : (document.getElementById('essayText')?.value||'');
  const sel = document.getElementById('essayCritSel');
  const crit = (DB.essayCriteria||[]).find(c=>c.id===sel?.value) || (DB.essayCriteria||[])[0];
  if(!src.trim()){ toast('请先上传作文图片或粘贴文字'); return; }
  const chars = src.replace(/\s/g,'').length;
  const paras = src.split(/\n+/).map(s=>s.trim()).filter(Boolean).length;
  const hasLogic = /(然而|但是|因为|所以|其实|不仅|而且|总之|例如|可见|由此)/.test(src);
  const hasDesc = /(仿佛|好像|犹如|宛如|像|似乎|轻轻|缓缓|渐渐)/.test(src);
  // 启发式初评（0-50，中考常见满分 50）
  const lenScore  = Math.min(12, Math.round(chars/600*12));
  const structScore = Math.min(10, paras>=3?10:paras===2?6:3);
  const langScore = Math.min(14, 6 + (hasDesc?4:0) + (chars>400?4:0));
  const thinkScore = Math.min(14, 6 + (hasLogic?5:0) + (chars>500?3:0));
  const dims = [
    { name:'内容立意', score:lenScore, max:12 },
    { name:'结构完整', score:structScore, max:10 },
    { name:'语言表达', score:langScore, max:14 },
    { name:'思维深度', score:thinkScore, max:14 },
  ];
  const total = dims.reduce((a,d)=>a+d.score,0);
  let comment, advice;
  if(total>=42){ comment='立意鲜明，结构完整，描写生动、语言有感染力，是一篇优秀习作。'; advice='可进一步锤炼细节，追求个性化表达。'; }
  else if(total>=34){ comment='中心明确，内容较充实，语句通顺，达到二类文水平。'; advice='建议增加细节描写与逻辑衔接词，提升语言表现力。'; }
  else if(total>=26){ comment='基本切题，但内容略单薄、存在少量语病。'; advice='扩充素材、理顺段落，注意标点与句式。'; }
  else { comment='偏离题意或内容过少，需重新构思。'; advice='先列提纲，明确中心，再围绕中心选材。'; }
  const report = $('#essayReport'); if(!report) return;
  report.innerHTML = `
    <div class="grade-report">
      <div class="grade-total">${total}<span style="font-size:14px">/50</span> <span class="muted" style="font-size:12px">依据：${crit?crit.title:'默认标准'}</span></div>
      ${dims.map(d=>`
        <div class="flex between mt8"><span>${d.name}</span>
          <span class="bar" style="flex:1;margin:0 10px"><i style="width:${d.score/d.max*100}%"></i></span>
          <span class="muted">${d.score}/${d.max}</span></div>`).join('')}
      <div class="mt12"><b>评语：</b>${comment}</div>
      <div class="mt8"><b>修改建议：</b>${advice}</div>
    </div>
    <div class="flex gap8 mt12"><button class="btn sm" data-action="saveEssayGrade" data-total="${total}">保存批改</button></div>`;
}

// ---------- 通用：图片 OCR（复用联网引擎，离线降级）----------
async function ocrImageFile(f){
  await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js','Tesseract',{integrity:TESSACT_SRI});
  if(typeof Tesseract==='undefined') throw new Error('OCR 引擎未加载');
  const { data } = await Tesseract.recognize(f, 'chi_sim+eng');
  return data.text || '';
}
function normText(s){ return (s||'').replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g,''); }
function diffChinese(correct, user){
  const c = normText(correct), u = normText(user);
  let matched=0, html=''; const n = Math.max(c.length, u.length);
  for(let i=0;i<n;i++){
    const cu=c[i], uu=u[i];
    if(uu===undefined) html+=`<span class="diff-miss">∅</span>`;
    else if(uu===cu){ matched++; html+=`<span class="diff-ok">${escapeHtml(uu)}</span>`; }
    else html+=`<span class="diff-bad">${escapeHtml(uu)}</span>`;
  }
  const score = c.length ? Math.round(matched/c.length*100) : 0;
  return { html, score, total:c.length, matched };
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
// 属性上下文转义（用于 class / data-* 等双引号属性值，防属性型 XSS）
function escapeAttr(s){ return escapeHtml(s); }
// 允许写回 localStorage 的应用自身键白名单（导入/恢复时拒绝未知键，阻断键注入）
const LS_WHITELIST = ['yu_todo_done','yu_todos','yu_sites','yu_hw','yu_lesson_plans','yu_schedule','yu_periods','yu_class_remind','yu_agent_cfg','yu_agent_reminders','yu_comments','yu_bg','yuyu_api_base','yuyu_avatar','yuyu_name','yu_github_cfg','yu_github_last'];

// 凭据加密会话（P2）：GitHub Token / 大模型 Key 以 AES-GCM 加密落盘，明文仅存于本次会话内存
// 解密只在「解锁」时异步发生一次；之后 loadGithubCfg/loadAgentCfg 同步返回明文令牌，调用点无需改动
const SECRET = {
  gh:null, ag:null, hasEnc:false, unlocked:true,
  init(){
    try{
      const g=JSON.parse(localStorage.getItem('yu_github_cfg')||'null');
      const a=JSON.parse(localStorage.getItem(AGENT_CFG_KEY)||'null');
      this.hasEnc = !!(g&&g.enc===true) || !!(a&&a.enc===true);
    }catch(e){ this.hasEnc=false; }
    this.gh=null; this.ag=null; this.unlocked=!this.hasEnc; // 无加密则默认“已解锁”
  },
  async unlock(pass){
    if(!YuCrypto.supported()){ toast('当前环境不支持 Web Crypto（需 https/localhost）'); return false; }
    const g=JSON.parse(localStorage.getItem('yu_github_cfg')||'null');
    const a=JSON.parse(localStorage.getItem(AGENT_CFG_KEY)||'null');
    let ok=true;
    if(g&&g.enc===true){ try{ this.gh=await YuCrypto.decrypt(g.token,pass); }catch(e){ ok=false; this.gh=null; } }
    if(a&&a.enc===true){ try{ this.ag=await YuCrypto.decrypt(a.key,pass); }catch(e){ ok=false; this.ag=null; } }
    this.unlocked = ok && this.hasEnc;
    return this.unlocked;
  },
  // 保存时按需加密：有口令则加密并标记 enc，同时把明文缓存进会话
  async seal(plaintext, pass){
    if(pass){
      const env = await YuCrypto.encrypt(plaintext, pass);
      this.unlocked = true;
      return { value: env, enc: true };
    }
    return { value: plaintext, enc: false };
  },
  state(){ return !this.hasEnc ? 'none' : (this.unlocked ? 'unlocked' : 'locked'); }
};

// 一课一标·新课标对应工具：根据学段渲染右侧对应面板
function renderCsTarget(grade, unit, stage){
  const cs = DB.csByStage?.[stage] || ['对应学段','内容要求文本'];
  const tk = DB.stageTask?.[stage] || { tasks:['通用'], tips:['按学段特点组织教学'] };
  return `
    <div class="muted" style="font-size:12px;margin-bottom:8px">所属板块 · 学段对应</div>
    <div class="cs-tag-row">
      <span class="tag" style="background:var(--accent-soft);color:var(--accent-strong);font-weight:600">📘 ${escapeHtml(grade||'')} · ${escapeHtml(unit||'')}</span>
      <span class="tag green">🎯 ${escapeHtml(cs[0])}</span>
    </div>
    <div class="cs-block"><b>内容要求</b><div class="muted" style="font-size:13px;line-height:1.7;margin-top:4px">${escapeHtml(cs[1])}</div></div>
    <div class="cs-block"><b>相关学习任务群</b>
      <div class="chips mt8">${(tk.tasks||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
    </div>
    <div class="cs-block"><b>教学建议</b>
      <div class="muted" style="font-size:12.5px;line-height:1.85">${(tk.tips||[]).map((t,i)=>`• ${escapeHtml(t)}`).join('<br>')}</div>
    </div>`;
}

// 一课一标·新课标对应：选课文切换右侧
function bindCsLessonSelect(){
  const sel = $('#csLessonSelect');
  const tgt = $('#csTarget');
  if(!sel || !tgt) return;
  sel.onchange = ()=>{
    const [grade, unit, stage] = (sel.value||'').split('|');
    tgt.innerHTML = renderCsTarget(grade, unit, stage || 's4');
  };
}

// 备课网址 · 本地持久化（首次自动用 DB.sites 兜底）
function loadSites(){
  try{
    const raw = localStorage.getItem('yu_sites');
    if(raw){ const arr = JSON.parse(raw); if(Array.isArray(arr)) DB.sites = arr; }
  }catch(e){}
}
function saveSites(){
  try{ localStorage.setItem('yu_sites', JSON.stringify(DB.sites||[])); }catch(e){}
}

// ---------- 作业批改数据持久化 ----------
function loadHomeworkData(){
  try{
    const raw = localStorage.getItem('yu_hw'); if(!raw) return;
    const o = JSON.parse(raw);
    if(Array.isArray(o.wordLists)) DB.wordLists=o.wordLists;
    if(Array.isArray(o.poems)) DB.poems=o.poems;
    if(Array.isArray(o.readingExs)) DB.readingExs=o.readingExs;
    if(Array.isArray(o.essayCriteria)) DB.essayCriteria=o.essayCriteria;
    if(Array.isArray(o.essayGrades)) DB.essayGrades=o.essayGrades;
  }catch(e){}
}
function saveHomework(){
  try{
    localStorage.setItem('yu_hw', JSON.stringify({
      wordLists:DB.wordLists, poems:DB.poems, readingExs:DB.readingExs,
      essayCriteria:DB.essayCriteria, essayGrades:DB.essayGrades }));
  }catch(e){}
}
// 教案：本地持久化（新建/重命名真实保存，刷新不丢）
function loadLessonPlans(){
  try{
    const raw = localStorage.getItem('yu_lesson_plans'); if(!raw) return;
    const arr = JSON.parse(raw);
    if(Array.isArray(arr)) DB.lessonPlans = arr;
  }catch(e){}
}
function saveLessonPlans(){
  try{ localStorage.setItem('yu_lesson_plans', JSON.stringify(DB.lessonPlans||[])); }catch(e){}
}

// ---------- 作业批改 · 二级目录内绑定 ----------
function bindHomeworkSub(){
  const wf=$('#wordFile'); if(wf&&!wf._b){ wf._b=1; wf.onchange=()=>importWordFile(wf); }
  const cf=$('#critFile'); if(cf&&!cf._b){ cf._b=1; cf.onchange=()=>importCritFile(cf); }
  content.querySelectorAll('.poemFile').forEach(inp=>{ if(!inp._b){ inp._b=1; inp.onchange=()=>{ const p=(DB.poems||[]).find(x=>x.id===inp.dataset.id); gradePoemOCR(p, inp.files[0]); }; } });
  const ei=$('#essayImg'); if(ei&&!ei._b){ ei._b=1; ei.onchange=()=>gradeEssayOCR(ei.files[0]); }
}

// ===== 工作台 · 二级目录子视图 =====
function dashboardSub(){ return dashTab==='calendar' ? workCalendarView() : dashTab==='safety' ? safety1530View() : dashboardOverview(); }

function lessonSub(){ return lessonTab==='sites' ? views.lessonSitesView() : lessonTab==='standard' ? views.lessonStandardView() : lessonTab==='textbook' ? views.lessonTextbookView() : views.lessonPlanView(); }

function dashboardOverview(){
  const d = DB;
  const doneSet = new Set(todayDoneIds());
  const todos = d.todos||[];
  const todoLeft = todos.filter(t=>!doneSet.has(t.id)).length;
  const tagMap = {red:'紧急',amber:'重要',blue:'评审',green:'发布',purple:'事务'};
  const prioLabel = p => ({1:'高',2:'中',3:'低'}[p]||'中');
  const prioTag = p => ({1:'red',2:'amber',3:'blue'}[p]||'blue');
  // 待办按「优先级」升序 + 「截止时间」升序自动梳理（无截止排最后）
  const sortedTodos = todos.filter(t=>!doneSet.has(t.id)).slice().sort((a,b)=>{
    const pa=(a.prio||3)-(b.prio||3); if(pa) return pa;
    const da=a.deadline||'9999-99', db=b.deadline||'9999-99'; return da<db?-1:da>db?1:0;
  });

  return `
  <!-- 教师个人课表：可编辑 · 文档上传 · 图片识别 -->
  <div class="card mb12">
    <div class="flex between center wrap gap8 mb8">
      <div class="section-title" style="margin:0">📅 我的课表</div>
      <div class="flex gap8">
        <button class="btn line sm" data-action="toggleSchedEdit">✎ 编辑课表</button>
        <button class="btn sm" data-action="importSchedule">⬆ 导入</button>
        <button class="btn line sm" data-action="schedTemplate">⬇ 模板</button>
        <input type="file" id="schedFile" accept=".csv,.xlsx,.xls,.doc,.docx,.pdf,.png,.jpg,.jpeg" hidden>
      </div>
    </div>
    <div class="muted mb8" style="font-size:12px">思思老师 · 初三(3)班 / 初二(1)班 ｜ 点「编辑课表」手动改，或「导入 Excel / 图片 OCR」批量更新（课表存本机，刷新不丢）</div>
    ${renderScheduleGrid()}
  </div>

  <!-- 今日待办 -->
  <div class="card">
    <div class="flex between mb12 wrap gap8">
      <h3 style="margin:0">📋 今日待办 <span class="tag red">${sortedTodos.length} 项</span></h3>
      <div class="flex gap8 wrap">
        <button class="btn line sm" data-action="addTodo">＋ 新增待办</button>
        <button class="btn line sm" data-action="parseNotice">✂ 拆解通知</button>
        <span class="muted" style="font-size:12px;align-self:center">点 ✓ 完成 · 按优先级/截止自动梳理</span>
      </div>
    </div>
    ${sortedTodos.length===0
      ? `<div class="todo-empty">🎉 今日待办已全部完成，奖励一朵小红花！</div>`
      : `<div class="list todo-list">${sortedTodos.map(t=>`
        <div class="row todo-row" data-id="${escapeAttr(t.id)}">
          <button class="todo-check" data-action="doneTodo" data-id="${escapeAttr(t.id)}" title="标记完成">✓</button>
          <div class="main"><div class="title">${escapeHtml(t.t)}</div>
            <div class="meta">需处理 ${escapeHtml(t.n)} 项　·　截止 ${escapeHtml(t.deadline||'未设')}　·　${prioLabel(t.prio)}优先级</div></div>
          <span class="tag ${escapeAttr(prioTag(t.prio))}">${prioLabel(t.prio)}</span>
          <span class="tag ${escapeAttr(t.tag)}">${tagMap[t.tag]||'去处理'}</span>
        </div>`).join('')}</div>`}
  </div>`;
}

// ===== 工作台 · 续命进度条（节假日放假倒计时）=====
function holidayInfo(){
  const hol = (DB.schoolHolidays||[]).slice().sort((a,b)=>a.start.localeCompare(b.start));
  const today = todayStr();
  const t = parseD(today);
  const onH = hol.find(h=> h.start <= today && h.end >= today);
  if(onH){
    const daysLeft = Math.max(0, Math.round((parseD(onH.end)-t)/86400000));
    return { onHoliday:true, name:onH.name, daysLeft, percent:100 };
  }
  const next = hol.find(h=> h.start >= today) || null;
  if(!next) return { onHoliday:false, name:'—', daysLeft:0, percent:100 };
  const past = hol.filter(h=> h.end < today);
  const segStart = past.length ? past[past.length-1].end : (DB.termStart || today);
  const total = Math.max(1, Math.round((parseD(next.start)-parseD(segStart))/86400000));
  const elapsed = Math.max(0, Math.round((t-parseD(segStart))/86400000));
  const percent = Math.min(100, Math.round(elapsed/total*100));
  const daysLeft = Math.max(0, Math.round((parseD(next.start)-t)/86400000));
  return { onHoliday:false, name:next.name, daysLeft, percent };
}

function surviveBar(){
  const h = holidayInfo();
  if(h.onHoliday){
    return `<div class="card survive">
      <div class="flex between mb8">
        <div class="survive-title">🏖 正在放假 · ${h.name}</div>
        <div class="survive-sub">还剩 ${h.daysLeft} 天，好好续命</div>
      </div>
      <div class="survive-track"><div class="survive-fill" style="width:100%"></div></div>
      <div class="survive-cap">假期进度 100% · 享受当下，语寓陪你续命</div>
    </div>`;
  }
  return `<div class="card survive">
    <div class="flex between mb8">
      <div class="survive-title">⏳ 距离【${h.name}】还有 ${h.daysLeft} 天</div>
      <div class="survive-sub">续命进度 ${h.percent}%</div>
    </div>
    <div class="survive-track"><div class="survive-fill" style="width:${h.percent}%"></div></div>
    <div class="survive-cap">再撑 ${h.daysLeft} 天就能喘口气 · 语寓陪你续命</div>
  </div>`;
}

// ===== 工作台 · 教师课表 + 上课日常提醒 =====
const WEEK_CN = ['周日','周一','周二','周三','周四','周五','周六'];
let schedEdit = false;          // 课表编辑模式开关
let schedFileInput = null;      // 课表导入 file input 引用

// 课表持久化：手动编辑 / Excel 导入结果存本地，刷新不丢
function loadSchedule(){
  try{
    const s = localStorage.getItem('yu_schedule');
    if(s){ const arr = JSON.parse(s); if(Array.isArray(arr)) DB.classSchedule = arr; }
    const p = localStorage.getItem('yu_periods');
    if(p){ const arr = JSON.parse(p); if(Array.isArray(arr) && arr.length) DB.periodTimes = arr; }
  }catch(e){}
}
function saveSchedule(){
  try{ localStorage.setItem('yu_schedule', JSON.stringify(DB.classSchedule)); }catch(e){}
  try{ localStorage.setItem('yu_periods', JSON.stringify(DB.periodTimes)); }catch(e){}
}

function loadClassRemind(){ try{ return localStorage.getItem('yu_class_remind')!=='0'; }catch(e){ return true; } }
function saveClassRemind(on){ try{ localStorage.setItem('yu_class_remind', on?'1':'0'); }catch(e){} }

// 计算「下一次上课」：从当前时刻起，未来 7 天内最早的排课
function nextClassInfo(){
  const now = new Date();
  const sched = DB.classSchedule||[];
  const tmap = {}; (DB.periodTimes||[]).forEach(x=>tmap[x.p]=x.t);
  let cands = [];
  for(let off=0; off<7; off++){
    const d = new Date(now); d.setDate(now.getDate()+off);
    const wd = ((d.getDay()+6)%7)+1; // 1=周一 … 7=周日
    if(wd>5) continue;               // 仅工作日
    sched.filter(s=>s.day===wd).forEach(s=>{
      const [h,m] = tmap[s.period].split(':').map(Number);
      const dt = new Date(d); dt.setHours(h,m,0,0);
      cands.push({ dt, s, off });
    });
  }
  cands.sort((a,b)=>a.dt-b.dt);
  return cands.find(c=>c.dt>=now) || null;
}

// ===== 上课提醒 · 右上角闹钟图标（替代原概览内嵌卡片）=====
function updateRemindIcon(){
  const icon = $('#classRemindIcon'); if(!icon) return;
  const badge = $('#remindBadge');
  const on = loadClassRemind();
  const info = nextClassInfo();
  if(!info || !on){ icon.classList.remove('active'); if(badge) badge.style.display='none'; return; }
  const now = new Date();
  const mins = Math.round((info.dt-now)/60000);
  if(mins>=0 && mins<=30){
    icon.classList.add('active');
    if(badge){ badge.style.display=''; badge.textContent = mins<=0 ? '上课' : mins+'′'; }
    const dayLabel = info.off===0 ? '今天' : info.off===1 ? '明天' : WEEK_CN[info.dt.getDay()];
    icon.title = `即将上课 · ${dayLabel} ${info.dt.getHours()}:${String(info.dt.getMinutes()).padStart(2,'0')} ｜ ${info.s.subject} ${info.s.className}`;
  } else {
    icon.classList.remove('active');
    if(badge) badge.style.display='none';
  }
}

let remindPopOpen = false;
function bindRemindIcon(){
  const icon = $('#classRemindIcon'); if(!icon || icon._bound) return;
  icon._bound = true;
  icon.onclick = (e)=>{ e.stopPropagation(); toggleRemindPop(); };
}
function toggleRemindPop(){
  const existing = $('#remindPop');
  if(existing){ existing.remove(); remindPopOpen=false; document.removeEventListener('click', closeRemindPopOutside); return; }
  const icon = $('#classRemindIcon'); if(!icon) return;
  const on = loadClassRemind();
  const info = nextClassInfo();
  let bodyHtml;
  if(!info){
    bodyHtml = '<div class="muted">近期无排课记录</div>';
  } else {
    const now = new Date();
    const mins = Math.round((info.dt-now)/60000);
    const dayLabel = info.off===0 ? '今天' : info.off===1 ? '明天' : WEEK_CN[info.dt.getDay()];
    const h = Math.floor(mins/60), mm = mins%60;
    const dur = mins>=60 ? `还有 ${h} 小时 ${mm} 分` : `还有 ${mm} 分`;
    const soon = on && mins>=0 && mins<=30;
    bodyHtml = `<div class="rp-next">
        <div class="rp-tt">⏰ 下次上课 · ${dayLabel} ${info.dt.getHours()}:${String(info.dt.getMinutes()).padStart(2,'0')}</div>
        <div class="rp-sub">${info.s.subject} · ${info.s.className} · ${info.s.room}室</div>
        <div class="rp-dur ${soon?'rp-soon':''}">${soon?'⚠ 即将开始 · '+dur:dur}${on?'（课前 30 分钟会提醒）':''}</div>
      </div>`;
  }
  const pop = el(`<div class="remind-pop" id="remindPop">
    <div class="rp-title">上课提醒</div>
    <div id="remindPopBody">${bodyHtml}</div>
    <label class="switch" title="课前 30 分钟提醒">
      <input type="checkbox" id="classRemindToggle" ${on?'checked':''}>
      <span class="slider"></span>
      <span class="switch-txt">课前30分提醒</span>
    </label>
  </div>`);
  document.body.appendChild(pop);
  const r = icon.getBoundingClientRect();
  pop.style.top = (r.bottom+8)+'px';
  pop.style.right = (window.innerWidth - r.right)+'px';
  remindPopOpen = true;
  pop.querySelector('#classRemindToggle').onclick = ()=>{
    const tg = pop.querySelector('#classRemindToggle');
    saveClassRemind(tg.checked);
    pop.remove(); remindPopOpen=false; document.removeEventListener('click', closeRemindPopOutside);
    toggleRemindPop(); updateRemindIcon();
  };
  setTimeout(()=>document.addEventListener('click', closeRemindPopOutside), 0);
}
function closeRemindPopOutside(e){
  const pop = $('#remindPop');
  if(pop && !pop.contains(e.target) && e.target.id!=='classRemindIcon'){
    pop.remove(); remindPopOpen=false; document.removeEventListener('click', closeRemindPopOutside);
  }
}
function startRemind(){
  bindRemindIcon();
  updateRemindIcon();
  if(classRemindTimer){ clearInterval(classRemindTimer); classRemindTimer=null; }
  classRemindTimer = setInterval(()=>{ updateRemindIcon(); checkAgentReminders(); }, 10000);
}

// 本周教师课表（时间网格：列=周一~周五，行=节次）。编辑模式下格子可点击修改。
function renderScheduleGrid(){
  const days = ['周一','周二','周三','周四','周五'];
  const pers = DB.periodTimes||[];
  const sched = DB.classSchedule||[];
  const wd = ((new Date().getDay()+6)%7)+1; // 1=周一 … 5=周五（周末忽略高亮）
  const cell = (p,day)=>{
    const c = sched.find(s=>s.period===p && s.day===day);
    const cls = `tt-cell ${c?'':'empty'} ${day===wd?'tt-today':''} ${schedEdit?'tt-edit':''}`;
    const inner = c
      ? `<div class="tt-subj">${c.subject}</div><div class="tt-cls">${c.className}</div><div class="tt-room">${c.room}室</div>`
      : `<div class="tt-plus">${schedEdit?'＋':''}</div>`;
    const act = schedEdit ? ` data-action="editCell" data-day="${day}" data-period="${p}"` : '';
    return `<td class="${cls}"${act}>${inner}</td>`;
  };
  return `<div class="timetable-wrap">
    <table class="timetable">
      <thead><tr><th class="tt-time">节次</th>${days.map((d,i)=>`<th class="${i+1===wd?'tt-today':''}">${d}${i+1===wd?' · 今':''}</th>`).join('')}</tr></thead>
      <tbody>
        ${pers.map(p=>`<tr><td class="tt-time">${p.p}<br><span>${p.t}</span></td>
          ${[1,2,3,4,5].map(day=>cell(p.p,day)).join('')}</tr>`).join('')}
      </tbody>
    </table></div>`;
}

// 课表编辑 / 导入 相关交互
function bindSchedule(){
  const inp = $('#schedFile');
  if(inp && !inp._bound){ inp._bound = true; inp.onchange = (e)=>importScheduleFile(e.target.files); }
  // 编辑模式下，课表格子点击打开编辑表单 —— 由 #content 全局委托统一接管，无需逐次绑定
}

function toggleSchedEdit(){
  schedEdit = !schedEdit;
  // 仅重渲染课表卡片（保留提醒计时器与页面其余结构）
  const card = document.querySelector('.timetable-wrap')?.closest('.card');
  if(card){
    const grid = card.querySelector('.timetable-wrap');
    if(grid) grid.outerHTML = renderScheduleGrid();
    const btns = card.querySelectorAll('[data-action="toggleSchedEdit"]');
    btns.forEach(b=>{ b.className = 'btn sm ' + (schedEdit?'':'line'); b.textContent = schedEdit?'✓ 完成编辑':'✎ 编辑课表'; });
    const hint = card.querySelector('.muted.mb8');
    if(hint) hint.textContent = '思思老师 · 初三(3)班 / 初二(1)班 ｜ ' + (schedEdit?'点击任意格子可修改 / 添加课程，已排课可删除':'点「编辑课表」手动改，或「导入Excel/CSV」批量更新');
  }
  // 重新绑定新生成的格子（data-action 由通用绑定兜底，但为保险再绑一次）
  bindSchedule();
  if(schedEdit) toast('已进入编辑模式：点格子改课 / 加课');
}

function openCellEditor(day, period){
  day = Number(day); period = Number(period);
  const existing = DB.classSchedule.find(s=>s.period===period && s.day===day);
  const fields = [
    { name:'subject', label:'学科 / 课程', value: existing?existing.subject:'' },
    { name:'className', label:'班级', value: existing?existing.className:'' },
    { name:'room', label:'教室（不带"室"字）', value: existing?existing.room:'' },
  ];
  openForm({
    title: existing ? `修改课程（周${WEEK_CN[day]} · 第${period}节）` : `添加课程（周${WEEK_CN[day]} · 第${period}节）`,
    fields,
    submitText: existing ? '保存修改' : '添加课程',
    deleteText: existing ? '删除该课' : null,
    onDelete: existing ? ()=>{ deleteScheduleEntry(day, period); } : null,
    onSubmit: (v)=>{
      const subj = (v.subject||'').trim(), cls = (v.className||'').trim(), room = (v.room||'').trim().replace(/室$/,'');
      if(!subj && !cls && !room){ deleteScheduleEntry(day, period); return; }
      const idx = DB.classSchedule.findIndex(s=>s.period===period && s.day===day);
      const entry = { day, period, subject: subj||'—', className: cls||'—', room: room||'—' };
      if(idx>=0) DB.classSchedule[idx] = entry; else DB.classSchedule.push(entry);
      saveSchedule();
      const grid = document.querySelector('.timetable-wrap');
      if(grid) grid.outerHTML = renderScheduleGrid();
      bindSchedule();
      toast(existing ? '已更新课程' : '已添加课程');
    }
  });
}

function deleteScheduleEntry(day, period){
  DB.classSchedule = DB.classSchedule.filter(s=>!(s.period===Number(period) && s.day===Number(day)));
  saveSchedule();
  const grid = document.querySelector('.timetable-wrap');
  if(grid) grid.outerHTML = renderScheduleGrid();
  bindSchedule();
  toast('已删除该课');
}

// 星期名 → 数字（1=周一 … 5=周五，周末忽略）
function parseDay(v){
  if(v==null) return null;
  const s = String(v).trim();
  if(/^周[一二三四五六日]$/.test(s)) return ['一','二','三','四','五','六','日'].indexOf(s[1])+1;
  if(/^星期[一二三四五六日]$/.test(s)) return ['一','二','三','四','五','六','日'].indexOf(s[2])+1;
  const lower = s.toLowerCase();
  const map = { sun:7,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6 };
  for(const k in map){ if(lower.includes(k)) return map[k]; }
  if(/^\d{1,2}$/.test(s)){ const n=Number(s); if(n>=1&&n<=7) return n; }
  return null;
}
// 节次 → 数字（支持 "第1节"/"1"/"08:00"按时间表匹配）
function parsePeriod(v){
  if(v==null) return null;
  const s = String(v).trim();
  let m = s.match(/第\s*(\d{1,2})\s*节/); if(m) return Number(m[1]);
  m = s.match(/^(\d{1,2})$/); if(m) return Number(m[1]);
  m = s.match(/(\d{1,2}):(\d{2})/);
  if(m){ const t = m[1]+':'+m[2]; const hit = (DB.periodTimes||[]).find(p=>p.t===t); return hit?hit.p:null; }
  return null;
}

// 把二维字符串数组解析为课表条目（自动识别「列表式」或「矩阵式」）
function parseScheduleRows(rows){
  if(!rows || !rows.length) return [];
  const trim = (x)=> (x==null?'':String(x)).trim();
  const isDayHeader = (r)=> r.filter(c=>/周[一二三四五六日]|星期[一二三四五六日]|mon|tue|wed|thu|fri|sat|sun/i.test(trim(c))).length >= 2;
  // 矩阵式：首行是 周一..周五 表头
  if(isDayHeader(rows[0])){
    const days = rows[0].map(c=>parseDay(c)).map((d,i)=>({d,col:i}));
    const out = [];
    for(let r=1; r<rows.length; r++){
      const row = rows[r];
      if(!row || row.every(c=>!trim(c))) continue;
      let period = parsePeriod(row[0]);
      if(period==null) period = r; // 退路：按顺序当作第 r 节
      if(period==null || period<1 || period>12) continue;
      days.forEach(({d,col})=>{
        if(d==null || d>5) return;
        const cell = trim(row[col]);
        if(!cell) return;
        const parts = cell.split(/[\/｜|\n]/).map(s=>s.trim()).filter(Boolean);
        const subject = parts[0]||'';
        const className = parts[1]||'';
        const room = (parts[2]||'').replace(/室$/,'');
        if(!subject) return;
        out.push({ day:d, period, subject, className:className||'—', room:room||'—' });
      });
    }
    return out;
  }
  // 列表式：每行一条，列含 星期/节次/学科/班级/教室（首行可能表头）
  // 注意：表头识别只用明确的表头关键字，不要用「第N节」这类数据单元格，否则会误判数据行为表头而整行跳过
  const headers = rows[0].map(c=>trim(c));
  const colIdx = (re)=> headers.findIndex(h=>re.test(h));
  let hDay = colIdx(/星期|周几|day|week/i);
  let hPer = colIdx(/节次|节\s*次|period/i);
  let hSub = colIdx(/学科|科目|课程|subject/i);
  let hCls = colIdx(/班级|class/i);
  let hRoom = colIdx(/教室|room|地点/i);
  const hasHeader = (hDay>=0||hPer>=0||hSub>=0);
  const start = hasHeader ? 1 : 0;
  const out = [];
  for(let r=start; r<rows.length; r++){
    const row = rows[r];
    if(!row || row.every(c=>!trim(c))) continue;
    const day = parseDay(hDay>=0?row[hDay]:row[0]);
    const period = parsePeriod(hPer>=0?row[hPer]:row[1]);
    const subject = trim(hSub>=0?row[hSub]:row[2]);
    const className = trim(hCls>=0?row[hCls]:row[3]);
    const room = trim(hRoom>=0?row[hRoom]:row[4]).replace(/室$/,'');
    if(day==null || day>5 || period==null) continue;
    if(!subject) continue;
    out.push({ day, period, subject, className: className||'—', room: room||'—' });
  }
  return out;
}

function importScheduleFile(files){
  if(!files || !files.length) return;
  const f = files[0]; const name = (f.name||'').toLowerCase();
  const isCsv = name.endsWith('.csv');
  const isExcel = /\.(xlsx|xls)$/.test(name);
  const isDoc = /\.docx?$/.test(name);
  const isPdf = name.endsWith('.pdf');
  const isImg = /\.(png|jpe?g|gif|bmp|webp)$/.test(name);
  if(isCsv){
    const reader = new FileReader();
    reader.onerror = ()=>toast('文件读取失败，请重试');
    reader.onload = ()=>{
      try{
        const lines = String(reader.result).split(/\r?\n/).map(l=>l.split(',').map(s=>s.trim()));
        const rows = lines.filter(r=>r.some(c=>c!==''));
        applyScheduleRows(rows, f.name);
      }catch(e){ toast('CSV 解析失败：'+(e.message||e)); }
    };
    reader.readAsText(f);
    return;
  }
  if(isExcel){
    // Excel：用 SheetJS 解析（已离线打包 js/xlsx.full.min.js）
    const reader = new FileReader();
    reader.onerror = ()=>toast('文件读取失败，请重试');
    reader.onload = (e)=>{
      try{
        if(typeof XLSX==='undefined'){ toast('Excel 解析库未加载，请改用 CSV 上传'); return; }
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type:'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
        applyScheduleRows(rows, f.name);
      }catch(err){ toast('Excel 解析失败：'+(err.message||err)); }
    };
    reader.readAsArrayBuffer(f);
    return;
  }
  if(isImg){ importImage(f); return; }
  if(isPdf){ importPdf(f); return; }
  if(isDoc){ importDocx(f); return; }
  toast('暂不支持该格式，可用 Excel / CSV / Word / PDF / 图片，或「编辑课表」手动录入');
}

function applyScheduleRows(rows, srcName){
  const parsed = parseScheduleRows(rows);
  if(!parsed.length){ toast('未识别到课表数据，请检查格式（见「模板」）'); return; }
  commitSchedule(parsed, srcName);
}

// 统一提交：去重 + 覆盖/合并 + 持久化 + 重渲染
function commitSchedule(parsed, srcName){
  const map = {};
  parsed.forEach(p=>{ map[p.day+'_'+p.period] = p; });
  const merged = Object.values(map);
  const coverAll = merged.length >= DB.classSchedule.length*0.6;
  if(coverAll){ DB.classSchedule = merged; }
  else { DB.classSchedule = DB.classSchedule.filter(o=>!map[o.day+'_'+o.period]); DB.classSchedule = DB.classSchedule.concat(merged); }
  saveSchedule();
  const grid = document.querySelector('.timetable-wrap');
  if(grid) grid.outerHTML = renderScheduleGrid();
  bindSchedule();
  toast(`已导入 ${merged.length} 条课程（${coverAll?'覆盖原有课表':'合并追加'}）`);
}

// 把提取出的纯文本拆成二维行（供 parseScheduleRows 识别列表式 / 矩阵式）
function textToRows(text){
  const lines = String(text||'').split(/\r?\n/).map(l=>l.replace(/\s+$/,''));
  const rows = [];
  for(const line of lines){
    if(!line.trim()) continue;
    let cells;
    if(line.includes('\t')) cells = line.split('\t');
    else if(/[，,；;|｜、]/.test(line)) cells = line.split(/[，,；;|｜、]/);
    else cells = line.split(/\s{2,}|\s+/);
    rows.push(cells.map(c=>c.trim()));
  }
  return rows;
}

// 文本（来自 Word / PDF / 图片 OCR）→ 识别 → 确认弹窗
function extractScheduleFromText(text, srcName){
  const rows = textToRows(text);
  reviewScheduleModal(rows, srcName);
}

function reviewScheduleModal(rows, srcName){
  const parsed = parseScheduleRows(rows);
  if(!parsed.length){ toast('未从文件中识别到课表数据，请检查格式，或用「编辑课表」手动录入'); return; }
  const map={}; parsed.forEach(p=>map[p.day+'_'+p.period]=p); const merged=Object.values(map);
  closeForm();
  const ov = el(`<div class="modal" id="schedReview"><div class="modal-box" style="max-width:560px">
    <h3>课表识别结果 · ${srcName}</h3>
    <div class="muted" style="font-size:12px;margin-bottom:8px">已识别 ${merged.length} 条，请核对（OCR / 文本可能略有误差，确认后仍可手动编辑）。</div>
    <div class="list">${merged.map(e=>`<div class="row"><div class="main"><div class="title">周${WEEK_CN[e.day]} 第${e.period}节 · ${e.subject}</div><div class="meta">${e.className} ｜ ${e.room}室</div></div></div>`).join('')}</div>
    <div class="modal-actions"><button class="btn line" id="srCancel">取消</button><button class="btn" id="srConfirm">确认导入</button></div>
  </div></div>`);
  document.body.appendChild(ov);
  ov.onclick=(e)=>{ if(e.target===ov) ov.remove(); };
  ov.querySelector('#srCancel').onclick=()=>ov.remove();
  ov.querySelector('#srConfirm').onclick=()=>{ ov.remove(); commitSchedule(merged, srcName); };
}

// 懒加载外部解析引擎（Word / PDF / 图片），失败则优雅提示
const TESSACT_SRI='sha384-1zP4ZOtlk2FXAOiUArpMuWf7INJJKe/ROfYFAVSeUa11DEfXdKWGiPI3dVma2Gt0'; // tesseract.js@5.1.0 锁定版本的 SRI（防 CDN 篡改 RCE）
function loadScript(src, winKey, opts){
  opts = opts || {};
  return new Promise((resolve,reject)=>{
    if(winKey && window[winKey]!==undefined){ resolve(window[winKey]); return; }
    const s=document.createElement('script'); s.src=src; s.async=true;
    if(opts.integrity){ s.setAttribute('integrity', opts.integrity); s.setAttribute('crossorigin','anonymous'); } // SRI 校验需 anonymous CORS
    s.onload=()=>resolve(window[winKey]!==undefined?window[winKey]:true);
    s.onerror=()=>reject(new Error('解析引擎加载失败（需联网或校验不通过）：'+src));
    document.head.appendChild(s);
  });
}

async function importDocx(f){
  toast('正在解析 Word 文档…');
  try{
    await loadScript('js/vendor/mammoth.browser.min.js','mammoth');
    if(typeof mammoth==='undefined') throw new Error('Word 解析引擎未加载');
    const buf = await f.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer: buf });
    extractScheduleFromText(res.value, f.name);
  }catch(e){ toast('Word 解析失败，请改用 Excel / CSV 或手动录入：'+(e.message||e)); }
}

async function importPdf(f){
  toast('正在解析 PDF…');
  try{
    await loadScript('js/vendor/pdfjs/pdf.min.js','pdfjsLib');
    if(typeof pdfjsLib==='undefined') throw new Error('PDF 解析引擎未加载');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/vendor/pdfjs/pdf.worker.min.js';
    const buf = await f.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    let text='';
    for(let i=1;i<=doc.numPages;i++){
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      text += tc.items.map(it=>it.str).join(' ') + '\n';
    }
    extractScheduleFromText(text, f.name);
  }catch(e){ toast('PDF 解析失败，请改用 Excel / CSV 或手动录入：'+(e.message||e)); }
}

async function importImage(f){
  toast('正在识别图片（OCR，首次较慢）…');
  try{
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js','Tesseract',{integrity:TESSACT_SRI});
    if(typeof Tesseract==='undefined') throw new Error('OCR 引擎未加载');
    const { data } = await Tesseract.recognize(f, 'chi_sim+eng');
    extractScheduleFromText(data.text, f.name);
  }catch(e){ toast('图片识别失败，请改用 Excel / CSV 或手动录入：'+(e.message||e)); }
}

function downloadSchedTemplate(){
  const header = '星期,节次,学科,班级,教室\n';
  const sample = [
    '周一,1,语文,初三(3)班,301',
    '周一,3,语文,初二(1)班,208',
    '周二,2,语文,初三(3)班,301',
    '周五,8,班会,初三(3)班,301',
  ].join('\n');
  const csv = '﻿' + header + sample; // BOM 保证 Excel 中文不乱码
  try{
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el(`<a href="${url}" download="语寓_课表模板.csv"></a>`);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
    toast('课表模板已下载（CSV，Excel 可直接打开）');
  }catch(e){ toast('下载失败：'+(e.message||e)); }
}

// ===== 工作台 · 工作日历（可上传校园工作日历）=====
const EV_CLS = { '考试':'exam','教研':'teach','班务':'class','校务':'school' };

function workCalendarView(){
  if(!calMonth) calMonth = todayStr().slice(0,7);
  const evs = DB.calendarEvents||[];
  const hol = DB.schoolHolidays||[];
  const [y,m] = calMonth.split('-').map(Number);
  const ym = y+'-'+String(m).padStart(2,'0');
  const first = new Date(y, m-1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startW = (first.getDay()+6)%7; // 周一为每周首列
  let cells = [];
  for(let i=0;i<startW;i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(d);
  while(cells.length % 7 !== 0) cells.push(null);
  const wd = ['一','二','三','四','五','六','日'];
  return `
    <div class="flex between mb12">
      <div class="section-title" style="margin:0">📅 工作日历（校园工作日历）</div>
      <div class="flex gap8">
        <button class="btn line sm" id="calPrev">‹ 上月</button>
        <span class="cal-month">${y}年${m}月</span>
        <button class="btn line sm" id="calNext">下月 ›</button>
        <button class="btn sm" data-action="uploadCalendar">⬆ 上传校园工作日历</button>
      </div>
    </div>
    <div class="card">
      <div class="cal-head">${wd.map(w=>`<span>${w}</span>`).join('')}</div>
      <div class="cal-grid">${cells.map(c=>{
        if(c===null) return '<div class="cal-cell empty"></div>';
        const ds = ym+'-'+String(c).padStart(2,'0');
        const ev = evs.filter(e=>e.date===ds);
        const ho = hol.find(h=>{ const a=parseD(h.start), b=parseD(h.end), cur=parseD(ds); return cur>=a && cur<=b; });
        const isToday = ds===todayStr();
        return `<div class="cal-cell ${isToday?'today':''} ${ho?'holiday':''}">
          <div class="cal-day">${c}</div>
          ${ho?`<div class="cal-ev hol">🏖 ${ho.name}</div>`:''}
          ${ev.map(e=>`<div class="cal-ev ${escapeAttr(EV_CLS[e.type]||'school')}">${escapeHtml(e.title)}</div>`).join('')}
        </div>`;
      }).join('')}</div>
      <div class="muted mt12" style="font-size:12px">点击"上传校园工作日历"可导入 CSV（日期,主题,类型）或 Excel（演示解析）；校历假期以绿色高亮显示。</div>
    </div>
    <input type="file" id="calFile" accept=".csv,.xlsx,.xls" style="display:none">`;
}

function rerenderCalendar(){ const sub=$('#dashSub'); if(sub){ sub.innerHTML=workCalendarView(); bindCalendar(); } }

function bindCalendar(){
  const prev=$('#calPrev'), next=$('#calNext');
  const shift = (delta)=>{ let [y,m]=calMonth.split('-').map(Number); m+=delta;
    if(m<1){ m=12; y--; } else if(m>12){ m=1; y++; } calMonth = y+'-'+String(m).padStart(2,'0'); rerenderCalendar(); };
  if(prev) prev.onclick=()=>shift(-1);
  if(next) next.onclick=()=>shift(1);
  const inp=$('#calFile');
  if(inp) inp.onchange=(e)=>importCalendarFile(e.target.files);
}

function importCalendarFile(files){
  if(!files || !files.length) return;
  const f = files[0]; const name = (f.name||'').toLowerCase();
  if(name.endsWith('.csv')){
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const lines = String(reader.result).split(/\r?\n/).filter(l=>l.trim());
        let added=0;
        lines.forEach((ln,i)=>{
          const p = ln.split(',').map(s=>s.trim());
          if(i===0 && /日期|date|主题|title|名称/i.test(p[0])) return; // 跳过表头
          if(p.length<2) return;
          const [date,title,type] = p;
          if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
          DB.calendarEvents.push({ date, title, type: type||'校务' });
          added++;
        });
        toast(`校园工作日历：已导入 ${added} 条`);
        rerenderCalendar();
      }catch(e){ toast('解析失败，请检查 CSV 格式（日期,主题,类型）'); }
    };
    reader.readAsText(f);
  } else {
    const demo = [
      { date: todayStr(), title:'（演示）校园开放日', type:'校务' },
      { date: calMonth+'-15', title:'（演示）阶段性月考', type:'考试' },
    ];
    DB.calendarEvents.push(...demo);
    toast(`校园工作日历：已识别 ${demo.length} 条（Excel 演示解析）`);
    rerenderCalendar();
  }
}

function safety1530View(){
  const recs = safetyData;
  const cnt = t => recs.filter(r=>r.type===t).length;
  const types=[['全部',''],['每日1分钟','每日1分钟'],['每周5分钟','每周5分钟'],['节假日30分钟','节假日30分钟']];
  const typeColor={ '每日1分钟':'blue', '每周5分钟':'green', '节假日30分钟':'amber' };
  return `
    <div class="flex between center gap8">
      <div class="section-title" style="margin:0">🛡 1530 安全教育</div>
      <button class="btn" data-action="addSafety">+ 新增教育记录</button>
    </div>
    <div class="muted mb12" style="font-size:12px">每日放学前 1 分钟 · 每周五 5 分钟 · 节假日前 30 分钟，留痕可查、家校可溯</div>
    <div class="card mb12" style="padding:10px 14px">
      <div class="flex between center gap8 wrap">
        <div class="flex gap8 wrap" id="fSafe">${types.map((t,i)=>`<span class="pill ${i==0?'active':''}" data-v="${t[1]}">${t[0]}${t[1]?` ${cnt(t[1])}`:''}</span>`).join('')}</div>
        <span class="muted" style="font-size:12px;white-space:nowrap">共 ${recs.length} 条</span>
      </div>
    </div>
    <div class="safe-remind" id="safeReminders" style="display:none"></div>
    <div class="card">
      <div class="list" id="safeList">
        ${recs.map((r,i)=>`<div class="row talk" data-type="${r.type}">
          <div class="main">
            <div class="title">${r.theme} · <span class="tag ${typeColor[r.type]}">${r.type}</span></div>
            <div class="meta">🕒 ${r.date} · 记录人 ${r.teacher||'林老师'}</div>
            <div class="meta">教育内容：${r.content}</div>
          </div>
          <button class="btn line sm del-safe" data-idx="${i}" data-id="${r.id||''}">删除</button>
        </div>`).join('')}
      </div>
    </div>`;
}

function rerenderSafety(){ const sub=$('#dashSub'); if(sub){ sub.innerHTML=safety1530View(); bindSafetyFilter(); bindSafety(); } }

async function refreshSafety(){
  const data = await API.listSafety();
  if(Array.isArray(data)){ safetyData = data.map(r=>({ id:r.id, type:r.type, date:r.date, theme:r.theme, content:r.content, teacher:r.teacher })); }
  rerenderSafety(); refreshReminders();
}

async function refreshReminders(){
  const box=$('#safeReminders'); if(!box) return;
  const data = await API.getReminders(todayStr());
  if(data && Array.isArray(data.reminders) && data.reminders.length){
    const color = k => k==='节假日30分钟' ? 'amber' : k==='每周5分钟' ? 'green' : 'blue';
    box.style.display='';
    box.innerHTML = `<div class="safe-remind-head">🔔 本周提醒（${data.reminders.length} 项）</div>
      <div class="list mt8" style="gap:6px">${data.reminders.map(r=>`<div class="row" style="padding:8px 10px">
        <div class="main"><div class="title">${r.title}</div><div class="meta">应完成日期：${r.due} · ${r.note}</div></div>
        <span class="tag ${color(r.kind)}">${r.kind}</span></div>`).join('')}</div>`;
  } else {
    box.style.display='none';
    box.innerHTML='';
  }
}

function bindSafety(){
  document.querySelectorAll('#safeList .del-safe').forEach(btn=>{
    btn.onclick = async ()=>{
      const idx=+btn.dataset.idx, id=btn.dataset.id;
      try{
        if(id) await API.deleteSafety(id); else safetyData.splice(idx,1);
        toast('工作台：记录已删除');
      }catch(e){ safetyData.splice(idx,1); toast('工作台：离线演示，已本地删除'); }
      rerenderSafety();
    };
  });
}

function openSafetyForm(){
  openForm({
    title:'新增 1530 安全教育记录', submitText:'保存到后端',
    fields:[
      { name:'type', label:'类型', type:'select', options:['每日1分钟','每周5分钟','节假日30分钟'], value:'每日1分钟' },
      { name:'date', label:'日期', type:'date', value: todayStr() },
      { name:'theme', label:'教育主题', type:'text', value:'' },
      { name:'content', label:'教育内容', type:'textarea', value:'' },
      { name:'teacher', label:'记录人', type:'text', value:'思思老师' },
    ],
    onSubmit: async (d)=>{
      if(!d.theme || !d.content) throw new Error('请填写主题与内容');
      await API.login('lin@school.cn','123456');
      try{
        await API.createSafety(d);
        toast('工作台：安全教育记录已保存到真实后端');
        await refreshSafety();
      }catch(e){
        safetyData.unshift({ id:'', type:d.type, date:d.date, theme:d.theme, content:d.content, teacher:d.teacher });
        toast('工作台：离线演示，已暂存到本地');
        rerenderSafety();
      }
    }
  });
}

// ===== 班主任工作 · 主题班会记录（接真实后端）=====
function meetingView(){
  const recs = meetingData;
  return `
    <div class="flex between mb12" style="flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">📝 主题班会记录（${recs.length} 条）</div>
      <div class="flex gap8">
        <button class="btn line" data-action="exportDoc" data-type="hr-meeting">⬇ 导出文档</button>
        <button class="btn" data-action="addMeeting">+ 新增班会记录</button>
      </div>
    </div>
    <div class="card">
      <div class="list" id="meetList">
        ${recs.map((m,i)=>`<div class="row talk" data-type="meeting">
          <div class="main">
            <div class="title">${m.theme} · <span class="tag purple">${m.date}</span></div>
            <div class="meta">主持：${m.host||'林老师'}</div>
            <div class="meta">内容：${m.content||'—'}</div>
            ${m.summary?`<div class="meta">小结：${m.summary}</div>`:''}
          </div>
          <button class="btn line sm del-meet" data-idx="${i}" data-id="${m.id||''}">删除</button>
        </div>`).join('')}
      </div>
      <div class="muted mt16" style="font-size:12px">主题班会记录由真实后端保存（离线时回退本地演示）。每周一系统自动提醒召开主题班会。</div>
    </div>`;
}

function rerenderMeeting(){ const sub=$('#homeSub'); if(sub){ sub.innerHTML=meetingView(); bindMeeting(); } }

async function refreshMeeting(){
  const data = await API.listMeetings();
  if(Array.isArray(data)){ meetingData = data.map(m=>({ id:m.id, theme:m.theme, date:m.date, host:m.host, content:m.content, summary:m.summary })); }
  rerenderMeeting();
}

function bindMeeting(){
  document.querySelectorAll('#meetList .del-meet').forEach(btn=>{
    btn.onclick = async ()=>{
      const idx=+btn.dataset.idx, id=btn.dataset.id;
      try{ if(id) await API.deleteMeeting(id); else meetingData.splice(idx,1); toast('班主任：班会记录已删除'); }
      catch(e){ meetingData.splice(idx,1); toast('班主任：离线演示，已本地删除'); }
      rerenderMeeting();
    };
  });
}

function openMeetingForm(){
  openForm({
    title:'新增主题班会记录', submitText:'保存到后端',
    fields:[
      { name:'theme', label:'班会主题', type:'text', value:'' },
      { name:'date', label:'日期', type:'date', value: todayStr() },
      { name:'host', label:'主持人', type:'text', value:'思思老师' },
      { name:'content', label:'班会内容', type:'textarea', value:'' },
      { name:'summary', label:'成效小结', type:'textarea', value:'' },
    ],
    onSubmit: async (d)=>{
      if(!d.theme) throw new Error('请填写班会主题');
      await API.login('lin@school.cn','123456');
      try{
        await API.createMeeting(d);
        toast('班主任：主题班会记录已保存到真实后端');
        const data = await API.listMeetings();
        if(Array.isArray(data)) meetingData = data.map(m=>({ id:m.id, theme:m.theme, date:m.date, host:m.host, content:m.content, summary:m.summary }));
        if(homeTab==='meeting') rerenderMeeting();
      }catch(e){
        meetingData.unshift({ id:'', theme:d.theme, date:d.date, host:d.host, content:d.content, summary:d.summary });
        toast('班主任：离线演示，已暂存到本地');
        if(homeTab==='meeting') rerenderMeeting();
      }
    }
  });
}

// ===== 班级学情 · 二级目录子视图 =====
function analyticsSub(){
  if(analyticsTab==='talk') return talkRecordsView();
  if(analyticsTab==='monthly'||analyticsTab==='mid'||analyticsTab==='final') return examView(analyticsTab);
  if(analyticsTab==='query') return scoreQueryView();
  return analyticsOverview();
}

function analyticsOverview(){
  const c = DB.classScores;
  const maxC = Math.max(...c.distribution.map(d=>d.c));
  return `
    <div class="flex between mb12"><div class="section-title">◔ ${c.name} · 学情仪表盘</div>
      <button class="btn line" data-action="importScore">⬇ 导入成绩(Excel)</button></div>
    <div class="grid cols-4 mb12">
      <div class="card stat"><div class="num">${c.avg}</div><div class="lbl">班级均分</div></div>
      <div class="card stat"><div class="num">${c.pass}%</div><div class="lbl">及格率</div></div>
      <div class="card stat"><div class="num">${c.excellent}%</div><div class="lbl">优秀率</div></div>
      <div class="card stat"><div class="num down">论证逻辑</div><div class="lbl">最薄弱维度</div></div>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <div class="flex between"><h3>📊 成绩分布</h3>${expBtn('ana-dist')}</div>
        <div class="small-chart mt16">
          ${c.distribution.map(d=>`<div class="col"><div class="b" style="height:${d.c/maxC*100}%"></div><div class="x">${d.r}</div><div class="x">${d.c}人</div></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="flex between"><h3>🎯 核心素养雷达（班级均值）</h3>${expBtn('ana-radar')}</div>
        ${radarSVG(c.radar)}
      </div>
    </div>
    <div class="grid cols-2 mt16">
      <div class="card">
        <div class="flex between"><h3>🔻 知识点薄弱排行（推送复习包）</h3>${expBtn('ana-weak')}</div>
        <div class="list mt16">
          ${c.weak.map(w=>`
            <div class="row"><div class="main"><div class="title">${w.k}</div></div>
              <div class="bar" style="width:140px"><i style="width:${w.v}%;background:${w.v<60?'var(--brand)':'var(--amber)'}"></i></div>
              <span class="muted">${w.v}%</span></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="flex between"><h3>👤 学生个体诊断</h3>${expBtn('ana-student')}</div>
        <table class="mt16"><thead><tr><th>学生</th><th>语言</th><th>思维</th><th>审美</th><th>文化</th><th></th></tr></thead>
        <tbody>${DB.students.map(s=>`
          <tr><td><b>${escapeHtml(s.name)}</b></td><td>${escapeHtml(s.lang)}</td><td class="${s.think<60?'down':''}">${escapeHtml(s.think)}</td>
            <td>${escapeHtml(s.aesthetic)}</td><td>${escapeHtml(s.culture)}</td>
            <td><span class="tag ${s.trend=='up'?'green':'red'}">${s.trend=='up'?'↑进步':'↓预警'}</span></td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>`;
}

// 成绩：计算总分并排名
function rankRows(rows){
  const withTot = rows.map(r=>({ ...r, total:Object.values(r.s).reduce((a,b)=>a+b,0) }));
  withTot.sort((a,b)=>b.total-a.total);
  return withTot.map((r,i)=>({ ...r, rank:i+1 }));
}

function examView(key){
  const ex = DB.examScores[key];
  const ranked = rankRows(ex.rows);
  const totals = ranked.map(r=>r.total);
  const avg = Math.round(totals.reduce((a,b)=>a+b,0)/totals.length);
  const max = Math.max(...totals);
  const passLine = Math.round(620*0.6);
  const passRate = Math.round(totals.filter(t=>t>=passLine).length/totals.length*100);
  const langAvg = Math.round(ranked.reduce((a,r)=>a+r.s['语文'],0)/ranked.length);
  const sub = DB.examSubjects;
  return `
    <div class="flex between mb12" style="flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">📊 ${ex.name} · 初三(3)班（${ex.date}）</div>
      <div class="flex gap8">
        <label class="btn line" for="examFile">⬆ 导入成绩</label>
        <button class="btn" data-action="exportDoc" data-type="ana-exam" data-key="${key}">⬇ 导出成绩文档</button>
        <input type="file" id="examFile" accept=".xlsx,.xls,.pdf,image/*" style="display:none">
      </div>
    </div>
    <div class="grid cols-4 mb12">
      <div class="card stat"><div class="num">${avg}</div><div class="lbl">班级均分（总分）</div></div>
      <div class="card stat"><div class="num">${max}</div><div class="lbl">最高分</div></div>
      <div class="card stat"><div class="num">${langAvg}</div><div class="lbl">语文均分</div></div>
      <div class="card stat"><div class="num">${passRate}%</div><div class="lbl">及格率（≥60%）</div></div>
    </div>
    <div class="card">
      <div class="table-scroll">
        <table class="mt16"><thead><tr><th>班名</th><th>姓名</th>${sub.map(s=>`<th>${s}</th>`).join('')}<th>总分</th></tr></thead>
        <tbody>${ranked.map(r=>`<tr><td><b>${r.rank}</b></td><td><b>${r.name}</b></td>${sub.map(s=>`<td>${r.s[s]}</td>`).join('')}<td><b>${r.total}</b></td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="muted mt16" style="font-size:12px">导入支持 Excel / 图片（OCR）/ PDF（演示解析）；实际部署须按《个人信息保护法》加密存储成绩、按角色授权访问</div>
    </div>`;
}

function scoreQueryView(){
  const ex = DB.examScores;
  return `
    <div class="flex between mb12">
      <div class="section-title" style="margin:0">🔎 成绩查询（家长 / 学生自助）</div>
      <a class="btn line sm" href="score-query.html" target="_blank">↗ 独立查询页（可分享）</a>
    </div>
    <div class="card mb12">
      <div class="muted mb12" style="font-size:12px">输入学生姓名与「私密查询码」，仅可查看该生本人成绩。查询码为随机令牌（不可由身份证号推导），由老师离线发放，请勿公开。</div>
      <div class="flex gap12 wrap" style="align-items:flex-end">
        <div class="field" style="min-width:160px"><label>考试类型</label>
          <select id="qExam">
            <option value="monthly">${ex.monthly.name}</option>
            <option value="mid">${ex.mid.name}</option>
            <option value="final">${ex.final.name}</option>
          </select></div>
        <div class="field" style="min-width:160px"><label>学生姓名</label><input id="qName" placeholder="如 王思远"></div>
        <div class="field" style="min-width:160px"><label>私密查询码</label><input id="qCode" placeholder="如 W2S8X4MD"></div>
        <button class="btn" data-action="queryScore">查询</button>
      </div>
      <div class="muted mt12" style="font-size:12px">演示查询码：王思远 / W2S8X4MD。⚠️ 演示数据随站点公开，真实环境请勿将学生成绩置于公开静态站点，应通过私密后端按权限下发。</div>
    </div>
    <div id="scoreResult"></div>`;
}

function scoreResultCard(examKey, r){
  const ex = DB.examScores[examKey];
  const sub = DB.examSubjects;
  return `
    <div class="card">
      <div class="flex between mb12">
        <div class="section-title" style="margin:0">📄 ${escapeHtml(ex.name)} · ${escapeHtml(r.name)} 成绩</div>
        <span class="tag blue">班名 ${escapeHtml(r.rank)} / ${ex.rows.length}</span>
      </div>
      <table class="mt16"><thead><tr><th>科目</th>${sub.map(s=>`<th>${escapeHtml(s)}</th>`).join('')}<th>总分</th></tr></thead>
        <tbody><tr><td><b>得分</b></td>${sub.map(s=>`<td>${escapeHtml(r.s[s])}</td>`).join('')}<td><b>${escapeHtml(r.total)}</b></td></tr></tbody></table>
      <div class="muted mt12" style="font-size:12px">查询结果仅本人可见；学校留存原始成绩用于学情分析</div>
    </div>`;
}

function talkRecordsView(){
  const types=[['全部',''],['学习提升','学习提升'],['家校沟通','家校沟通'],['素养品行','素养品行'],['心理健康','心理健康']];
  const typeColor={ '学习提升':'blue', '家校沟通':'green', '素养品行':'purple', '心理健康':'amber' };
  return `
    <div class="flex between mb12" style="flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">💬 学生谈心谈话记录（${DB.talkRecords.length} 条）</div>
      <div class="flex gap8">
        <button class="btn line" data-action="exportDoc" data-type="ana-talk">⬇ 导出文档</button>
        <button class="btn" data-action="addTalk">+ 新增谈话</button>
      </div>
    </div>
    <div class="card mb12">
      <div class="flex gap8 wrap" id="fTalk">${types.map((t,i)=>`<span class="pill ${i==0?'active':''}" data-v="${t[1]}">${t[0]}</span>`).join('')}</div>
    </div>
    <div class="card">
      <div class="list" id="talkList">
        ${DB.talkRecords.map((r,i)=>talkRow(r,typeColor)).join('')}
      </div>
      <div class="muted mt16" style="font-size:12px">四类谈话（学习提升 / 家校沟通 / 素养品行 / 心理健康）按《中小学心理健康教育指导纲要》留痕，保护学生隐私</div>
    </div>`;
}

function talkRow(r,typeColor){
  return `<div class="row talk" data-type="${escapeAttr(r.type)}">
    <div class="main">
      <div class="title">${escapeHtml(r.target)} · <span class="tag ${escapeAttr(typeColor[r.type])}">${escapeHtml(r.type)}</span> · <span class="muted" style="font-weight:400">${escapeHtml(r.method)}</span></div>
      <div class="meta">🕒 ${escapeHtml(r.date)}</div>
      <div class="meta">谈话内容：${escapeHtml(r.content)}</div>
      <div class="meta">反馈效果：${escapeHtml(r.effect)}</div>
    </div>
  </div>`;
}

// ===== 班主任工作 · 二级目录子视图 =====
// ===== 班主任工作 · 文档素材智能生成（按需撰写常用文档初稿）=====
const DOC_GEN = [
  { key:'plan', icon:'📅', title:'班主任工作计划', desc:'学期/月度班主任工作规划',
    fields:[
      {name:'term',label:'学期/阶段',type:'text',value:'2026 学年第二学期'},
      {name:'cls',label:'所带班级',type:'text',value:'初三(3)班'},
      {name:'focus',label:'工作重点（逐条换行）',type:'textarea',rows:4},
      {name:'goal',label:'学期目标',type:'textarea',rows:3},
    ],
    build:d=>({ name:'班主任工作计划_'+(d.cls||''), title:'班主任工作计划 · '+(d.cls||''),
      sections:[['一、基本情况', (d.term||'')+' · '+(d.cls||'')],['二、工作重点', d.focus],['三、学期目标', d.goal]] }) },
  { key:'summary', icon:'📋', title:'工作总结', desc:'学期/年度工作回顾与改进',
    fields:[
      {name:'term',label:'学期/阶段',type:'text',value:'2026 学年第二学期'},
      {name:'cls',label:'所带班级',type:'text',value:'初三(3)班'},
      {name:'done',label:'完成的主要工作（逐条换行）',type:'textarea',rows:4},
      {name:'lack',label:'存在不足与改进方向',type:'textarea',rows:3},
    ],
    build:d=>({ name:'班主任工作总结_'+(d.cls||''), title:'班主任工作总结 · '+(d.cls||''),
      sections:[['一、工作回顾', d.done],['二、存在不足', d.lack],['三、下学期改进', '（待补充）']] }) },
  { key:'analysis', icon:'📊', title:'班级学情分析报告', desc:'基于成绩与表现的班级诊断',
    fields:[
      {name:'cls',label:'班级',type:'text',value:'初三(3)班'},
      {name:'avg',label:'平均分',type:'text',value:'92.4'},
      {name:'pass',label:'及格率',type:'text',value:'100%'},
      {name:'excellent',label:'优秀率',type:'text',value:'44%'},
      {name:'problem',label:'主要问题（逐条换行）',type:'textarea',rows:4},
      {name:'measure',label:'改进措施（逐条换行）',type:'textarea',rows:4},
    ],
    build:d=>({ name:'班级学情分析报告_'+(d.cls||''), title:'班级学情分析报告 · '+(d.cls||''),
      sections:[['一、班级概况', (d.cls||'')+'：平均分 '+(d.avg||'')+'，及格率 '+(d.pass||'')+'，优秀率 '+(d.excellent||'')],['二、主要问题', d.problem],['三、改进措施', d.measure]] }) },
  { key:'comment', icon:'🪪', title:'学生期末操行评语', desc:'单名学生操行评语（可补充）',
    fields:[
      {name:'student',label:'学生',type:'select',options:DB.students.map(s=>s.name)},
      {name:'extra',label:'补充亮点 / 个性化建议（可选）',type:'textarea',rows:3},
    ],
    build:d=>{ const s=DB.students.find(x=>x.name===d.student)||DB.students[0]; const base=buildComment(s); const txt=base+(d.extra?('\n\n补充说明：'+d.extra):''); return { name:'操行评语_'+(s.name||''), title:'操行评语 · '+(s.name||''), sections:[['操行评语', txt]] }; } },
  { key:'incident', icon:'⚠️', title:'突发事件情况说明', desc:'校园突发事件规范说明',
    fields:[
      {name:'event',label:'事件概述',type:'textarea',rows:2},
      {name:'time',label:'发生时间',type:'text',value:'2026-08-xx'},
      {name:'place',label:'地点',type:'text'},
      {name:'people',label:'涉及人员',type:'text'},
      {name:'process',label:'事件经过',type:'textarea',rows:3},
      {name:'handling',label:'处置情况',type:'textarea',rows:3},
      {name:'follow',label:'后续跟进',type:'textarea',rows:2},
    ],
    build:d=>({ name:'突发事件情况说明', title:'突发事件情况说明',
      sections:[['一、事件概述', d.event],['二、时间/地点/人员', '时间：'+(d.time||'')+'\n地点：'+(d.place||'')+'\n涉及人员：'+(d.people||'')],['三、事件经过', d.process],['四、处置情况', d.handling],['五、后续跟进', d.follow]] }) },
  { key:'meeting', icon:'🗣', title:'班会提纲', desc:'主题班会方案框架',
    fields:[
      {name:'theme',label:'班会主题',type:'text'},
      {name:'time',label:'时间',type:'text',value:'2026-08-xx'},
      {name:'aim',label:'班会目标',type:'textarea',rows:2},
      {name:'flow',label:'流程安排（逐行）',type:'textarea',rows:4},
    ],
    build:d=>({ name:'班会提纲_'+(d.theme||''), title:'班会提纲 · '+(d.theme||''),
      sections:[['一、班会主题', d.theme],['二、时间', d.time],['三、班会目标', d.aim],['四、流程安排', d.flow]] }) },
  { key:'report', icon:'📨', title:'汇报材料初稿', desc:'上交各类汇报材料',
    fields:[
      {name:'name',label:'材料名称',type:'text'},
      {name:'to',label:'报送单位',type:'text'},
      {name:'points',label:'内容要点（逐行）',type:'textarea',rows:4},
      {name:'deadline',label:'报送时限',type:'text'},
    ],
    build:d=>({ name:'汇报材料_'+(d.name||''), title:'汇报材料 · '+(d.name||''),
      sections:[['一、材料名称', d.name],['二、报送单位', d.to],['三、内容要点', d.points],['四、报送时限', d.deadline]] }) },
];
function docSections(sections){
  return (sections||[]).map(([h,b])=>`<h2 style="font-size:15px;color:#27384a;margin:18px 0 8px;border-left:4px solid #6ea8dc;padding-left:8px">${escapeHtml(h)}</h2><div style="font-size:13px;line-height:1.9;white-space:pre-wrap">${escapeHtml(b||'（待补充）')}</div>`).join('');
}
async function enhanceDocWithAgent(title, r){
  try{
    const cfg=loadAgentCfg(); if(!cfg||!cfg.key) return r;
    const sys='你是初中语文班主任「思思老师」的助手。请对以下文档各小节内容做规范化润色，形成更自然、得体的学校公文/汇报文稿；保持事实与数据不变，不虚构，每节 200 字以内。';
    const out=[];
    for(const sec of (r.sections||[])){
      const [h,b]=sec;
      const u=(cfg.base||'https://api.openai.com/v1')+'/chat/completions';
      const resp=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},body:JSON.stringify({model:cfg.model||'gpt-4o-mini',messages:[{role:'system',content:sys},{role:'user',content:h+'：\n'+(b||'')}]})});
      const j=await resp.json(); const ai=resp&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;
      out.push([h, ai?ai.trim():b]);
    }
    return { name:r.name, title:r.title, sections:out };
  }catch(e){ return r; }
}
function openDocGenForm(key){
  const cfg=DOC_GEN.find(x=>x.key===key); if(!cfg) return;
  openForm({ title:'📝 '+cfg.title, submitText:'生成并下载', fields:[
    ...cfg.fields,
    { name:'ai', label:'', type:'checkbox', checkLabel:'用智能体（挖挖）润色为更自然的文稿' },
  ], onSubmit:async (d)=>{
    let r=cfg.build(d);
    if(d.ai){ toast('正在用挖挖润色文稿…'); r=await enhanceDocWithAgent(cfg.title, r); }
    downloadDoc(r.name, r.title, docSections(r.sections));
  }});
}
function docGenView(){
  return `
    <div class="section-title mb12">📝 文档素材智能生成</div>
    <div class="muted mb12" style="font-size:12px">按需撰写班主任常用文档初稿：填关键字段即可生成可下载的 Word 文档；勾选「智能体润色」可由挖挖生成更自然的文稿。</div>
    <div class="grid cols-3">
      ${DOC_GEN.map(d=>`
        <div class="card res" data-action="openDocGen" data-key="${d.key}" title="生成「${d.title}」">
          <div class="res-ico" style="background:var(--accent-soft)">${d.icon}</div>
          <h3 style="margin:12px 0 6px;font-size:15px">${d.title}</h3>
          <div class="muted" style="font-size:13px;line-height:1.6">${d.desc}</div>
          <div class="res-open">生成初稿 →</div>
        </div>`).join('')}
    </div>`;
}

function homeroomSub(){ return homeTab==='docs' ? docGenView() : homeTab==='students' ? studentInfoView() : homeTab==='aid' ? studentAidView() : homeTab==='committee' ? classCommitteeView() : homeTab==='meeting' ? meetingView() : homeroomOverview(); }

function homeroomOverview(){
  return `
    <div class="grid cols-2 mb12">
      <div class="card">
        <div class="flex between"><h3>📋 班级量化（本周）</h3>${expBtn('hr-quant')}</div>
        <table class="mt16"><thead><tr><th>班级</th><th>出勤</th><th>作业</th><th>纪律</th><th>值日</th><th>总分</th></tr></thead>
        <tbody>${DB.quant.map(q=>`
          <tr><td><b>${q.name}</b></td><td>${q.attend}</td><td>${q.homework}</td><td>${q.discipline}</td><td>${q.duty}</td><td><b>${q.total}</b></td></tr>`).join('')}
        </tbody></table>
      </div>
      <div class="card">
        <div class="flex between"><h3>📣 家校通知</h3>${expBtn('hr-notice')}</div>
        <div class="list mt16">
          ${DB.notices.map(n=>`
            <div class="row"><div class="main"><div class="title">${n.t}</div>
              <div class="meta">${n.to} · 签收 ${n.signed}/${n.total}</div></div>
              <span class="tag ${n.status=='已发布'?'green':'amber'}">${n.status}</span></div>`).join('')}
        </div>
        <button class="btn mt16" data-action="newNotice">+ 发布通知</button>
      </div>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <div class="flex between"><h3>🌱 学生成长档案（过程性）</h3>${expBtn('hr-archive')}</div>
        <div class="list mt16">
          ${DB.archive.map(a=>`
            <div class="row"><div class="main"><div class="title">${a.name}</div>
              <div class="meta">品德：${a.品德}</div>
              <div class="meta">学业：${a.学业}</div>
              <div class="meta">体美劳：${a.体美劳}</div></div>
              <button class="btn line sm" data-action="genComment">生成评语草稿</button></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="flex between"><h3>🗂 事务台账（减负）</h3>${expBtn('hr-ledger')}</div>
        <div class="list mt16">
          <div class="row"><div class="main"><div class="title">安全排查记录表</div><div class="meta">模板化 · 本周已填</div></div><span class="tag green">已完成</span></div>
          <div class="row"><div class="main"><div class="title">主题班会记录</div><div class="meta">模板化 · 待填</div></div><button class="btn line sm" data-action="addMeeting">填写</button></div>
          <div class="row"><div class="main"><div class="title">值班排表</div><div class="meta">自动生成 · 可调整</div></div><span class="tag blue">已生成</span></div>
        </div>
        <div class="muted mt16" style="font-size:12px">台账模板化 + 自动汇总，减少重复填表内耗</div>
      </div>
    </div>
    <div class="card mb12">
      <div class="flex between center wrap gap8 mb8">
        <div class="section-title" style="margin:0">🪪 操行评语生成</div>
        <div class="flex gap8">
          <button class="btn line sm" data-action="genAllComments">🤖 一键生成全班评语</button>
          <button class="btn sm" data-action="exportComments" ${DB.students.length?'':'disabled'}>⬇ 导出全班评语(.doc)</button>
        </div>
      </div>
      <div class="muted mb12" style="font-size:12px">依据学生日常表现积分与学业成绩（语言 / 思维 / 审美 / 文化）自动撰写个性化操行评语，可逐人预览、编辑、导出。</div>
      <div class="list">
        ${DB.students.map((s,i)=>`
          <div class="row">
            <div class="lp-ico">${['📄','📝','🎬','🌟','💡'][i%5]}</div>
            <div class="main">
              <div class="title">${escapeHtml(s.name)} <span class="tag ${s.trend=='up'?'green':'red'}">${s.trend=='up'?'↑进步':'↓预警'}</span> <span class="tag blue">积分 ${escapeHtml(s.conduct)}</span></div>
              <div class="meta">语言 ${escapeHtml(s.lang)} · 思维 ${escapeHtml(s.think)} · 审美 ${escapeHtml(s.aesthetic)} · 文化 ${escapeHtml(s.culture)}</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn line sm" data-action="genComment" data-id="${s.name}">${s.comment?'重新生成':'生成评语'}</button>
              <button class="btn line sm" data-action="editComment" data-id="${s.name}" ${s.comment?'':'disabled'}>预览/编辑</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ===== 班主任工作 · 班级概览 · 操行评语生成（依据日常积分 + 学业成绩）=====
function loadComments(){ try{ const s=localStorage.getItem('yu_comments'); if(s){ const m=JSON.parse(s); DB.students.forEach(st=>{ if(m[st.name]!=null) st.comment=m[st.name]; }); } }catch(e){} }
function saveComments(){ try{ const m={}; DB.students.forEach(st=>{ if(st.comment) m[st.name]=st.comment; }); localStorage.setItem('yu_comments', JSON.stringify(m)); }catch(e){} }
function buildComment(s){
  const arr=[['语言表达',s.lang],['思维能力',s.think],['审美创造',s.aesthetic],['文化自信',s.culture]];
  const strong=arr.slice().sort((a,b)=>b[1]-a[1])[0], weak=arr.slice().sort((a,b)=>a[1]-b[1])[0];
  const conductTxt = s.conduct>=90?'表现优秀，是同学们的榜样':s.conduct>=80?'表现良好，踏实稳重':s.conduct>=70?'表现端正，仍有提升空间':'需要更多关注与引导';
  const trendTxt = s.trend==='up'?'本学期进步明显，学习状态积极向上，值得肯定':'当前学业上仍需加把劲，期待你实现更大突破';
  return s.name+'同学：你平日操行'+conductTxt+'，日常表现积分达 '+s.conduct+' 分。学业方面，你的「'+strong[0]+'」素养尤为突出（'+strong[1]+' 分），在班级中表现亮眼；「'+weak[0]+'」相对薄弱（'+weak[1]+' 分），是下一步提升的重点。'+(s.hl?('特别值得一提的是，'+s.hl+'。'):'')+trendTxt+'。希望继续保持 '+strong[0]+' 的优势，有针对性地补强 '+weak[0]+'，努力成为更全面、更自信的自己。\n——班主任：思思老师';
}
async function enhanceCommentWithAgent(s, base){
  try{
    const cfg = loadAgentCfg();
    if(!cfg || !(cfg.key || (cfg.relay&&cfg.relay.trim()))) return base;
    const sys='你是初中语文班主任「思思老师」的助手。请把下面这段操行评语草稿，润色为更自然、有温度、符合初中生身份的期末操行评语，保留所有事实（积分、成绩、亮点），不要虚构，300字以内。';
    const data = await agentChat(cfg, {model:cfg.model||'gpt-4o-mini', messages:[{role:'system',content:sys},{role:'user',content:base}]});
    const ai=data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
    return ai?ai.trim():base;
  }catch(e){ return base; }
}
function openCommentEditor(s){
  const base=buildComment(s);
  openForm({ title:'🪪 操行评语 · '+s.name, submitText:'保存评语', fields:[
    { name:'comment', label:'评语内容（可编辑）', type:'textarea', value:base, rows:8 },
    { name:'ai', label:'', type:'checkbox', checkLabel:'用智能体（挖挖）润色为更自然的评语' },
  ], onSubmit:async (d)=>{
    let txt=d.comment||base;
    if(d.ai){ toast('正在用挖挖润色评语…'); txt=await enhanceCommentWithAgent(s, txt); }
    s.comment=txt; saveComments();
    const sub=$('#homeSub'); if(sub) sub.innerHTML=homeroomSub();
    toast('已保存 '+s.name+' 的操行评语');
  }});
}
function genComment(name){
  const s=DB.students.find(x=>x.name===name)||DB.archive.find(x=>x.name===name);
  if(!s){ toast('未找到该学生'); return; }
  openCommentEditor(s);
}
function genAllComments(){
  DB.students.forEach(s=>{ s.comment=buildComment(s); });
  saveComments();
  const sub=$('#homeSub'); if(sub) sub.innerHTML=homeroomSub();
  toast('已为全班 '+DB.students.length+' 名学生生成操行评语，可逐人预览/编辑');
}
function editComment(name){
  const s=DB.students.find(x=>x.name===name); if(!s){ toast('未找到该学生'); return; }
  if(!s.comment){ toast('请先生成评语'); return; }
  openCommentEditor(s);
}
function exportComments(){
  const html='<div style="white-space:pre-wrap;line-height:1.9;font-size:13px">'+DB.students.map(s=>'<p style="margin:0 0 14px"><b>'+escapeHtml(s.name)+'</b>：'+escapeHtml(s.comment||'(未生成)')+'</p>').join('')+'</div>';
  downloadDoc('操行评语_初三3班', '操行评语 · 初三(3)班（'+DB.students.length+' 人）', html);
}

function studentInfoView(){
  return `
    <div class="flex between mb12" style="flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">👥 学生信息 · 初三(3)班（${DB.studentInfo.length} 人）</div>
      <div class="flex gap8">
        <input class="search" id="stuSearch" placeholder="搜索姓名 / 学籍号">
        <button class="btn line" data-action="exportDoc" data-type="hr-students">⬇ 导出文档</button>
        <button class="btn" data-action="addStudent">+ 新增学生</button>
      </div>
    </div>
    <div class="card upload-bar mb12">
      <div class="flex center gap8 wrap">
        <label class="btn line" for="stuFile">⬆ 上传录入（Excel / Word / 图片 / PDF）</label>
        <input type="file" id="stuFile" accept=".xls,.xlsx,.doc,.docx,.png,.jpg,.jpeg,.pdf" multiple hidden>
        <span class="tag">📄 Excel</span><span class="tag">📝 Word</span><span class="tag">🖼 图片 OCR</span><span class="tag">📕 PDF</span>
        <span class="muted" style="font-size:12px">选择文件后自动解析并录入学生信息（演示）</span>
      </div>
    </div>
    <div class="card">
      <div class="table-scroll">
        <table class="mt16"><thead><tr>
          <th>姓名</th><th>性别</th><th>身份证号</th><th>民族</th><th>学籍号</th>
          <th>家庭地址</th><th>社保卡号</th><th>父母名字</th><th>联系号码</th><th>父母身份证号</th><th>学生状态</th>
        </tr></thead>
        <tbody id="stuBody">${DB.studentInfo.map(s=>studentRow(s)).join('')}</tbody>
        </table>
      </div>
      <div class="muted mt16" style="font-size:12px">含敏感字段，仅班主任可见；演示数据已脱敏，实际部署须按《个人信息保护法》加密存储、最小授权</div>
    </div>`;
}

function studentRow(s){
  const st = s.status==='在读' ? 'green' : (s.status==='休学'||s.status==='转学') ? 'amber' : 'blue';
  return `<tr>
    <td><b>${escapeHtml(s.name)}</b></td><td>${escapeHtml(s.gender)}</td><td class="mono">${escapeHtml(s.idNo)}</td>
    <td>${escapeHtml(s.nation)}</td><td class="mono">${escapeHtml(s.stuNo)}</td><td>${escapeHtml(s.address)}</td>
    <td class="mono">${escapeHtml(s.ssCard)}</td><td>${escapeHtml(s.parents)}</td><td class="mono">${escapeHtml(s.phone)}</td>
    <td class="mono">${escapeHtml(s.parentId)}</td>
    <td><span class="tag ${escapeAttr(st)}">${escapeHtml(s.status)}</span></td></tr>`;
}

function studentAidView(){
  return `
    <div class="flex between mb12" style="flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">🤝 学生资助 · 初三(3)班（${DB.studentAid.length} 人）</div>
      <div class="flex gap8">
        <button class="btn line" data-action="exportDoc" data-type="hr-aid">⬇ 导出文档</button>
        <button class="btn" data-action="addAid">+ 新增资助</button>
      </div>
    </div>
    <div class="card">
      <div class="table-scroll">
        <table class="mt16"><thead><tr>
          <th>姓名</th><th>家庭成员</th><th>身份证号码</th><th>联系电话</th><th>资助状态</th>
        </tr></thead>
        <tbody>${DB.studentAid.map(s=>studentAidRow(s)).join('')}</tbody>
        </table>
      </div>
      <div class="muted mt16" style="font-size:12px">资助信息含敏感字段，仅班主任 / 资助管理员可见；演示数据已脱敏，实际须加密存储并依规上报</div>
    </div>`;
}

function studentAidRow(s){
  const st = s.status==='已认定' ? 'green' : s.status==='待审核' ? 'amber' : 'blue';
  return `<tr>
    <td><b>${escapeHtml(s.name)}</b></td>
    <td>${escapeHtml(s.family)}</td>
    <td class="mono">${escapeHtml(s.idNo)}</td>
    <td class="mono">${escapeHtml(s.phone)}</td>
    <td><span class="tag ${escapeAttr(st)}">${escapeHtml(s.status)}</span></td></tr>`;
}

function classCommitteeView(){
  const c = DB.classCommittee;
  const leaderIcon = { '班长':'🧭', '副班长':'🤝', '学习委员':'📚', '纪律委员':'🛡', '劳动委员':'🧹', '心理健康委员':'💗' };
  return `
    <div class="flex between mb12" style="flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">🏛 班委设置 · 初三(3)班</div>
      <div class="flex gap8">
        <button class="btn line" data-action="exportDoc" data-type="hr-committee">⬇ 导出文档</button>
        <button class="btn" data-action="editCommittee">✎ 编辑班委</button>
      </div>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <h3>👥 班委成员（六大委员）</h3>
        <div class="list mt16">
          ${c.leaders.map(l=>`
            <div class="row"><div class="main">
              <div class="title">${leaderIcon[l.role]||'•'} ${escapeHtml(l.role)}</div>
              <div class="meta">任职：<b>${escapeHtml(l.holder)}</b></div>
              <div class="meta">职责：${escapeHtml(l.note)}</div>
            </div>
            <button class="btn line sm" data-action="editCommittee">调整</button></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h3>📝 各科课代表</h3>
        <div class="kpi-row mt16 wrap" style="gap:10px">
          ${c.subjectReps.map(r=>`<span class="tag blue" style="font-size:13px">${escapeHtml(r.subject)} · ${escapeHtml(r.holder)}</span>`).join('')}
        </div>
        <div class="muted mt16" style="font-size:12px">课代表可由学科教师与学习委员协同调整；班委任期一般每学期民主改选一次</div>
        <div class="card" style="background:var(--accent-soft);margin-top:16px">
          <div class="stat"><div class="num">${c.leaders.length + c.subjectReps.length}</div><div class="lbl">班委岗位总数</div></div>
          <div class="stat mt16"><div class="num">${new Set([...c.leaders.map(l=>l.holder), ...c.subjectReps.map(r=>r.holder)]).size}</div><div class="lbl">参与任职同学（人）</div></div>
        </div>
      </div>
    </div>`;
}

// 学生信息：上传文件（Excel/Word/图片/PDF）自动解析录入（原型演示）
function bindStudentImport(){
  const inp=$('#stuFile'); if(!inp) return;
  inp.onchange=()=>importStudentFile(inp);
}
function importStudentFile(inp){
  const files=[...inp.files]; if(!files.length) return;
  const demo=[
    { name:"钱多多", gender:"男", idNo:"3301022012****1024", nation:"汉", stuNo:"G330102201210241024",
      address:"城东街道东湖路9号", ssCard:"A3301****1024", parents:"钱进 / 周慧", phone:"138****1024",
      parentId:"3301021980****5512", status:"在读" },
    { name:"孙悦", gender:"女", idNo:"3301022011****0517", nation:"汉", stuNo:"G330102201105170517",
      address:"城南街道南园路33号", ssCard:"A3301****0517", parents:"孙斌 / 吴敏", phone:"139****0517",
      parentId:"3301021981****6623", status:"在读" },
    { name:"周子涵", gender:"男", idNo:"3301022012****0829", nation:"苗", stuNo:"G330102201208290829",
      address:"城北街道北辰路7号", ssCard:"A3301****0829", parents:"周强 / 郑霞", phone:"137****0829",
      parentId:"3301021979****7731", status:"转学" },
  ];
  const added=Math.min(files.length, demo.length);
  for(let i=0;i<added;i++) DB.studentInfo.push(demo[i]);
  $('#homeSub').innerHTML=studentInfoView();
  bindStudentSearch(); bindStudentImport();
  const types=files.map(f=>(f.name.split('.').pop()||'文件').toUpperCase()).join(' / ');
  toast(`学生信息：${types} 解析完成，已自动录入 ${added} 条（演示）`);
  inp.value='';
}

// 考试成绩：导入（Excel/图片/PDF）自动解析录入（原型演示）
function bindExamImport(){
  const inp=$('#examFile'); if(!inp) return;
  inp.onchange=()=>importExamFile(inp);
}
function importExamFile(inp){
  const files=[...inp.files]; if(!files.length) return;
  const demo=[
    { name:"新同学A", code:"NXA1D3K7", s:{语文:100,数学:102,英语:98,物理:82,道法:42,历史:43,体育:56} },
    { name:"新同学B", code:"NXB2F8M4", s:{语文:96,数学:99,英语:95,物理:79,道法:41,历史:40,体育:54} },
  ];
  const cur = DB.examScores[analyticsTab].rows;
  demo.forEach(r=>cur.push(r));
  $('#anaSub').innerHTML = examView(analyticsTab);
  bindExamImport();
  const types = files.map(f=>(f.name.split('.').pop()||'文件').toUpperCase()).join(' / ');
  toast(`成绩导入（${types}）：已解析并录入 ${Math.min(files.length,demo.length)} 条（演示）`);
  inp.value='';
}

// 成绩查询（家长/学生自助）：姓名 + 私密查询码（随机令牌，不可推导/不可枚举）
function bindScoreQuery(){
  const btn = content.querySelector('[data-action="queryScore"]'); if(!btn) return;
  btn.onclick = ()=>{
    const exam = document.getElementById('qExam').value;
    const name = (document.getElementById('qName').value||'').trim();
    const code = (document.getElementById('qCode').value||'').trim().toUpperCase();
    if(!name || !code){ toast('请填写姓名与私密查询码'); return; }
    const ranked = rankRows(DB.examScores[exam].rows);
    const r = ranked.find(x=>x.name===name && (x.code||'').toUpperCase()===code);
    const box = document.getElementById('scoreResult');
    if(!r){ box.innerHTML = `<div class="card"><div class="muted">未查询到匹配记录，请核对姓名与私密查询码。</div></div>`; return; }
    box.innerHTML = scoreResultCard(exam, r);
  };
}

// 雷达图 SVG
function radarSVG(data){
  const cx=130, cy=110, R=80, n=data.length;
  const pt=(i,r)=>{const a=-Math.PI/2 + i*2*Math.PI/n; return [cx+r*Math.cos(a), cy+r*Math.sin(a)];};
  const grid=[0.25,0.5,0.75,1].map(g=>{
    const p=data.map((d,i)=>pt(i,R*g).join(',')).join(' ');
    return `<polygon points="${p}" fill="none" stroke="#e7ebf0" />`;}).join('');
  const axis=data.map((d,i)=>{const [x,y]=pt(i,R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#eef1f5"/>`+
    `<text x="${pt(i,R+16)[0]}" y="${pt(i,R+16)[1]}" font-size="10" fill="#6b7686" text-anchor="middle">${d.d}</text>`;}).join('');
  const val=data.map((d,i)=>pt(i,R*d.v/100).join(',')).join(' ');
  const dots=data.map((d,i)=>{const [x,y]=pt(i,R*d.v/100);return `<circle cx="${x}" cy="${y}" r="3" fill="#5bbdcf"/>`;}).join('');
  return `<svg viewBox="0 0 260 230" width="100%" height="200">
    ${grid}${axis}<polygon points="${val}" fill="rgba(91,189,207,.18)" stroke="#5bbdcf" stroke-width="2"/>${dots}</svg>`;
}

// 页面横幅图标（主色统一走 :root 浅蓝，不再按页换色）
const PAGE_THEME = {
  dashboard:{ ico:'▦' },
  lesson:   { ico:'✎' },
  homework: { ico:'✓' },
  resource: { ico:'❖' },
  analytics:{ ico:'◔' },
  homeroom: { ico:'⌂' },
  honor:    { ico:'🏅' },
  settings: { ico:'⚙' },
};

// 渲染
function render(view){
  currentView = view;
  const t = PAGE_THEME[view] || PAGE_THEME.dashboard;
  $('#viewTitle').textContent = titles[view] || '工作台';
  content.innerHTML = `<div class="page-banner"><span class="pb-ico">${t.ico}</span><span>${titles[view]||'工作台'}</span></div>`
    + (views[view]||views.dashboard)();
  bindView(view);
  updateTodoBadge();
}
// 顶部待办角标：实时同步未完成数（不再写死）
function updateTodoBadge(){
  const b = document.querySelector('#todoBtn .badge');
  if(!b) return;
  const left = (DB.todos||[]).filter(t=>!(todayDoneIds()).includes(t.id)).length;
  b.textContent = left;
  b.style.display = left ? '' : 'none';
}
// 顶部全局搜索：遍历待办/教案/素材/学生，下拉展示并跳转
const SEARCH_POOL = [
  { src:'todos',     view:'dashboard', ico:'📌', get:()=> (DB.todos||[]).map(x=>({ k:x.t })),
    viewLabel:'工作台' },
  { src:'lessonPlans', view:'lesson',   ico:'📘', get:()=> (DB.lessonPlans||[]).map(x=>({ k:x.title })),
    viewLabel:'备课中心' },
  { src:'assignments', view:'homework', ico:'✓', get:()=> (DB.assignments||[]).map(x=>({ k:x.title })),
    viewLabel:'作业批改' },
  { src:'resources', view:'resource',  ico:'📁', get:()=> (DB.resources||[]).map(x=>({ k:x.title })),
    viewLabel:'素材资源库' },
  { src:'honors',   view:'honor',     ico:'🏅', get:()=> (DB.honors||[]).map(x=>({ k:x.title })),
    viewLabel:'荣誉登记册' },
  { src:'notices',  view:'homeroom',  ico:'📋', get:()=> (DB.notices||[]).map(x=>({ k:x.t })),
    viewLabel:'班主任工作' },
  { src:'students', view:'homeroom',  ico:'👤', get:()=> (DB.students||[]).map(x=>({ k:x.name })),
    viewLabel:'班主任工作' },
  { src:'examScores', view:'analytics', ico:'📊', get:()=>{
      const s=new Set(); (DB.examScores?Object.values(DB.examScores):[]).forEach(e=>(e.rows||[]).forEach(r=>s.add(r.name)));
      return [...s].map(k=>({ k }));
    }, viewLabel:'班级学情' },
];
function bindGlobalSearch(){
  const inp = $('#globalSearch'), drop = $('#searchDrop');
  if(!inp || !drop) return;
  const close = ()=>{ drop.style.display='none'; };
  inp.addEventListener('input', ()=>{
    const q = inp.value.trim().toLowerCase();
    if(!q){ close(); return; }
    const hits = [];
    SEARCH_POOL.forEach(s=>{
      (s.get()||[]).forEach((it,i)=>{
        if(it.k && it.k.toLowerCase().includes(q)){
          hits.push({ label:it.k, view:s.view, ico:s.ico, sub:s.viewLabel, n: hits.length });
          if(hits.length>=10) return;
        }
      });
    });
    if(!hits.length){ drop.innerHTML = `<div class="search-empty">未找到「${inp.value.trim()}」</div>`; drop.style.display='block'; return; }
    drop.innerHTML = hits.map(h=>`
      <div class="search-item" data-action="gotoSearch" data-view="${h.view}" data-k="${h.label.replace(/"/g,'&quot;')}">
        <span class="search-ico">${h.ico}</span>
        <div class="search-txt"><div class="search-name">${escapeHtml(h.label)}</div><div class="search-sub">${h.sub}</div></div>
      </div>`).join('');
    drop.style.display='block';
  });
  inp.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  document.addEventListener('click', e=>{
    if(!e.target.closest('.topbar-search')) close();
  });
}
function toast(msg){ const t=el(`<div class="toast">${msg}</div>`); document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show')); setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},1600); }

// 通用表单弹窗（新增安全记录 / 班会记录 复用）
function openForm({ title, fields, submitText='保存', onSubmit, deleteText=null, onDelete=null }){
  closeForm();
  const delBtn = (deleteText && onDelete) ? `<button class="btn danger line" id="modalDelete">${deleteText}</button>` : '';
  const overlay = el(`<div class="modal" id="modal"><div class="modal-box">
    <h3>${title}</h3><div class="modal-fields"></div>
    <div class="modal-actions"><button class="btn line" id="modalCancel">取消</button>
      ${delBtn}<button class="btn" id="modalSubmit">${submitText}</button></div></div></div>`);
  const fwrap = overlay.querySelector('.modal-fields');
  fields.forEach(f=>{
    const wrap = el('<div class="modal-field"></div>');
    wrap.appendChild(el(`<label>${f.label}</label>`));
    let ctrl;
    if(f.type==='textarea') ctrl = el(`<textarea class="field" rows="${f.rows||3}" placeholder="${f.label}"></textarea>`);
    else if(f.type==='select') ctrl = el(`<select class="field">${f.options.map(o=>`<option ${o===f.value?'selected':''}>${o}</option>`).join('')}</select>`);
    else if(f.type==='file') ctrl = el(`<input class="field" type="file" multiple accept="${f.accept||''}">`);
    else if(f.type==='checkbox') ctrl = el(`<label class="modal-check"><input type="checkbox" ${f.value?'checked':''}> ${f.checkLabel||''}</label>`);
    else ctrl = el(`<input class="field" type="${f.type||'text'}" value="${f.value||''}" placeholder="${f.label}">`);
    wrap.appendChild(ctrl); fwrap.appendChild(wrap); f._ctrl = ctrl;
  });
  document.body.appendChild(overlay);
  overlay.onclick = (e)=>{ if(e.target===overlay) closeForm(); };
  overlay.querySelector('#modalCancel').onclick = closeForm;
  const del = overlay.querySelector('#modalDelete');
  if(del) del.onclick = async ()=>{ try{ await onDelete(); }catch(e){ toast('删除失败：'+(e.message||e)); } closeForm(); };
  overlay.querySelector('#modalSubmit').onclick = async ()=>{
    const payload = {}; fields.forEach(f=>{ payload[f.name] = (f.type==='file') ? f._ctrl.files : (f.type==='checkbox') ? f._ctrl.querySelector('input').checked : f._ctrl.value; });
    const btn = overlay.querySelector('#modalSubmit');
    btn.disabled = true; btn.textContent = '保存中…';
    try{ await onSubmit(payload); closeForm(); }
    catch(e){ btn.disabled = false; btn.textContent = submitText; toast('保存失败：' + (e.message||e)); }
  };
}
function closeForm(){ const m = $('#modal'); if(m) m.remove(); }

// 进入备课台 · 网站选择面板（用户勾选后再跳转，避免一次性全开造成无效加载）
function openUnitPicker(unitName, sites){
  const overlay = el(`<div class="modal" id="modal"><div class="modal-box" style="width:520px;max-width:94vw">
    <h3>进入备课台 · 选择要打开的网站</h3>
    <div class="muted" style="font-size:13px;margin-top:6px">单元：<b>${escapeHtml(unitName||'—')}</b>　·　已聚合 ${sites.length} 个备课资源，勾选需要的再打开，避免一次性全开无效加载</div>
    <div class="unit-pick-list" id="unitPickList">
      ${sites.map((s,i)=>`<div class="unit-pick-item" data-i="${i}">
        <span class="unit-pick-check">✓</span>
        <span class="unit-pick-ico">${s.ico||'🔗'}</span>
        <span class="unit-pick-main"><span class="unit-pick-name">${escapeHtml(s.name)}</span><span class="unit-pick-url">${escapeHtml((s.url||'').replace(/^https?:\/\//,''))}</span></span>
        <button class="unit-pick-open" data-open="${i}">单独打开 ↗</button>
      </div>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn line" id="unitPickAll">全选</button>
      <span style="flex:1"></span>
      <button class="btn line" id="modalCancel">取消</button>
      <button class="btn" id="unitPickGo" disabled>打开所选（0）</button>
    </div></div></div>`);
  document.body.appendChild(overlay);
  overlay.onclick = (e)=>{ if(e.target===overlay) closeForm(); };
  const list = overlay.querySelector('#unitPickList');
  const goBtn = overlay.querySelector('#unitPickGo');
  const allBtn = overlay.querySelector('#unitPickAll');
  const sel = new Set();
  const items = [...list.querySelectorAll('.unit-pick-item')];
  const sync = ()=>{
    items.forEach(it=> it.classList.toggle('on', sel.has(+it.dataset.i)));
    goBtn.textContent = '打开所选（'+sel.size+'）';
    goBtn.disabled = sel.size===0;
  };
  items.forEach(it=>{
    it.onclick = (e)=>{
      if(e.target.closest('[data-open]')) return;
      const i = +it.dataset.i;
      if(sel.has(i)) sel.delete(i); else sel.add(i);
      sync();
    };
  });
  list.querySelectorAll('[data-open]').forEach(btn=>{
    btn.onclick = (e)=>{ e.stopPropagation(); const i=+btn.dataset.open; closeForm(); try{ window.open(sites[i].url,'_blank','noopener'); }catch(e){} };
  });
  allBtn.onclick = ()=>{ if(sel.size===items.length) sel.clear(); else items.forEach(it=>sel.add(+it.dataset.i)); sync(); };
  overlay.querySelector('#modalCancel').onclick = closeForm;
  goBtn.onclick = ()=>{
    if(!sel.size) return;
    const picked = [...sel].sort((a,b)=>a-b).map(i=>sites[i]);
    closeForm();
    toast('正在打开 '+picked.length+' 个备课网站…');
    picked.forEach((s,i)=> setTimeout(()=>{ try{ window.open(s.url,'_blank','noopener'); }catch(e){} }, i*150));
  };
  sync();
}

// ===== 备课中心 · 上传资料 → 自动识别梳理教案 =====
// 从文本/文件名识别教案字段（前端模板，离线可用）
function draftLessonFromText(text, filename){
  const lines = (text||'').split(/\r?\n+/).map(s=>s.trim()).filter(Boolean);
  let topic = (filename||'').replace(/\.[^.]+$/,'');
  if(!topic && lines[0]) topic = lines[0].slice(0,40);
  const objLine  = lines.find(l=>/目标|目的|要求|素养/.test(l)) || '';
  const hardLine = lines.find(l=>/重点|难点|关键|突破/.test(l)) || '';
  const proc = lines.filter(l=> l!==topic && !/目标|目的|要求|素养|重点|难点|关键|突破/.test(l)).slice(0,15);
  return { title: topic||'未命名教案', obj: objLine||'（请补充教学目标）', note: [hardLine, ...proc].filter(Boolean).join('\n') };
}
// 遍历上传文件：可读文本(txt/md等)提取；docx/pdf/图片取文件名兜底；已配大模型则智能增强
// ===== 今日待办 · 新增 / 拆解学校通知（自动识别截止时间与优先级）=====
function pad2(n){ return (n<10?'0':'')+n; }
function curYear(){ return new Date().getFullYear(); }
function nearestWeekday(cn){ // 返回下一个指定星期几（一~日）的 YYYY-MM-DD
  const map={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7};
  const target=map[cn]; if(!target) return '';
  const now=new Date(); const wd=((now.getDay()+6)%7)+1; // 1=周一
  let off=(target-wd+7)%7; if(off===0) off=7;
  const d=new Date(now); d.setDate(now.getDate()+off);
  return curYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
}
function endOfMonth(){ const now=new Date(); const d=new Date(now.getFullYear(),now.getMonth()+1,0); return curYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function extractDeadline(s){
  let m;
  if(m=s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)) return m[1]+'-'+pad2(+m[2])+'-'+pad2(+m[3]);
  if(m=s.match(/(\d{1,2})月(\d{1,2})[日号]/)) return curYear()+'-'+pad2(+m[1])+'-'+pad2(+m[2]);
  if(/本月底前/.test(s)) return endOfMonth();
  if(m=s.match(/下?周([一二三四五六日])前?/)) return nearestWeekday(m[1]);
  return '';
}
function extractPrio(s){
  if(/务必|立即|紧急|尽快|马上|重点|高度重视|务必重视|立即处理/.test(s)) return 1;
  if(/提交|上报|报备|更新|完成|回收|检查|发布|填写|填报|前完成/.test(s)) return 2;
  return 3;
}
// 拆解通知文本 → 多条待办（标题 + 截止 + 优先级）
function parseNotice(text){
  if(!text||!text.trim()) return [];
  const sentences = text.split(/[。；;！!？?\r\n]+/).map(s=>s.trim()).filter(s=>s.length>=6);
  const out=[];
  sentences.forEach((s,idx)=>{
    if(/^(尊敬的|各位|各年级|各班|老师们|同学们|家长|关于|【|通知)/.test(s)) return;
    const dl=extractDeadline(s);
    const prio=extractPrio(s);
    let title=s.replace(/^(请|请各班|请各|务必|立即|尽快|于|在)/,'').replace(/[，,].*$/,'').replace(/[。；;]$/,'').slice(0,40);
    if(title.length<4) title=s.slice(0,30);
    out.push({ id:'td'+Date.now()+'_'+idx, t:title, n:1, tag: prio===1?'red':prio===2?'amber':'blue', deadline: dl||'', prio });
  });
  return out;
}
function openAddTodoForm(){
  openForm({ title:'＋ 新增今日待办', submitText:'加入待办', fields:[
    { name:'t', label:'待办内容', type:'text', placeholder:'如：批改第三单元作文' },
    { name:'deadline', label:'截止时间（如 2026-08-15，可留空）', type:'text', placeholder:'YYYY-MM-DD' },
    { name:'prio', label:'优先级', type:'select', options:['高','中','低'], value:'中' },
  ], onSubmit:(d)=>{
    if(!d.t || !d.t.trim()) throw new Error('请填写待办内容');
    const prio = d.prio==='高'?1:d.prio==='低'?3:2;
    DB.todos.unshift({ id:'td'+Date.now(), t:d.t.trim(), n:1, tag: prio===1?'red':prio===2?'amber':'blue', deadline:(d.deadline||'').trim(), prio });
    saveTodos(); render('dashboard');
    toast('已加入今日待办');
  }});
}
function openParseNotice(){
  const overlay = el(`<div class="modal" id="modal"><div class="modal-box" style="width:520px;max-width:94vw">
    <h3>✂ 拆解学校通知 → 待办清单</h3>
    <div class="muted" style="font-size:13px;margin-top:6px">粘贴学校 / 教务处通知，自动拆成多条待办，识别截止时间与优先级。</div>
    <div class="modal-fields">
      <textarea class="field" id="noticeText" rows="5" placeholder="在此粘贴通知文本…"></textarea>
      <div class="flex gap8">
        <button class="btn line sm" id="loadSample">载入样例通知</button>
        <span class="muted" style="font-size:12px;align-self:center">样例来自「教务处 / 德育处」</span>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn line" id="modalCancel">取消</button>
      <button class="btn" id="noticeGo">拆解并加入待办</button>
    </div></div></div>`);
  document.body.appendChild(overlay);
  overlay.onclick=(e)=>{ if(e.target===overlay) closeForm(); };
  const ta=overlay.querySelector('#noticeText');
  overlay.querySelector('#loadSample').onclick=()=>{ ta.value=(DB.noticeSamples||[]).join('\n\n'); };
  overlay.querySelector('#modalCancel').onclick=closeForm;
  overlay.querySelector('#noticeGo').onclick=()=>{
    const items=parseNotice(ta.value);
    if(!items.length){ toast('未识别到可拆解的待办，请检查文本'); return; }
    items.forEach(it=>DB.todos.push(it));
    saveTodos(); closeForm(); render('dashboard');
    const hi=items.filter(i=>i.prio===1).length;
    toast('已拆解 '+items.length+' 条待办（高优先级 '+hi+' 条），已按优先级/截止梳理');
  };
}

async function buildDraftFromFiles(files){
  let text='', names=[], hasBinary=false;
  for(const f of files){
    names.push(f.name);
    const ext = (f.name.split('.').pop()||'').toLowerCase();
    if(['txt','md','csv','json','html','htm'].includes(ext)){
      try{ text += (await f.text()) + '\n'; }catch(e){}
    } else if(['doc','docx','pdf','png','jpg','jpeg'].includes(ext)){
      hasBinary = true;
    }
  }
  let draft = text.trim() ? draftLessonFromText(text, names[0])
                          : { title:(names[0]||'未命名教案').replace(/\.[^.]+$/,''), obj:'（请补充教学目标）', note:'' };
  let tip = null;
  // 可选：已配置大模型（设置-大模型）时，让「挖挖」把资料梳理成更完整的教案要点
  try{
    const cfg = loadAgentCfg();
    if(cfg && (cfg.key || (cfg.relay&&cfg.relay.trim())) && text.trim()){
      const sys = '你是语文教研助手。请把以下备课资料梳理为教案要点，输出：课题、教学目标、教学重难点、教学过程（3-5步）。只输出要点，不要解释。';
      const data = await agentChat(cfg, {model:cfg.model||'gpt-4o-mini', messages:[{role:'system',content:sys},{role:'user',content:text.slice(0,6000)}]});
      const j = data;
      const ai = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim();
      if(ai){ draft.note = (draft.note ? draft.note+'\n\n' : '') + '【智能体梳理】\n' + ai; tip = '已用智能体（挖挖）增强梳理'; }
    }
  }catch(e){ /* 智能体失败不影响主流程 */ }
  if(hasBinary && !text.trim()) tip = 'Word/PDF/图片已按文件名生成草案；图文深度解析与OCR需在「设置-大模型」接入解析能力，可在「编辑」中补充正文';
  else if(hasBinary) tip = '资料已识别梳理；Word/PDF/图片的图文深度解析可在「设置-大模型」进一步接入';
  draft.tip = draft.tip || tip;
  draft.unit = '未分组';
  return draft;
}

// ===== 今日待办 · 标记完成 → 撒花 + 点赞弹窗 =====
function markTodoDone(id, srcBtn){
  if(!id){ return; }
  const todo = (DB.todos||[]).find(t=>t.id===id);
  // 写入今日完成集合
  const d = todayStr();
  todoDoneMap[d] = Array.from(new Set([...(todoDoneMap[d]||[]), id]));
  saveTodoDone();
  updateTodoBadge();
  // 弹窗 + 撒花（弹窗来源不依赖后端）
  celebrate(todo?.t || '待办');
  // 行内淡出
  if(srcBtn){
    const row = srcBtn.closest('.todo-row');
    if(row){ row.style.transition='all .35s'; row.style.opacity='0'; row.style.transform='translateX(20px)';
      setTimeout(()=>row.remove(), 380);
    }
  }
  // 实时刷新「已完成 N/总」数字（不重渲整个页面，保持滚动位置）
  setTimeout(()=>{
    const sub = $('#dashSub');
    if(sub && currentView==='dashboard' && dashTab==='overview'){
      // 只刷新 header 信息行 + 空态判断
      const left = (DB.todos||[]).filter(t=>!(todayDoneIds()).includes(t.id)).length;
      const total = (DB.todos||[]).length;
      const done = total - left;
      const pct = total ? Math.round(done/total*100) : 0;
      const tag = sub.querySelector('h3 .tag.red');
      if(tag) tag.textContent = left + ' 项';
      const muted = sub.querySelector('.card.compact-card .muted');
      if(muted) muted.textContent = `已完成 ${done}/${total}（${pct}%）`;
      // 若全清完了，替换为庆祝空态
      const list = sub.querySelector('.todo-list');
      if(!list && !sub.querySelector('.todo-empty')){
        const card = sub.querySelector('.todo-row')?.closest('.card.compact-card');
        if(card){
          const c = card.querySelector('.list');
          if(c) c.outerHTML = `<div class="todo-empty">🎉 今日待办已全部完成，奖励一朵小红花！</div>`;
        }
      }
    }
  }, 400);
}

function celebrate(title){
  // 1) 撒花粒子（彩纸 + 心形 + 星星，1.6s 下落）
  spawnConfetti();
  // 2) 中央点赞弹窗（用 user 上传的内嵌 SVG/base64 也可，这里用 emoji+CSS 大拇指样式 + 复制一张小型同款手图）
  const ov = el(`<div class="celebrate-overlay" id="celebrate">
    <div class="celebrate-box">
      <div class="thumbs-img">👍</div>
      <div class="celebrate-title">已完成，干得漂亮！</div>
      <div class="celebrate-sub">${title.replace(/</g,'&lt;')}</div>
      <button class="btn mt16" id="celebrateClose">继续</button>
    </div>
  </div>`);
  document.body.appendChild(ov);
  // 进入动画
  requestAnimationFrame(()=>ov.classList.add('on'));
  const close = ()=>{ ov.classList.remove('on'); setTimeout(()=>ov.remove(), 220); };
  ov.querySelector('#celebrateClose').onclick = close;
  ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
  // 1.8s 后若用户没关，自动渐隐
  setTimeout(close, 2200);
}

function spawnConfetti(){
  const colors = ['#ff6b6b','#ffd93d','#6bcB77','#4d96ff','#c780fa','#ff9f43'];
  const shapes = ['■','●','▲','★','♥','✦'];
  const N = 36;
  const layer = el('<div class="confetti-layer" id="confetti"></div>');
  document.body.appendChild(layer);
  const W = window.innerWidth;
  for(let i=0;i<N;i++){
    const p = el(`<span class="confetti">${shapes[i%shapes.length]}</span>`);
    const left = Math.round(Math.random()*W);
    const size = 10 + Math.round(Math.random()*16);
    const dur = 1100 + Math.round(Math.random()*900);
    const delay = Math.round(Math.random()*220);
    const rotate = Math.round((Math.random()*720-360));
    const dx = Math.round((Math.random()*200-100));
    const color = colors[i%colors.length];
    p.style.cssText = `left:${left}px;font-size:${size}px;color:${color};animation-duration:${dur}ms;animation-delay:${delay}ms;--dx:${dx}px;--rot:${rotate}deg;`;
    layer.appendChild(p);
  }
  setTimeout(()=>{ layer.remove(); }, 2400);
}

// ===== 文档导出（班级学情 / 班主任工作 · 各项信息单独成文档）=====
function expBtn(type,key){ return `<button class="btn line sm" data-action="exportDoc" data-type="${type}"${key?` data-key="${key}"`:''}>⬇ 导出文档</button>`; }
function docTable(headers, rows){
  return `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:'Microsoft YaHei',sans-serif;font-size:12px;width:100%">
    <thead><tr>${headers.map(h=>`<th style="background:#eef5fb;color:#27384a;font-weight:600;border:1px solid #dceaf6">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td style="border:1px solid #dceaf6">${c==null||c===''?'':c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function downloadDoc(name, title, bodyHtml){
  const doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title></head><body style="font-family:'Microsoft YaHei',sans-serif"><h1 style="font-size:20px;color:#27384a;border-bottom:2px solid #6ea8dc;padding-bottom:8px">${title}</h1><p style="color:#6f8198;font-size:12px">导出时间：${new Date().toLocaleString('zh-CN')} ｜ 语寓 · 思思老师的工作台</p>${bodyHtml}</body></html>`;
  try{
    const blob = new Blob(['﻿'+doc], { type:'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = el(`<a href="${url}" download="${name}.doc"></a>`);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
    toast('已导出文档：'+name+'.doc（Word 可打开）');
  }catch(e){ toast('导出失败：'+(e.message||e)); }
}
function exportDoc(type, key){
  const r = buildExportDoc(type, key);
  if(!r){ toast('暂无可导出的内容'); return; }
  downloadDoc(r.name, r.title, r.html);
}
function buildExportDoc(type, key){
  switch(type){
    case 'ana-dist': { const c=DB.classScores; return { name:'成绩分布_'+(c.name||''), title:'成绩分布 · '+(c.name||''), html: docTable(['分数段','人数'], c.distribution.map(d=>[d.r, d.c])) }; }
    case 'ana-radar': { const c=DB.classScores; return { name:'核心素养雷达', title:'核心素养雷达（班级均值）', html: docTable(['核心素养维度','得分'], c.radar.map(d=>[d.d, d.v])) }; }
    case 'ana-weak': { const c=DB.classScores; return { name:'知识点薄弱排行', title:'知识点薄弱排行（推送复习包）', html: docTable(['薄弱知识点','薄弱度(%)'], c.weak.map(w=>[w.k, w.v])) }; }
    case 'ana-student': { return { name:'学生个体诊断', title:'学生个体诊断', html: docTable(['学生','语言运用','思维能力','审美创造','文化自信','趋势'], DB.students.map(s=>[s.name, s.lang, s.think, s.aesthetic, s.culture, s.trend==='up'?'↑进步':'↓预警'])) }; }
    case 'ana-exam': { const ex=DB.examScores[key||analyticsTab]; if(!ex) return null; const ranked=rankRows(ex.rows); const head=['班名','姓名',...DB.examSubjects,'总分']; const rows=ranked.map(r=>[r.rank, r.name, ...DB.examSubjects.map(s=>r.s[s]), r.total]); return { name:'成绩表_'+(ex.name||''), title:(ex.name||'')+' · 初三(3)班（'+(ex.date||'')+'）', html: docTable(head, rows) }; }
    case 'ana-talk': { return { name:'谈心谈话记录', title:'学生谈心谈话记录（'+DB.talkRecords.length+' 条）', html: docTable(['日期','对象','类型','方式','谈话内容','反馈效果'], DB.talkRecords.map(r=>[r.date, r.target, r.type, r.method, r.content, r.effect])) }; }
    case 'hr-quant': { return { name:'班级量化_本周', title:'班级量化（本周）', html: docTable(['班级','出勤','作业','纪律','值日','总分'], DB.quant.map(q=>[q.name, q.attend, q.homework, q.discipline, q.duty, q.total])) }; }
    case 'hr-notice': { return { name:'家校通知', title:'家校通知', html: docTable(['通知主题','接收对象','签收','状态'], DB.notices.map(n=>[n.t, n.to, n.signed+'/'+n.total, n.status])) }; }
    case 'hr-archive': { return { name:'学生成长档案', title:'学生成长档案（过程性）', html: docTable(['学生','品德','学业','体美劳'], DB.archive.map(a=>[a.name, a.品德, a.学业, a.体美劳])) }; }
    case 'hr-ledger': { const rows=[['安全排查记录表','模板化 · 本周已填','已完成'],['主题班会记录','模板化 · 待填','待填写'],['值班排表','自动生成 · 可调整','已生成']]; return { name:'事务台账', title:'事务台账（减负）', html: docTable(['事务','说明','状态'], rows) }; }
    case 'hr-students': { return { name:'学生信息_初三3班', title:'学生信息 · 初三(3)班（'+DB.studentInfo.length+' 人）', html: docTable(['姓名','性别','身份证号','民族','学籍号','家庭地址','社保卡号','父母','联系号码','父母身份证号','学生状态'], DB.studentInfo.map(s=>[s.name,s.gender,s.idNo,s.nation,s.stuNo,s.address,s.ssCard,s.parents,s.phone,s.parentId,s.status])) }; }
    case 'hr-aid': { return { name:'学生资助', title:'学生资助 · 初三(3)班', html: docTable(['姓名','家庭成员','身份证号码','联系电话','资助状态'], DB.studentAid.map(s=>[s.name,s.family,s.idNo,s.phone,s.status])) }; }
    case 'hr-committee': { const c=DB.classCommittee; const rows=[...c.leaders.map(l=>['班委 · '+l.role, l.holder, l.note]), ...c.subjectReps.map(r=>['课代表 · '+r.subject, r.holder, '学科课代表'])]; return { name:'班委设置', title:'班委设置 · 初三(3)班', html: docTable(['岗位','任职同学','职责/说明'], rows) }; }
    case 'hr-meeting': { return { name:'主题班会记录', title:'主题班会记录（'+meetingData.length+' 条）', html: docTable(['主题','日期','主持人','内容','成效小结'], meetingData.map(m=>[m.theme, m.date, m.host||'思思老师', m.content||'—', m.summary||'—'])) }; }
  }
  return null;
}

// ===== 个性化背景（个人与设置）=====
function loadBg(){ try{ const v=localStorage.getItem('yu_bg'); const layer=document.getElementById('bgLayer'); if(layer&&v) layer.style.background=v; }catch(e){} }
function applyBg(v){ const layer=document.getElementById('bgLayer'); if(layer) layer.style.background=v||''; try{ localStorage.setItem('yu_bg', v||''); }catch(e){} }

// 素材资源库 · 二级目录内绑定（试卷上传 / 讲解与阅读按钮已由全局 [data-action] 接管）
function bindViewResourceSub(){
  const pf = $('#paperFile');
  if(pf && !pf._bound){ pf._bound=true; pf.onchange=()=>{
    const f=pf.files[0]; if(!f) return;
    const ext=(f.name.split('.').pop()||'').toLowerCase();
    const ft = ext==='pdf'?'pdf':(['doc','docx','xls','xlsx'].includes(ext))?'doc':'image';
    DB.papers.unshift({ id:'p'+Date.now(), title:f.name.replace(/\.[^.]+$/,''), subject:'语文', grade:'—',
      fileType:ft, fileName:f.name, size:(f.size/1048576).toFixed(1)+'MB', date:todayStr(), note:'本地上传（演示）' });
    toast('学科试卷：已上传 '+f.name+'（演示，未落库）');
    $('#paperGrid') && ($('#resSub').innerHTML=paperView());
  };}
}

function bindView(view){
  // [data-action] / [data-go] 改用 #content 上的全局事件委托（一次注册，自动覆盖二级标签动态重渲的内容）
  // 见底部 init 中的 content.addEventListener('click', onContentClick)

  // 资源筛选 + 素材资源库 · 二级目录切换
  if(view==='resource'){
    const apply=()=>{const t=$('#fType .pill.active')?.dataset.v||''; const g=$('#fGrade .pill.active')?.dataset.v||'';
      document.querySelectorAll('#resGrid .res').forEach(c=>{
        const ok=(!t||c.dataset.type===t)&&(!g||c.dataset.grade===g); c.style.display=ok?'':'none';});};
    content.querySelectorAll('#fType .pill,#fGrade .pill').forEach(p=>p.onclick=()=>{
      p.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('active')); p.classList.add('active'); apply();});
    content.querySelectorAll('#resSubNav .sub-tab').forEach(b=>b.onclick=()=>{
      resourceTab=b.dataset.sub;
      content.querySelectorAll('#resSubNav .sub-tab').forEach(x=>x.classList.toggle('active',x===b));
      $('#resSub').innerHTML=resourceSub();
      bindViewResourceSub();
    });
    bindViewResourceSub();
  }
  // 荣誉扫描册筛选
  if(view==='honor'){
    const apply=()=>{const c=$('#fHonor .pill.active')?.dataset.v||'';
      document.querySelectorAll('#honorGrid .honor').forEach(card=>{
        card.style.display=(!c||card.dataset.cat===c)?'':'none';});};
    content.querySelectorAll('#fHonor .pill').forEach(p=>p.onclick=()=>{
      p.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('active')); p.classList.add('active'); apply();});
  }
  // 作业批改 · 二级目录切换 + 子视图绑定
  if(view==='homework'){
    content.querySelectorAll('#hwSubNav .sub-tab').forEach(b=>b.onclick=()=>{
      hwTab=b.dataset.sub;
      content.querySelectorAll('#hwSubNav .sub-tab').forEach(x=>x.classList.toggle('active',x===b));
      $('#hwSub').innerHTML=homeworkSub();
      bindHomeworkSub();
    });
    bindHomeworkSub();
  }
  // 备课中心 · 二级目录切换（单元备课 / 常用备课网址 / 课标 / 教材）
  if(view==='lesson'){
    content.querySelectorAll('#lessonSubNav .sub-tab').forEach(b=>b.onclick=()=>{
      lessonTab=b.dataset.sub;
      content.querySelectorAll('#lessonSubNav .sub-tab').forEach(x=>x.classList.toggle('active',x===b));
      $('#lessonSub').innerHTML=lessonSub();
      if(lessonTab==='standard') bindCsLessonSelect();
    });
    if(lessonTab==='standard') bindCsLessonSelect();
  }
  // 班主任工作 · 二级目录切换 + 学生搜索 + 上传录入 + 班会记录
  if(view==='homeroom'){
    content.querySelectorAll('#homeSubNav .sub-tab').forEach(b=>b.onclick=()=>{
      homeTab=b.dataset.sub;
      content.querySelectorAll('#homeSubNav .sub-tab').forEach(x=>x.classList.toggle('active',x===b));
      $('#homeSub').innerHTML=homeroomSub();
      if(homeTab==='students'){ bindStudentSearch(); bindStudentImport(); }
      if(homeTab==='meeting') refreshMeeting();
    });
    if(homeTab==='students'){ bindStudentSearch(); bindStudentImport(); }
    if(homeTab==='meeting') refreshMeeting();
  }
  // 班级学情 · 二级目录切换 + 谈话类型筛选
  if(view==='analytics'){
    content.querySelectorAll('#anaSubNav .sub-tab').forEach(b=>b.onclick=()=>{
      analyticsTab=b.dataset.sub;
      content.querySelectorAll('#anaSubNav .sub-tab').forEach(x=>x.classList.toggle('active',x===b));
      $('#anaSub').innerHTML=analyticsSub();
      if(analyticsTab==='talk') bindTalkFilter();
      if(analyticsTab==='monthly'||analyticsTab==='mid'||analyticsTab==='final') bindExamImport();
      if(analyticsTab==='query') bindScoreQuery();
    });
    if(analyticsTab==='talk') bindTalkFilter();
    if(analyticsTab==='monthly'||analyticsTab==='mid'||analyticsTab==='final') bindExamImport();
      if(analyticsTab==='query') bindScoreQuery();
  }
  // 工作台 · 二级目录切换 + 安全记录（拉取真实后端）
  if(view==='dashboard'){
    content.querySelectorAll('#dashSubNav .sub-tab').forEach(b=>b.onclick=()=>{
      dashTab=b.dataset.sub;
      content.querySelectorAll('#dashSubNav .sub-tab').forEach(x=>x.classList.toggle('active',x===b));
      $('#dashSub').innerHTML=dashboardSub();
      if(dashTab==='safety'){ bindSafetyFilter(); refreshSafety(); }
      if(dashTab==='calendar'){ bindCalendar(); }
      if(dashTab==='overview'){ bindClassRemind(); bindSchedule(); }
    });
    if(dashTab==='safety'){ bindSafetyFilter(); refreshSafety(); }
    if(dashTab==='calendar'){ bindCalendar(); }
    if(dashTab==='overview'){ bindClassRemind(); bindSchedule(); }
  }
  // 个人与设置 · 个性化背景
  if(view==='settings'){
    const presets = content.querySelectorAll('#bgPresets .bg-swatch');
    const cur = (()=>{ try{ return localStorage.getItem('yu_bg')||''; }catch(e){ return ''; } })();
    presets.forEach(x=>x.classList.toggle('active', x.dataset.bg===cur));
    presets.forEach(b=>b.onclick=()=>{ applyBg(b.dataset.bg); presets.forEach(x=>x.classList.remove('active')); b.classList.add('active'); toast('背景已更新'); });
    const bf = $('#bgFile'); if(bf) bf.onchange=()=>{ const f=bf.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ applyBg(`url(${r.result}) center/cover no-repeat`); presets.forEach(x=>x.classList.remove('active')); toast('自定义背景已应用'); }; r.readAsDataURL(f); };
    const br = $('#bgReset'); if(br) br.onclick=()=>{ applyBg(''); presets.forEach(x=>x.classList.remove('active')); const def=content.querySelector('#bgPresets .bg-swatch[data-bg=""]'); if(def) def.classList.add('active'); toast('已恢复默认背景'); };
    // 智能体配置
    const ec = loadAgentCfg();
    if(ec){ if($('#agentBase')&&ec.base) $('#agentBase').value=ec.base; if($('#agentModel')&&ec.model) $('#agentModel').value=ec.model; if($('#agentKey')&&ec.key) $('#agentKey').value=ec.key; if($('#agentRelay')&&ec.relay) $('#agentRelay').value=ec.relay; }
    const acs = $('#agentCfgSave'); if(acs) acs.onclick=async()=>{ const cfg={ base:($('#agentBase').value||'').trim(), model:($('#agentModel').value||'').trim(), key:($('#agentKey').value||'').trim(), relay:($('#agentRelay').value||'').trim() }; if(!cfg.key && !cfg.relay){ toast('请填写 API Key，或填写中继地址'); return; } const pass=($('#secPass')?.value||'').trim(); if(cfg.key && pass){ try{ const r=await SECRET.seal(cfg.key, pass); cfg.key=r.value; cfg.enc=r.enc; if(r.enc) SECRET.ag=cfg.key; }catch(e){ toast('✗ 加密失败：'+(e.message||e)); return; } } saveAgentCfg(cfg); toast('智能体配置已保存'+(cfg.enc?'（Key 已加密存储）':'')); };
    const acc = $('#agentCfgClear'); if(acc) acc.onclick=()=>{ saveAgentCfg(null); ['agentBase','agentModel','agentKey','agentRelay'].forEach(id=>{ const x=$('#'+id); if(x) x.value=''; }); toast('已清除智能体配置'); };
    const atr = $('#agentTry'); if(atr) atr.onclick=()=>openAgent();
    const ats = $('#agentTest'); if(ats) ats.onclick=()=>testAgentConn();
    // 后端 API 地址回填
    const ab = $('#apiBase');
    if(ab){ try{ ab.value = localStorage.getItem('yuyu_api_base') || ''; }catch(e){} }
    bindGitHubBackup();
  }
}

// ================= GitHub 数据备份（自动 / 可恢复） =================
function loadGithubCfg(){ try{ const c=JSON.parse(localStorage.getItem('yu_github_cfg')||'null'); if(c&&c.enc===true){ return Object.assign({},c,{ token:(SECRET.gh!=null?SECRET.gh:'') }); } return c; }catch(e){ return null; } }
function saveGithubCfg(c){ try{ localStorage.setItem('yu_github_cfg', JSON.stringify(c)); }catch(e){} }
function utf8ToB64(str){ return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str))); }
function b64ToUtf8(b64){ const bin=atob((b64||'').replace(/\s/g,'')); const bytes=Uint8Array.from(bin, c=>c.charCodeAt(0)); return new TextDecoder().decode(bytes); }

function githubSnapshot(){
  const ls={};
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k) ls[k]=localStorage.getItem(k); } }catch(e){}
  let db=null; try{ db=DB; }catch(e){}
  return { app:'yu-workbench', version:1, savedAt:new Date().toISOString(), localStorage:ls, db };
}
function githubApiHeaders(token){ return { 'Authorization':'Bearer '+token, 'Accept':'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28' }; }

async function githubBackupNow(opts){
  opts=opts||{};
  const cfg=loadGithubCfg();
  if(cfg&&cfg.enc===true&&!SECRET.unlocked){ toast('🔒 凭据已加密，请先在上方输入口令并点「解锁」'); return false; }
  if(!cfg||!cfg.token||!cfg.owner||!cfg.repo){ toast('请先在「个人与设置 → GitHub 备份」中填写仓库与 Token'); return false; }
  const body=JSON.stringify(githubSnapshot(),null,2);
  let content; try{ content=utf8ToB64(body); }catch(e){ toast('✗ 备份序列化失败'); return false; }
  if(opts.keepalive && content.length>58000) return false; // 超出 keepalive 上限则跳过静默上传
  const api='https://api.github.com';
  const u=`${api}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodeURIComponent(cfg.path)}`;
  let sha;
  try{ const h=await fetch(u+'?ref='+encodeURIComponent(cfg.branch||'main'), { headers:githubApiHeaders(cfg.token) });
    if(h.status===200){ const j=await h.json(); sha=j.sha; } }catch(e){}
  const payload={ message:'[yu-backup] 自动备份 '+new Date().toLocaleString(), content, branch:cfg.branch||'main' };
  if(sha) payload.sha=sha;
  try{
    const res=await fetch(u,{ method:'PUT', headers:Object.assign({ 'Content-Type':'application/json' }, githubApiHeaders(cfg.token)), body:JSON.stringify(payload), keepalive:!!opts.keepalive });
    if(res.ok){ try{ localStorage.setItem('yu_github_last', new Date().toISOString()); }catch(e){} const st=document.getElementById('ghStatus'); if(st) st.textContent='上次备份：'+new Date().toLocaleString(); toast('✓ 已备份到 GitHub：'+cfg.owner+'/'+cfg.repo); return true; }
    const t=await res.text(); toast('✗ 备份失败 ('+res.status+')：'+(t.slice(0,120))); return false;
  }catch(e){ toast('✗ 备份请求失败：'+e.message); return false; }
}

async function githubRestoreNow(){
  const cfg=loadGithubCfg();
  if(cfg&&cfg.enc===true&&!SECRET.unlocked){ toast('🔒 凭据已加密，请先在上方输入口令并点「解锁」'); return; }
  if(!cfg||!cfg.token){ toast('请先填写 GitHub 配置'); return; }
  const u=`https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodeURIComponent(cfg.path)}?ref=${encodeURIComponent(cfg.branch||'main')}`;
  try{
    const res=await fetch(u,{ headers:githubApiHeaders(cfg.token) });
    if(!res.ok){ toast('✗ 获取备份失败 ('+res.status+')'); return; }
    const j=await res.json();
    const snap=JSON.parse(b64ToUtf8(j.content));
    const ls=snap.localStorage||{}; let n=0, skipped=0;
    for(const k in ls){
      if(!LS_WHITELIST.includes(k)){ skipped++; continue; } // 仅恢复应用键，拒绝未知键
      let v=ls[k]; if(typeof v!=='string'){ try{ v=JSON.stringify(v); }catch(e){ v=String(v); } }
      try{ localStorage.setItem(k, v); n++; }catch(e){}
    }
    toast('✓ 已恢复 '+n+' 项数据'+(skipped?('，跳过 '+skipped+' 项'):'')+'，即将刷新…');
    setTimeout(()=>{ try{ location.reload(); }catch(e){} }, 800);
  }catch(e){ toast('✗ 恢复失败：'+e.message); }
}

function bindGitHubBackup(){
  SECRET.init();
  const cfg=loadGithubCfg();
  if(cfg){
    if($('#ghRepo')) $('#ghRepo').value=cfg.owner+'/'+cfg.repo;
    if($('#ghBranch')) $('#ghBranch').value=cfg.branch||'main';
    if($('#ghPath')) $('#ghPath').value=cfg.path||'yu-backup/data.json';
    // 已加密配置不回填明文 Token 到输入框（防泄露）；仅保留占位提示
    if($('#ghToken')){ if(cfg.enc===true && !SECRET.unlocked){ $('#ghToken').value=''; $('#ghToken').placeholder='🔒 已加密，输入口令解锁后使用'; } else { $('#ghToken').value=cfg.token||''; } }
    if($('#ghAuto')) $('#ghAuto').checked=!!cfg.auto;
  }
  const st=$('#ghStatus');
  if(st){ let t=null; try{ t=localStorage.getItem('yu_github_last'); }catch(e){} st.textContent = t?('上次备份：'+new Date(t).toLocaleString()):'尚未备份'; }
  // 凭据解锁
  const su=$('#secUnlock'); if(su){ su.onclick=async()=>{
    const pass=($('#secPass')?.value||'').trim();
    if(!pass){ toast('请输入加密口令'); return; }
    if(!SECRET.hasEnc){ toast('当前没有已加密的凭据，无需解锁'); return; }
    const ok=await SECRET.unlock(pass);
    const ss=$('#secState');
    if(ok){ if(ss) ss.textContent='✅ 已解锁，本次会话可正常使用自动备份 / 挖挖 AI'; toast('🔓 凭据已解锁'); }
    else { if(ss) ss.textContent='❌ 口令错误，无法解密'; toast('✗ 口令错误'); }
  }; }
  const ss=$('#secState');
  if(ss && SECRET.state()==='locked'){ ss.textContent='🔒 检测到已加密凭据，请输入口令后点「解锁」'; }
}

// ================= JSON 数据备份（导入 / 导出，纯本地文件） =================
function openBackupModal(){
  if($('#modal')) closeForm();
  const overlay = el(`<div class="modal" id="modal"><div class="modal-box" style="width:460px;max-width:94vw">
    <h3>💾 数据备份（JSON）</h3>
    <div class="muted" style="font-size:13px;margin:6px 0 14px">把本机全部数据导出为 JSON 文件，保存在你自己的电脑 / 网盘；也可导入之前导出的 JSON 文件，一键覆盖恢复本机数据。<br>如需自动同步到 GitHub 云端，请前往「个人与设置 → 🐙 GitHub 数据备份」。</div>
    <div class="backup-row" style="display:flex;align-items:center;gap:10px"><button class="btn" id="bkExport">⬇ 导出 JSON 文件</button><span class="muted" style="font-size:12px;align-self:center">下载全部数据到本地</span></div>
    <div class="backup-row" style="display:flex;align-items:center;gap:10px;margin-top:12px"><label class="btn line" for="bkImportFile">⬆ 选择文件导入</label><input id="bkImportFile" type="file" accept="application/json,.json" style="display:none"><span class="muted" id="bkFileName" style="font-size:12px">未选择文件</span></div>
    <div class="modal-actions"><span class="muted" id="bkStatus" style="font-size:12px;align-self:center"></span><span style="flex:1"></span><button class="btn line" id="modalCancel">关闭</button></div>
  </div></div>`);
  document.body.appendChild(overlay);
  overlay.onclick = (e)=>{ if(e.target===overlay) closeForm(); };
  overlay.querySelector('#modalCancel').onclick = closeForm;
  overlay.querySelector('#bkExport').onclick = ()=> exportJsonBackup();
  const fileInput = overlay.querySelector('#bkImportFile');
  const fname = overlay.querySelector('#bkFileName');
  const status = overlay.querySelector('#bkStatus');
  fileInput.onchange = ()=>{
    const f = fileInput.files && fileInput.files[0];
    if(!f){ fname.textContent='未选择文件'; return; }
    fname.textContent = f.name;
    if(!confirm('导入将覆盖当前本机数据，确定继续？')){ fileInput.value=''; fname.textContent='未选择文件'; return; }
    importJsonBackup(f).then(ok=>{ status.textContent = ok ? '✓ 已恢复：'+new Date().toLocaleString() : '✗ 导入失败'; });
  };
}
function exportJsonBackup(){
  let snap;
  try{ snap = githubSnapshot(); }catch(e){ toast('✗ 生成备份失败'); return; }
  const name = '语寓数据备份_' + new Date().toISOString().slice(0,10);
  try{
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el(`<a href="${url}" download="${name}.json"></a>`);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
    toast('已导出 JSON：'+name+'.json');
  }catch(e){ toast('✗ 导出失败：'+(e.message||e)); }
}
async function importJsonBackup(file){
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    const ls = (data && data.localStorage) || {};
    if(!data || typeof data!=='object' || Object.keys(ls).length===0){ toast('✗ 文件格式不正确（缺少 localStorage 数据）'); return false; }
    let n=0, skipped=0;
    for(const k in ls){
      if(!LS_WHITELIST.includes(k)){ skipped++; continue; } // 仅恢复应用键，拒绝未知键
      let v = ls[k];
      if(typeof v!=='string'){ try{ v=JSON.stringify(v); }catch(e){ v=String(v); } } // 规范化存储值，避免对象被强转
      try{ localStorage.setItem(k, v); n++; }catch(e){}
    }
    // 关键数据结构基础校验：畸形 yu_todos 直接丢弃，避免后续解析异常
    try{ const td=localStorage.getItem('yu_todos'); if(td && !Array.isArray(JSON.parse(td))){ localStorage.removeItem('yu_todos'); n=Math.max(0,n-1); } }catch(e){}
    toast('✓ 已恢复 '+n+' 项'+(skipped?('，跳过 '+skipped+' 项非应用键'):'')+'，正在刷新…');
    setTimeout(()=>{ try{ location.reload(); }catch(e){} }, 700);
    return true;
  }catch(e){ toast('✗ 导入失败：'+(e.message||e)); return false; }
}

let __autoTimer=null, __lastSig=null;
function backupSig(){
  try{ let s=''; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&(k.indexOf('yu_')===0||k.indexOf('yuyu_')===0)) s+=k+'='+(localStorage.getItem(k)||'').length+';'; } return s; }catch(e){ return ''; }
}
function startAutoBackup(){
  const cfg=loadGithubCfg();
  if(!cfg||!cfg.auto||!cfg.token){ if(__autoTimer){ clearInterval(__autoTimer); __autoTimer=null; } return; }
  __lastSig=backupSig();
  if(__autoTimer) clearInterval(__autoTimer);
  __autoTimer=setInterval(()=>{
    const c=loadGithubCfg(); if(!c||!c.auto||!c.token) return;
    const sig=backupSig();
    if(sig!==__lastSig){ __lastSig=sig; githubBackupNow(); }
  }, 60000);
  window.addEventListener('beforeunload', ()=>{
    const c=loadGithubCfg(); if(!c||!c.auto||!c.token) return;
    const sig=backupSig();
    if(sig!==__lastSig){ try{ githubBackupNow({ keepalive:true }); }catch(e){} }
  });
}

// 上课提醒：启动右上角闹钟图标（全局常驻，10 秒刷新状态）
function bindClassRemind(){ startRemind(); }

// 1530 安全教育：按类型筛选
function bindSafetyFilter(){
  const wrap=$('#fSafe'); if(!wrap) return;
  const apply=()=>{const t=$('#fSafe .pill.active')?.dataset.v||'';
    document.querySelectorAll('#safeList .talk').forEach(c=>{
      c.style.display=(!t||c.dataset.type===t)?'':'none';});};
  wrap.querySelectorAll('.pill').forEach(p=>p.onclick=()=>{
    wrap.querySelectorAll('.pill').forEach(x=>x.classList.remove('active')); p.classList.add('active'); apply();});
}

// 谈心谈话：按类型筛选
function bindTalkFilter(){
  const wrap=$('#fTalk'); if(!wrap) return;
  const apply=()=>{const t=$('#fTalk .pill.active')?.dataset.v||'';
    document.querySelectorAll('#talkList .talk').forEach(c=>{
      c.style.display=(!t||c.dataset.type===t)?'':'none';});};
  wrap.querySelectorAll('.pill').forEach(p=>p.onclick=()=>{
    wrap.querySelectorAll('.pill').forEach(x=>x.classList.remove('active')); p.classList.add('active'); apply();});
}

// 学生信息搜索（按姓名 / 学籍号 过滤）
function bindStudentSearch(){
  const inp=$('#stuSearch'); if(!inp) return;
  inp.oninput=()=>{const q=inp.value.trim().toLowerCase();
    document.querySelectorAll('#stuBody tr').forEach(tr=>{
      const txt=(tr.textContent||'').toLowerCase();
      tr.style.display=(!q||txt.includes(q))?'':'none';});
  };
}
// 素材资源库 · 重新渲染当前二级目录
function rerenderResourceSub(){ const box=$('#resSub'); if(box){ box.innerHTML=resourceSub(); bindViewResourceSub(); } }

function openExplainForm(){
  openForm({ title:'添加知识点讲解视频', submitText:'添加', fields:[
    { name:'title', label:'讲解标题', type:'text' },
    { name:'subject', label:'学科', type:'text', value:'语文' },
    { name:'platform', label:'来源平台', type:'select', options:['视频文件','链接','哔哩哔哩','抖音','小红书','小程序视频'] },
    { name:'url', label:'视频链接（选填，平台链接在此粘贴）', type:'text' },
    { name:'duration', label:'时长（如 08:30 / 图文）', type:'text' },
    { name:'note', label:'备注', type:'textarea' } ],
    onSubmit:(d)=>{
      if(!d.title) throw new Error('请填写讲解标题');
      const isFile = d.platform==='视频文件';
      const isLink = d.platform==='链接';
      DB.explains.unshift({ id:'e'+Date.now(), title:d.title, subject:d.subject||'语文', platform:d.platform,
        url:(isFile||isLink)?(d.url||''):'', fileType:isFile?'mp4':'',
        fileName:isFile?('本地视频'+Date.now()+'.mp4'):'', duration:d.duration||'—',
        icon:isFile?'🎞':(d.platform==='抖音'?'🎬':d.platform==='小红书'?'📕':d.platform==='哔哩哔哩'?'📺':'📲'), note:d.note||'' });
      toast('知识点讲解：已添加「'+d.title+'」（演示）');
      rerenderResourceSub();
    }});
}

function openReadingForm(){
  openForm({ title:'添加整本阅读书目', submitText:'添加', fields:[
    { name:'title', label:'书名', type:'text' },
    { name:'author', label:'作者', type:'text' },
    { name:'grade', label:'适用年级', type:'text', value:'九年级' },
    { name:'progress', label:'阅读进度（选填）', type:'text', value:'待读' },
    { name:'note', label:'备注', type:'textarea' } ],
    onSubmit:(d)=>{
      if(!d.title) throw new Error('请填写书名');
      DB.readings.unshift({ id:'r'+Date.now(), title:d.title, author:d.author||'佚名', grade:d.grade||'—',
        progress:d.progress||'', note:d.note||'', icon:'📖' });
      toast('整本阅读：已添加「'+d.title+'」（演示）');
      rerenderResourceSub();
    }});
}

function openReadingQForm(bookId){
  const book = DB.readings.find(x=>x.id===bookId);
  openForm({ title:'为 '+ (book?book.title:'该书目') +' 添加考题', submitText:'添加考题', fields:[
    { name:'q', label:'题干', type:'textarea' },
    { name:'type', label:'题型', type:'select', options:['选择','填空','简答'] },
    { name:'options', label:'选项（仅选择题填写，用逗号分隔）', type:'text' },
    { name:'answer', label:'参考答案', type:'textarea' },
    { name:'analysis', label:'解析（选填）', type:'textarea' },
    { name:'difficulty', label:'难度', type:'select', options:['易','中','难'] } ],
    onSubmit:(d)=>{
      if(!d.q) throw new Error('请填写题干');
      if(!d.answer) throw new Error('请填写参考答案');
      const opts = d.type==='选择' ? d.options.split(/[,，]/).map(s=>s.trim()).filter(Boolean) : [];
      DB.readingQuestions.unshift({ id:'q'+Date.now(), bookId, q:d.q, type:d.type,
        options:opts, answer:d.answer, analysis:d.analysis||'', difficulty:d.difficulty||'中' });
      toast('考题已添加（演示）');
      rerenderResourceSub();
    }});
}

// ===== 头像 / 昵称（可自行修改，localStorage 持久化）=====
const LS_AVATAR = 'yuyu_avatar', LS_NAME = 'yuyu_name';
function loadProfile(){
  try{
    const a = localStorage.getItem(LS_AVATAR);
    const n = localStorage.getItem(LS_NAME);
    if(a) DB.user.avatar = a;
    if(n) DB.user.name = n;
  }catch(e){}
}
function renderAvatar(){
  const ini = (DB.user.name || '师').slice(0,1);
  const av = DB.user.avatar;
  ['#sideAvatar'].forEach(sel=>{
    const x = $(sel); if(!x) return;
    x.innerHTML = av ? `<img alt="头像" src="${av}">` : ini;
  });
  const sn = $('#sideName'); if(sn) sn.textContent = DB.user.name;
}
function openAvatarEditor(){
  closeForm();
  const cur = DB.user.avatar || '';
  const ini = (DB.user.name || '师').slice(0,1);
  const overlay = el(`<div class="modal" id="modal"><div class="modal-box">
    <h3>🖼 修改头像与昵称</h3>
    <div class="modal-fields">
      <div class="flex gap12" style="align-items:center">
        <div class="avatar lg" id="avPrev">${cur?`<img src="${cur}">`:ini}</div>
        <button class="btn line" id="avPick">📁 上传图片</button>
        <input type="file" id="avFile" accept="image/*" style="display:none">
      </div>
      <div class="modal-field"><label>显示昵称</label><input id="avName" class="field" value="${DB.user.name}"></div>
      <div class="muted" style="font-size:12px">支持上传本地图片作头像；昵称显示在侧边栏与顶栏，刷新后保留。</div>
    </div>
    <div class="modal-actions"><button class="btn line" id="modalCancel">取消</button>
      <button class="btn" id="modalSubmit">保存</button></div>
  </div></div>`);
  document.body.appendChild(overlay);
  const file = overlay.querySelector('#avFile');
  const prev = overlay.querySelector('#avPrev');
  overlay.querySelector('#avPick').onclick = ()=>file.click();
  file.onchange = ()=>{
    const f = file.files && file.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=>{ prev.innerHTML = `<img src="${r.result}">`; prev.dataset.url = r.result; };
    r.readAsDataURL(f);
  };
  overlay.querySelector('#modalCancel').onclick = closeForm;
  overlay.onclick = (e)=>{ if(e.target===overlay) closeForm(); };
  overlay.querySelector('#modalSubmit').onclick = ()=>{
    const url = prev.dataset.url || cur;
    const nm = overlay.querySelector('#avName').value.trim() || DB.user.name;
    try{ localStorage.setItem(LS_AVATAR, url||''); localStorage.setItem(LS_NAME, nm); }catch(e){}
    DB.user.avatar = url; DB.user.name = nm;
    renderAvatar();
    closeForm();
    if(currentView) render(currentView); // 刷新设置页预览
    toast('头像与昵称已更新');
  };
}

function handleAction(a,b){
  if(a==='gotoSearch'){
    const drop = $('#searchDrop'); if(drop) drop.style.display='none';
    const inp = $('#globalSearch'); if(inp) inp.value = b.dataset.k || inp.value;
    switchNav(b.dataset.view || 'dashboard');
    return;
  }
  if(a==='saveProfile'){
    const nm = ($('#setName')?.value || '').trim();
    if(nm) DB.user.name = nm;
    const role = ($('#setRole')?.value || '').trim();
    if(role) DB.user.role = role;
    const school = ($('#setSchool')?.value || '').trim();
    if(school) DB.user.school = school;
    try{ localStorage.setItem(LS_NAME, DB.user.name); }catch(e){}
    renderAvatar();
    toast('账号信息已保存（本机）');
    return;
  }
  if(a==='editAvatar'){ openAvatarEditor(); return; }
  // 今日待办 · 标记完成 → 撒花 + 点赞弹窗
  if(a==='doneTodo'){ markTodoDone(b.dataset.id, b); return; }
  // 今日待办 · 新增 / 拆解学校通知（自动识别截止时间与优先级）
  if(a==='addTodo'){ openAddTodoForm(); return; }
  if(a==='parseNotice'){ openParseNotice(); return; }
  // 班主任工作 · 班级概览 · 操行评语生成（依据日常积分 + 学业成绩）
  if(a==='genComment'){ genComment(b.dataset.id); return; }
  if(a==='genAllComments'){ genAllComments(); return; }
  if(a==='editComment'){ editComment(b.dataset.id); return; }
  if(a==='exportComments'){ exportComments(); return; }
  // 班主任工作 · 文档素材智能生成（7 类常用文档按需撰写）
  if(a==='openDocGen'){ openDocGenForm(b.dataset.key); return; }
  // 文档导出（班级学情 / 班主任工作 · 各项信息单独成文档）
  if(a==='exportDoc'){ exportDoc(b.dataset.type, b.dataset.key); return; }
  // 接真实后端的表单类动作
  if(a==='addSafety'){ openSafetyForm(); return; }
  if(a==='addMeeting'){ openMeetingForm(); return; }
  if(a==='addExplain'){ openExplainForm(); return; }
  if(a==='addReading'){ openReadingForm(); return; }
  if(a==='addReadingQ'){ openReadingQForm(b.dataset.id); return; }
  if(a==='trainReading'){ readingTrainId=b.dataset.id; rerenderResourceSub(); return; }
  if(a==='trainBank'){ readingTrainId='__bank__'; rerenderResourceSub(); return; }
  if(a==='backReading'){ readingTrainId=null; rerenderResourceSub(); return; }
  if(a==='toggleAnswers'){ const box=$('#qList'); if(box) box.classList.toggle('hide-ans'); toast('自测模式已切换'); return; }
  if(a==='uploadCalendar'){ const inp=$('#calFile'); if(inp) inp.click(); return; }
  if(a==='toggleSchedEdit'){ toggleSchedEdit(); return; }
  if(a==='importSchedule'){ const inp=$('#schedFile'); if(inp) inp.click(); return; }
  if(a==='editCell'){ openCellEditor(b.dataset.day, b.dataset.period); return; }
  if(a==='schedTemplate'){ downloadSchedTemplate(); return; }
  if(a==='previewFile'){ toast('预览：'+(b.dataset.f||'该资源')+'（演示，正式版对接对象存储）'); return; }

  // 备课网址 · 增删/一键预览
  if(a==='addSite'){
    e.stopPropagation(); // 防止冒泡触发 openSite
    openForm({
      title:'添加备课网址', submitText:'加入聚合',
      fields:[
        { name:'name', label:'名称', type:'text', placeholder:'如：国家中小学智慧教育平台' },
        { name:'url',  label:'链接', type:'text', placeholder:'https://...' },
        { name:'desc', label:'简述（可选）', type:'text', placeholder:'用一句话说清这个资源是做什么的' },
        { name:'group',label:'所属板块', type:'select', options:['官方平台','题库组卷','互动课件','备课社区','数字阅读'], value:'备课社区' },
      ],
      onSubmit:(p)=>{
        if(!p.name || !p.url){ toast('名称与链接不能为空'); return Promise.reject(new Error('必填')); }
        if(!/^https?:\/\//i.test(p.url)) p.url = 'https://' + p.url;
        const colors = { '官方平台':'rc6', '题库组卷':'rc3', '互动课件':'rc1', '备课社区':'rc2', '数字阅读':'rc5' };
        const icos = { '官方平台':'🏛', '题库组卷':'📝', '互动课件':'📺', '备课社区':'💡', '数字阅读':'📜' };
        if(DB.sites.some(s=>s.url===p.url)){ toast('该网址已存在'); return Promise.reject(new Error('重复')); }
        DB.sites.push({ name:p.name, url:p.url, desc:p.desc||'', tag:p.group, ico:icos[p.group]||'🔗', group:p.group, rc:colors[p.group]||'rc4' });
        saveSites(); render('lesson');
        toast('已加入「'+p.group+'」板块');
      }
    });
    return;
  }
  if(a==='delSite'){
    e.stopPropagation();
    if(b.dataset.url === undefined) return;
    const url = b.dataset.url;
    const target = (DB.sites||[]).find(s=>s.url===url);
    if(!target){ return; }
    if(!confirm(`确定移除「${target.name}」？此操作仅移除聚合列表（不影响浏览器收藏）`)) return;
    DB.sites = DB.sites.filter(s=>s.url!==url);
    saveSites(); render('lesson');
    toast('已移除「'+target.name+'」');
    return;
  }
  if(a==='previewAllSites'){
    const sites = DB.sites || [];
    if(!sites.length){ toast('还没有网址可预览'); return; }
    let opened = 0;
    sites.forEach((s,i)=>{
      // 各浏览器拦截多个 window.open，每个加 setTimeout 100ms 错开 + 一次性点击手势
      setTimeout(()=>{ try{ window.open(s.url,'_blank','noopener'); opened++; }catch(e){} }, i*120);
    });
    toast(`已尝试在 ${sites.length} 个标签页打开（浏览器可能拦截，请允许弹窗）`);
    return;
  }
  if(a==='copyLink'){
    const url=b.dataset.url||'';
    if(!url){ toast('该资源为本地文件，无外链可复制'); return; }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(()=>toast('链接已复制：'+url.slice(0,40)+(url.length>40?'…':'')),()=>toast('复制失败，请手动复制：'+url)); }
    else toast('链接：'+url);
    return;
  }
  // 备课中心 · 外接入网站 / 小程序
  if(a==='openSite'){ const u=b.dataset.url; if(u) window.open(u,'_blank'); return; }
  if(a==='openMp'){ toast('请在微信中搜索小程序：'+b.dataset.mp); return; }
  if(a==='saveApiBase'){
    const v = ($('#apiBase')?.value || '').trim();
    try{ localStorage.setItem('yuyu_api_base', v); }catch(e){}
    API.setBase(v);
    toast(v ? '后端地址已保存' : '已恢复纯本机模式');
    return;
  }
  if(a==='testApi'){
    const v = ($('#apiBase')?.value || '').trim();
    API.setBase(v);
    const box = $('#apiTestResult');
    if(box) box.textContent = '测试中…';
    API.online().then(ok=>{
      if(box) box.textContent = ok ? '✓ 连接成功' : '✗ 无法连接（离线模式）';
    });
    return;
  }
  // GitHub 数据备份（自动 / 可恢复）
  if(a==='saveGithubCfg'){
    const repo=($('#ghRepo')?.value||'').trim();
    const branch=($('#ghBranch')?.value||'').trim()||'main';
    const path=($('#ghPath')?.value||'').trim()||'yu-backup/data.json';
    const token=($('#ghToken')?.value||'').trim();
    const auto=!!$('#ghAuto')?.checked;
    const pass=($('#secPass')?.value||'').trim();
    if(!repo||!token){ toast('请填写仓库与 Token'); return; }
    const parts=repo.split('/');
    const owner=(parts[0]||'').trim(); const name=(parts[1]||'').trim();
    if(!owner||!name){ toast('仓库格式应为 owner/repo'); return; }
    (async()=>{
      let enc=false, storeToken=token;
      if(pass){
        try{ const r=await SECRET.seal(token, pass); storeToken=r.value; enc=r.enc; SECRET.gh=token; }
        catch(e){ toast('✗ 加密失败：'+(e.message||e)); return; }
      }
      saveGithubCfg({ owner, repo:name, branch, path, token:storeToken, enc, auto });
      startAutoBackup();
      toast('GitHub 备份配置已保存'+(enc?'（Token 已加密存储）':'')+(auto?'，自动备份已开启':''));
    })();
    return;
  }
  if(a==='githubBackup'){ githubBackupNow(); return; }
  if(a==='githubRestore'){
    if(!confirm('从 GitHub 恢复将覆盖当前本机数据，确定继续？')) return;
    githubRestoreNow(); return;
  }
  if(a==='openClock'){ if(typeof toggleRemindPop==='function') toggleRemindPop(); return; }
  // 作业批改 · 二级任务
  if(a==='newWordList'){ openForm({ title:'上传字词清单', fields:[
      { name:'title', label:'清单名称（如：九年级上册第一单元字词）' },
      { name:'grade', label:'适用年级', value:'九年级' },
      { name:'text', type:'textarea', label:'词语清单（每行一条：词语,拼音,释义）' },
    ], submitText:'保存', onSubmit:(p)=>{
      const words=p.text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
        .map(l=>{ const [w,py,mean]=l.split(/[,，\t]/).map(s=>s.trim()); return { w, py:py||'', mean:mean||'' }; }).filter(x=>x.w);
      if(!words.length) throw new Error('未解析到词语，请按「词语,拼音,释义」每行一条填写');
      DB.wordLists.unshift({ id:'w'+Date.now(), title:p.title||'未命名清单', grade:p.grade||'—', words });
      saveHomework(); $('#hwSub').innerHTML=wordView(); bindHomeworkSub();
      toast('字词清单已保存（演示，已本地保存）');
    }}); return; }
  if(a==='wordSelfTest'){ wordSelfTest(b.dataset.id); return; }
  if(a==='newPoem'){ openForm({ title:'上传诗文', fields:[
      { name:'title', label:'篇目（如：《岳阳楼记》）' },
      { name:'author', label:'作者' }, { name:'dynasty', label:'朝代/时期', value:'宋' },
      { name:'text', type:'textarea', label:'全文（用于默写比对）' },
    ], submitText:'保存', onSubmit:(p)=>{
      if(!p.text.trim()) throw new Error('请填写诗文全文');
      DB.poems.push({ id:'p'+Date.now(), title:p.title||'未命名', author:p.author||'佚名', dynasty:p.dynasty||'—', text:p.text.trim() });
      saveHomework(); $('#hwSub').innerHTML=poemView(); bindHomeworkSub();
      toast('诗文已上传（演示，已本地保存）');
    }}); return; }
  if(a==='poemUpload'){ const inp=document.querySelector('.poemFile[data-id="'+b.dataset.id+'"]'); if(inp) inp.click(); return; }
  if(a==='poemDiff'){ doPoemDiff(b.dataset.id, b.dataset.manual==='1'); return; }
  if(a==='newReading'){ openForm({ title:'上传阅读篇目', fields:[
      { name:'title', label:'篇目标题' }, { name:'grade', label:'适用年级', value:'九年级' },
      { name:'passage', type:'textarea', label:'阅读材料' },
      { name:'questions', type:'textarea', label:'题目（每行一题，答案用「|」分隔，如：概括主旨|赞美坚守与温情）' },
    ], submitText:'保存', onSubmit:(p)=>{
      const questions=p.questions.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
        .map(l=>{ const [q,a]=l.split(/[|｜]/).map(s=>s.trim()); return { q, a:a||'' }; }).filter(x=>x.q);
      if(!p.passage.trim()) throw new Error('请填写阅读材料');
      DB.readingExs.push({ id:'r'+Date.now(), title:p.title||'未命名', grade:p.grade||'—', passage:p.passage.trim(), questions });
      saveHomework(); $('#hwSub').innerHTML=readingExView(); bindHomeworkSub();
      toast('阅读篇目已保存（演示，已本地保存）');
    }}); return; }
  if(a==='readingReveal'){ const row=content.querySelector('[data-q="'+b.dataset.q+'"]'); if(!row) return;
    const ans=row.querySelector('.hide-ans'); const shown=ans.style.display!=='none';
    ans.style.display=shown?'none':'block'; b.textContent=shown?'显示答案':'隐藏答案'; return; }
  if(a==='newEssayCriteria'){ openForm({ title:'上传作文评价标准', fields:[
      { name:'title', label:'标准名称（如：中考记叙文评分标准）' },
      { name:'content', type:'textarea', label:'评分标准正文' },
    ], submitText:'保存', onSubmit:(p)=>{
      if(!p.content.trim()) throw new Error('请填写评分标准');
      DB.essayCriteria.push({ id:'c'+Date.now(), title:p.title||'未命名标准', content:p.content.trim() });
      saveHomework(); $('#hwSub').innerHTML=essayView(); bindHomeworkSub();
      toast('评价标准已上传（演示，已本地保存）');
    }}); return; }
  if(a==='useCriteria'){ toast('已选用该评价标准，学生上传批改时将作为评分依据'); return; }
  if(a==='essaySmartGrade'){ genEssayReport(b.dataset.manual==='1'); return; }
  if(a==='saveEssayGrade'){ const t=b.dataset.total||'?';
    DB.essayGrades.push({ id:'g'+Date.now(), total:t, date:todayStr() }); saveHomework();
    toast('作文批改已保存（'+t+' 分，演示，已本地保存）'); return; }
  // 备课中心 · 删除教案（真 CRUD）
  if(a==='delPlan'){
    const id = b.dataset.id;
    if(!id) return;
    if(!confirm('确定删除该教案？删除后不可恢复。')) return;
    DB.lessonPlans = (DB.lessonPlans||[]).filter(p=>p.id!==id);
    saveLessonPlans();
    const sub = $('#lessonSub'); if(sub){ sub.innerHTML = views.lessonPlanView(); }
    toast('教案已删除');
    return;
  }
  // 备课中心 · 新建教案（真 CRUD：存本机，刷新不丢）
  if(a==='newPlan'){
    openForm({ title:'📘 新建教案', fields:[
      { name:'title', label:'教案标题（如：《春》教学设计）' },
      { name:'unit', label:'所属单元（如：七上·第一单元）' },
      { name:'obj', label:'教学目标（一句话）' },
    ], submitText:'保存', onSubmit:(p)=>{
      if(!p.title.trim()) throw new Error('请填写教案标题');
      DB.lessonPlans.unshift({ id:'lp'+Date.now(), title:p.title.trim(), unit:p.unit.trim()||'未分组', obj:p.obj.trim()||'—', status:'草稿', type:'教案', updated:todayStr().replace(/-/g,'-').slice(5) });
      saveLessonPlans();
      const sub = $('#lessonSub'); if(sub){ sub.innerHTML = views.lessonPlanView(); }
      toast('教案已保存（本机）');
    }});
    return;
  }
  // 备课中心 · 进入备课台：弹出选择面板，用户选定网站后再跳转（避免一次性全开无效加载）
  if(a==='openUnit'){
    const unitName = b.dataset.unit || '';
    const sites = DB.sites || [];
    if(!sites.length){ toast('暂未配置备课网站，请先在「常用备课网址」添加'); return; }
    openUnitPicker(unitName, sites);
    return;
  }
  // 备课中心 · 编辑教案（站内编辑，存本机）
  if(a==='editPlan'){
    const id=b.dataset.id; const p=(DB.lessonPlans||[]).find(x=>x.id===id); if(!p) return;
    openForm({ title:'✏️ 编辑教案', fields:[
      { name:'title', label:'教案标题', value:p.title },
      { name:'unit', label:'所属单元', value:p.unit },
      { name:'obj', label:'教学目标（一句话）', value:p.obj },
      { name:'note', label:'教案正文（教学过程、重难点等）', type:'textarea', value:p.note||'' },
    ], submitText:'保存', onSubmit:(v)=>{
      if(!v.title.trim()) throw new Error('请填写标题');
      p.title=v.title.trim(); p.unit=v.unit.trim()||'未分组'; p.obj=v.obj.trim()||'—'; p.note=v.note||''; p.updated=todayStr().replace(/-/g,'-').slice(5);
      saveLessonPlans();
      const sub=$('#lessonSub'); if(sub) sub.innerHTML=views.lessonPlanView();
      toast('教案已更新（本机）');
    }});
    return;
  }
  // 备课中心 · 导出教案为 Word（.doc，Word 可直接打开）
  if(a==='exportPlan'){
    const id=b.dataset.id; const p=(DB.lessonPlans||[]).find(x=>x.id===id); if(!p) return;
    const html='<!doctype html><html><head><meta charset="utf-8"><title>'+escapeHtml(p.title)+'</title></head><body>'
      +'<h1>'+escapeHtml(p.title)+'</h1>'
      +'<p><b>所属单元：</b>'+escapeHtml(p.unit)+'</p>'
      +'<p><b>教学目标：</b>'+escapeHtml(p.obj)+'</p>'
      +'<h2>教案正文</h2><div>'+(p.note?escapeHtml(p.note).replace(/\n/g,'<br>'):'（暂无正文，可在站内「编辑」补充）')+'</div>'
      +'<hr><p style="color:#888;font-size:12px">由「语寓」备课中心导出</p></body></html>';
    const blob=new Blob([html],{type:'application/msword'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(p.title||'教案')+'.doc'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    toast('教案已导出为 Word（.doc）');
    return;
  }
  // 备课中心 · 上传资料 → 自动识别梳理成教案草案
  if(a==='uploadDraft'){
    openForm({ title:'📎 上传资料 · 自动梳理教案', fields:[
      { name:'files', label:'上传 Word / PDF / 图片 / TXT / MD（可多选）', type:'file', accept:'.doc,.docx,.pdf,.png,.jpg,.jpeg,.txt,.md' },
    ], submitText:'识别并生成教案', onSubmit:async (v)=>{
      const files=v.files; if(!files||!files.length) throw new Error('请先选择文件');
      const draft=await buildDraftFromFiles(files);
      DB.lessonPlans.unshift({ id:'lp'+Date.now(), title:draft.title, unit:draft.unit, obj:draft.obj, note:draft.note, status:'草稿', type:'教案', updated:todayStr().replace(/-/g,'-').slice(5) });
      saveLessonPlans();
      const sub=$('#lessonSub'); if(sub) sub.innerHTML=views.lessonPlanView();
      toast(draft.tip || '已从资料识别并生成教案草案，可在「编辑」中完善');
      const np=(DB.lessonPlans||[])[0];
      if(np) setTimeout(()=>{ handleAction('editPlan', { dataset:{ id:np.id } }); }, 350);
    }});
    return;
  }
  const map={ genCourseware:['备课','已生成课件大纲（演示版）'],
    newHW:['作业','分层作业设计（开发中）'], grade:['作业','批改界面（开发中）'], saveGrade:['作业','批改保存与家长端推送（开发中）'],
    uploadRes:['素材','上传素材（开发中）'], useRes:['素材','引用到备课（开发中）'],
    importScore:['学情','Excel 成绩导入（开发中）'], newNotice:['班主任','通知发布（开发中）'],
    addStudent:['班主任','新增学生表单（开发中）'],
    addAid:['班主任','新增资助表单（开发中）'],
    editCommittee:['班主任','班委调整表单（开发中）'],
    addTalk:['班级学情','新增谈话记录表单（开发中）'],
    export:['设置',`导出 ${b.dataset.f}（开发中）`],
    scanHonor:['荣誉登记册','荣誉录入（开发中）'], viewHonor:['荣誉登记册','荣誉原件查看（开发中）'],
    archiveHonor:['荣誉登记册','归档（开发中）'], exportHonor:['荣誉登记册','登记册导出（开发中）'] };
  const m=map[a]; if(m) toast(`${m[0]}：${m[1]}`);
}
function switchNav(view){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===view));
  render(view);
}

// ===== 智能体助手（前端轻量：规则引擎 + 可插拔 LLM + 浏览器通知 + 提醒轮询）=====
let agentHistory = [];
let agentReminders = [];
const AGENT_REMIND_KEY = 'yu_agent_reminders';
const AGENT_CFG_KEY = 'yu_agent_cfg';

function loadAgentReminders(){ try{ const s=localStorage.getItem(AGENT_REMIND_KEY); if(s) agentReminders=JSON.parse(s)||[]; }catch(e){ agentReminders=[]; } }
function saveAgentReminders(){ try{ localStorage.setItem(AGENT_REMIND_KEY, JSON.stringify(agentReminders)); }catch(e){} }
function loadAgentCfg(){ try{ const c=JSON.parse(localStorage.getItem(AGENT_CFG_KEY)||'null'); if(c&&c.enc===true){ return Object.assign({},c,{ key:(SECRET.ag!=null?SECRET.ag:'') }); } return c; }catch(e){ return null; } }
function saveAgentCfg(c){ try{ localStorage.setItem(AGENT_CFG_KEY, JSON.stringify(c)); }catch(e){} }

// 待办持久化（让智能体可增删待办并落盘）
function loadTodos(){ try{ const s=localStorage.getItem('yu_todos'); if(s){ const a=JSON.parse(s); if(Array.isArray(a)&&a.length){ a.forEach(t=>{ if(t.prio==null) t.prio=3; if(t.deadline==null) t.deadline=''; }); DB.todos=a; } } }catch(e){} }
function saveTodos(){ try{ localStorage.setItem('yu_todos', JSON.stringify(DB.todos||[])); }catch(e){} }

function initAgent(){
  if(document.getElementById('agentPanel')) return;
  const panel = el(`<div id="agentPanel" class="agent-panel" aria-hidden="true">
    <div class="agent-head"><span><img class="agent-avatar" src="img/wawa.png" alt="挖挖" />挖挖</span><div class="agent-head-btns">
      <button class="agent-ico" id="agentCfgBtn" title="大模型设置">⚙</button>
      <button class="agent-ico" id="agentClear" title="清空对话">🗑</button>
      <button class="agent-ico" id="agentClose" title="收起">×</button>
    </div></div>
    <div class="agent-msgs" id="agentMsgs"></div>
    <div class="agent-input-row">
      <input id="agentInput" class="agent-input" placeholder="加待办 批改作文 ｜ 今天课表 ｜ 提醒我 明天9点 交教案" />
      <button class="btn" id="agentSend">发送</button>
    </div>
  </div>`);
  document.body.appendChild(panel);
  const launcher = document.getElementById('agentLauncher');
  if(launcher) launcher.onclick = openAgent;
  document.getElementById('agentClose').onclick = closeAgent;
  document.getElementById('agentClear').onclick = ()=>{ agentHistory=[]; const m=document.getElementById('agentMsgs'); if(m) m.innerHTML=''; agentSay(agentGreeting()); };
  document.getElementById('agentCfgBtn').onclick = ()=>switchNav('settings');
  const input = document.getElementById('agentInput');
  const send = ()=>{ const v=input.value.trim(); if(!v) return; input.value=''; agentUser(v); agentSend(v); };
  document.getElementById('agentSend').onclick = send;
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
  agentSay(agentGreeting());
}
function agentGreeting(){
  const c = loadAgentCfg();
  return '你好，我是挖挖 🐸，你的工作台智能体助手。可以帮你：\n• 加待办 / 完成任务\n• 查今天课表、下一节课\n• 设提醒（到点弹通知）\n• 看班级学情、起草教案\n\n'
    + (c ? '（已接入大模型，可自由对话）' : '（当前为内置规则模式，去「个人与设置 → 挖挖」填 Key 可升级为自由对话）');
}
function openAgent(){ const p=document.getElementById('agentPanel'); if(!p) return; p.classList.add('open'); p.setAttribute('aria-hidden','false'); requestNotifyPerm(); const i=document.getElementById('agentInput'); if(i) setTimeout(()=>i.focus(),50); }
function closeAgent(){ const p=document.getElementById('agentPanel'); if(!p) return; p.classList.remove('open'); p.setAttribute('aria-hidden','true'); }
function agentSay(text){ const m=document.getElementById('agentMsgs'); if(!m) return; const d=el(`<div class="agent-msg bot">${escapeHtml(text).replace(/\n/g,'<br>')}</div>`); m.appendChild(d); m.scrollTop=m.scrollHeight; }
function agentUser(text){ const m=document.getElementById('agentMsgs'); if(!m) return; const d=el(`<div class="agent-msg user">${escapeHtml(text).replace(/\n/g,'<br>')}</div>`); m.appendChild(d); m.scrollTop=m.scrollHeight; }
function agentSend(text){
  agentHistory.push({role:'user', content:text});
  const cfg = loadAgentCfg();
  if(cfg && (cfg.key || (cfg.relay&&cfg.relay.trim()))){ agentLLM(text, cfg); }
  else { const r = agentRule(text); agentSay(r); agentHistory.push({role:'assistant', content:r}); }
}

// ---- 规则引擎 ----
function agentRule(text){
  const t = text.trim();
  let m;
  if(/^(完成|做完|搞定|已做|标记完成)\s*[:：]?\s*(.+)$/.test(t) || (m=t.match(/把?\s*(.+?)\s*(完成|做完|搞定|标记为已完成)/))){
    const name = (m? m[1] : t.replace(/^(完成|做完|搞定|已做|标记完成)\s*[:：]?/,''));
    return agentCompleteTodo(name.trim());
  }
  if((m=t.match(/^(加待办|添加任务|添加待办|新建待办|记个?任务|记一下|加任务|待办|待办：|待办:)\s*[:：]?\s*(.+)$/))){
    return agentAddTodo(m[2].trim());
  }
  if((m=t.match(/提醒我\s*(.+)$/))){
    const rest = m[1].trim();
    const wf = rest.match(/^(明天|后天|今天|周[一二三四五六日天])?\s*(\d{1,2}[:：]\d{1,2}|\d{1,2}\s*点|\d{1,2}\s*分钟)(.*)$/);
    const wl = rest.match(/^(.*?)\s*(明天|后天|今天|周[一二三四五六日天])?\s*(\d{1,2}[:：]\d{1,2}|\d{1,2}\s*点|\d{1,2}\s*分钟)\s*$/);
    if(wf && wf[3].trim()){ return agentSetReminder((wf[1]||'')+wf[2], wf[3].trim()); }
    if(wl && wl[1].trim()){ return agentSetReminder((wl[2]||'')+wl[3], wl[1].trim()); }
    return agentSetReminder(rest, rest); // 解析不出时间 → 引导
  }
  if(/(今天|今日).*(课表|课程|上什么|几节课)/.test(t) || /^(今天|今日)课表$/.test(t)){
    return agentTodaySchedule();
  }
  if(/(下?一?节?课|什么时候上课|几点上课|接下来上|后续课程)/.test(t)){
    return agentNextClass();
  }
  if(/(学情|成绩|均分|优秀率|薄弱|班级分析|班级情况)/.test(t)){
    return agentAnalyticsSummary();
  }
  if((m=t.match(/^(教案|备课|写?教案|帮我备?课)\s*[:：]?\s*(.+)$/)) || (m=t.match(/备?课\s*[:：]?\s*(.+)$/))){
    return agentDraftLesson((m[2]||'').trim());
  }
  if(/(帮助|你能|怎么用|会什么|功能|你好|hi|hello)/i.test(t)){
    return agentHelp();
  }
  return '我（挖挖）还在规则模式下，能帮你做这些：\n• 「加待办 批改作文」\n• 「完成 批改作文」\n• 「今天课表」「下节课」\n• 「提醒我 明天9点 交教案」\n• 「学情」「教案 岳阳楼记」\n\n去「个人与设置 → 挖挖」填大模型 Key，就能自由聊天啦。';
}

// ---- 工具层（操作工作台数据）----
function agentAddTodo(title){
  if(!title) return '请告诉我待办内容，例如：加待办 批改作文';
  const id = 'ta'+Date.now();
  const tag = /紧急|马上|立刻|急/.test(title) ? 'red' : (/重要|评审|发布/.test(title)?'amber':'blue');
  DB.todos = DB.todos||[];
  DB.todos.unshift({ id, t:title, n:1, tag });
  saveTodos();
  if(currentView==='dashboard' && dashTab==='overview'){ const c=document.querySelector('.todo-list'); if(c) render('dashboard'); }
  return '✅ 已添加待办：「'+title+'」\n可在工作台「工作进度 → 今日待办」查看，点 ✓ 即可完成。';
}
function agentCompleteTodo(name){
  if(!name) return '请告诉我完成哪一项，例如：完成 批改作文';
  const list = DB.todos||[];
  const t = list.find(x=>x.t.includes(name) || name.includes(x.t)) || list.find(x=>x.id===name);
  if(!t) return '没找到包含「'+name+'」的待办。当前待办：\n'+(list.map(x=>'· '+x.t).join('\n')||'（空）');
  if(todayDoneIds().includes(t.id)) return '「'+t.t+'」已经完成啦 👍';
  markTodoDone(t.id);
  return '🎉 已标记完成：「'+t.t+'」';
}
function agentTodaySchedule(){
  const wd = ((new Date().getDay()+6)%7)+1;
  const names = ['周一','周二','周三','周四','周五','周六','周日'];
  const tmap={}; (DB.periodTimes||[]).forEach(x=>tmap[x.p]=x.t);
  const today = (DB.classSchedule||[]).filter(s=>s.day===wd).sort((a,b)=>a.period-b.period);
  if(!today.length) return '今天（'+names[wd-1]+'）没有排课记录。';
  const lines = today.map(s=>`${tmap[s.period]||('第'+s.period+'节')} ${s.subject} · ${s.className}（${s.room}室）`);
  return '📅 今天（'+names[wd-1]+'）共 '+today.length+' 节：\n'+lines.join('\n');
}
function agentNextClass(){
  const info = nextClassInfo();
  if(!info) return '最近 7 天没有排课啦，享受一下～';
  const tmap={}; (DB.periodTimes||[]).forEach(x=>tmap[x.p]=x.t);
  const when = info.off===0 ? '今天 '+tmap[info.s.period] : (info.off===1?'明天':'第'+info.off+'天')+' '+tmap[info.s.period];
  return '⏰ 下一节课：'+when+' '+info.s.subject+' · '+info.s.className+'（'+info.s.room+'室）';
}
function agentSetReminder(when, what){
  const at = parseReminderTime(when);
  if(!at) return '没太看懂时间「'+when+'」，试试：「提醒我 明天9点 交教案」或「提醒我 30分钟 后喝水」';
  const r = { id:'rm'+Date.now(), at: at.getTime(), text: what, done:false };
  agentReminders.push(r); saveAgentReminders();
  const whenStr = at.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  return '⏰ 好嘞，我会在 '+whenStr+' 提醒你：「'+what+'」\n（需保持本页面打开，到点弹通知）';
}
function parseReminderTime(s){
  s=s.trim(); const now=new Date(); let base=new Date(now);
  let m=s.match(/(\d+)\s*分钟/); if(m){ base.setMinutes(now.getMinutes()+Number(m[1])); return base; }
  m=s.match(/(\d+)\s*小时/); if(m){ base.setHours(now.getHours()+Number(m[1])); return base; }
  if(/明天/.test(s)) base.setDate(now.getDate()+1);
  else if(/后天/.test(s)) base.setDate(now.getDate()+2);
  else { const wk=s.match(/周([一二三四五六日天])/); if(wk){ const map={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7,'天':7}; const target=map[wk[1]]; let cur=((now.getDay()+6)%7)+1; let off=(target-cur+7)%7; if(off===0) off=7; base.setDate(now.getDate()+off); } }
  let tm=s.match(/(\d{1,2})[:：](\d{1,2})/); if(tm){ base.setHours(Number(tm[1]),Number(tm[2]),0,0); return base; }
  tm=s.match(/(\d{1,2})\s*点/); if(tm){ base.setHours(Number(tm[1]),0,0,0); return base; }
  return null;
}
function agentAnalyticsSummary(){
  const c = DB.classScores;
  if(!c) return '暂未学情数据。';
  const radar = (c.radar||[]).map(r=>r.d+' '+r.v).join('、');
  const weak = (c.weak||[]).slice(0,3).map(w=>w.k+'('+w.v+'%)').join('、');
  return '📊 '+c.name+' 学情速览：\n均分 '+c.avg+'，优秀率 '+(c.excellent!=null?c.excellent+'%':'—')+'\n核心素养：'+radar+'\n薄弱点（已推送复习包）：'+weak;
}
function agentDraftLesson(topic){
  if(!topic || topic==='（未指定篇目）') topic='（未指定篇目）';
  return '📝 已为你起草《'+topic+'》教案框架：\n一、教学目标（语言/思维/审美/文化）\n二、重难点\n三、情境导入（3 min）\n四、任务链（诵读→探究→表达）\n五、分层作业（基础/拓展）\n六、板书设计\n\n（完整教案可在「备课中心」继续细化）';
}
function agentHelp(){
  return '我能帮你处理工作台上的事：\n• 加待办：加待办 批改作文\n• 完成：完成 批改作文\n• 课表：今天课表 / 下节课\n• 提醒：提醒我 明天9点 交教案\n• 学情：班级成绩 / 薄弱点\n• 教案：教案 岳阳楼记\n\n填了大模型 Key 后，还能自由对话、帮你写文案～';
}

// ---- 浏览器通知 + 提醒轮询 ----
function requestNotifyPerm(){ try{ if(typeof Notification!=='undefined' && Notification.permission==='default'){ Notification.requestPermission().catch(()=>{}); } }catch(e){} }
function notify(title, body){ try{ if(typeof Notification!=='undefined' && Notification.permission==='granted'){ new Notification(title,{body}); } }catch(e){} toast(title+'：'+body); }
function checkAgentReminders(){
  const now = Date.now(); let fired=false;
  agentReminders.forEach(r=>{ if(!r.done && r.at<=now){ r.done=true; fired=true; notify('⏰ 挖挖提醒', r.text); } });
  if(fired) saveAgentReminders();
}

// ---- 可插拔 LLM（OpenAI 兼容 /chat/completions + 工具循环）----
const AGENT_TOOLS = [
  { type:'function', function:{ name:'add_todo', description:'添加一条今日待办', parameters:{ type:'object', properties:{ title:{type:'string',description:'待办内容'} }, required:['title'] } } },
  { type:'function', function:{ name:'complete_todo', description:'按名称完成一条待办', parameters:{ type:'object', properties:{ name:{type:'string',description:'待办名称关键词'} }, required:['name'] } } },
  { type:'function', function:{ name:'today_schedule', description:'查询今天课表', parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'set_reminder', description:'设置一个提醒', parameters:{ type:'object', properties:{ when:{type:'string',description:'时间，如 明天9点'}, what:{type:'string',description:'提醒内容'} }, required:['when','what'] } } },
  { type:'function', function:{ name:'analytics_summary', description:'班级学情摘要', parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'draft_lesson', description:'起草教案框架', parameters:{ type:'object', properties:{ topic:{type:'string',description:'篇目/主题'} }, required:['topic'] } } },
];
function agentToolCall(name, args){
  switch(name){
    case 'add_todo': return agentAddTodo(args.title);
    case 'complete_todo': return agentCompleteTodo(args.name);
    case 'today_schedule': return agentTodaySchedule();
    case 'set_reminder': return agentSetReminder(args.when, args.what);
    case 'analytics_summary': return agentAnalyticsSummary();
    case 'draft_lesson': return agentDraftLesson(args.topic);
    default: return '';
  }
}
// 统一的智能体对话请求：若配置「中继地址」则经中继转发（密钥由中继保管，彻底绕过浏览器跨域），否则直连供应商
async function agentChat(cfg, payload){
  if(cfg.relay && cfg.relay.trim()){
    const r = await fetch(cfg.relay.trim(), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    if(!r.ok) throw new Error('relay '+r.status);
    return await r.json();
  }
  const url = (cfg.base || 'https://api.openai.com/v1') + '/chat/completions';
  const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key}, body:JSON.stringify(payload) });
  if(!r.ok) throw new Error('provider '+r.status);
  return await r.json();
}
async function agentLLM(text, cfg){
  agentSay('（思考中…）');
  const msgs = agentHistory.map(m=>({role:m.role, content:m.content}));
  msgs.unshift({role:'system', content:'你是语寓教师工作台的智能体助手，名字叫「挖挖」（一只浅绿色拟人小青蛙）。你性格可爱活泼、热情主动，回复简洁、用中文，可用 emoji。可调用工具处理待办/课表/提醒/学情/教案。'});
  const clearThinking = ()=>{ document.querySelectorAll('#agentMsgs .agent-msg.bot').forEach((n,i,a)=>{ if(i===a.length-1 && n.textContent.indexOf('思考中')>=0) n.remove(); }); };
  try{
    const payload = {model:cfg.model||'gpt-4o-mini', messages:msgs, tools:AGENT_TOOLS, tool_choice:'auto'};
    let data = await agentChat(cfg, payload);
    let msg = data.choices && data.choices[0] && data.choices[0].message;
    if(!msg){ clearThinking(); agentSay('（模型返回异常：'+(data.error&&data.error.message||'未知错误')+'）'); return; }
    let round=0;
    while(msg.tool_calls && round<3){
      const results=[];
      for(const tc of msg.tool_calls){ const fn=JSON.parse(tc.function.arguments||'{}'); results.push({role:'tool',tool_call_id:tc.id,content:agentToolCall(tc.function.name,fn)}); }
      msgs.push(msg); msgs.push(...results);
      data = await agentChat(cfg, {model:cfg.model||'gpt-4o-mini', messages:msgs, tools:AGENT_TOOLS, tool_choice:'auto'});
      msg = data.choices && data.choices[0] && data.choices[0].message; round++;
    }
    const reply = (msg.content||'').trim() || '（已处理）';
    clearThinking(); agentSay(reply); agentHistory.push({role:'assistant', content:reply});
  }catch(e){
    clearThinking();
    const msg=(e&&e.message)||String(e);
    if(/Failed to fetch|NetworkError|Load failed|TypeError|relay|provider/i.test(msg)){
      agentSay('（大模型调用失败：网络不可达，或被接口服务跨域(CORS)拦截。建议填写「🌉 中继地址」绕过跨域——在你自己的中继服务（如 Cloudflare Worker）里保管密钥与接口地址，浏览器只把对话内容发往中继。）');
    } else {
      agentSay('（大模型调用失败：'+msg+'。请检查 Key / 接口地址 / 网络，或切回规则模式。）');
    }
  }
}

// 测试挖挖大模型连接（填完 Key 后可一键验证是否可用）
function testAgentConn(){
  const base=($('#agentBase').value||'').trim(), model=($('#agentModel').value||'').trim(), key=($('#agentKey').value||'').trim(), relay=($('#agentRelay').value||'').trim();
  const box=$('#agentTestResult');
  if(!key && !relay){ if(box) box.innerHTML='<span style="color:var(--red)">请先填写 API Key，或填写中继地址</span>'; return; }
  if(box) box.textContent='连接测试中…';
  const payload={model:model||'gpt-4o-mini', messages:[{role:'system',content:'ping'},{role:'user',content:'hi'}], max_tokens:5};
  if(relay){
    fetch(relay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(r=>{
        if(r.ok){ if(box) box.innerHTML='<span style="color:var(--accent-strong)">✅ 中继连接成功，保存后挖挖即可 AI 接管</span>'; }
        else { if(box) box.innerHTML='<span style="color:var(--red)">❌ 中继返回 '+r.status+'，请检查中继服务的 BASE_URL / API_KEY 配置</span>'; }
      })
      .catch(e=>{ if(box) box.innerHTML='<span style="color:var(--red)">❌ 中继不可达：'+(e.message||e)+'。请确认中继网址正确且已部署。</span>'; });
    return;
  }
  const url=(base||'https://api.openai.com/v1')+'/chat/completions';
  const head={'Content-Type':'application/json','Authorization':'Bearer '+key};
  fetch(url,{method:'POST',headers:head,body:JSON.stringify(payload)})
    .then(r=>{
      if(r.ok){ if(box) box.innerHTML='<span style="color:var(--accent-strong)">✅ 连接成功，保存后挖挖即可 AI 接管</span>'; }
      else if(r.status===401||r.status===403){ if(box) box.innerHTML='<span style="color:var(--red)">❌ 密钥无效或权限不足（'+r.status+'），请检查 Key 是否正确</span>'; }
      else { if(box) box.innerHTML='<span style="color:var(--red)">❌ 接口返回 '+r.status+'，请检查接口地址与模型名</span>'; }
    })
    .catch(e=>{ if(box) box.innerHTML='<span style="color:var(--red)">❌ 网络不可达，或被接口跨域(CORS)拦截：'+(e.message||e)+'。<br>国内聚合商多不允许浏览器直连，请改用「🌉 中继地址」。</span>'; });
}

// 待办按钮
$('#todoBtn').onclick=()=>switchNav('dashboard');
// 数据备份按钮（JSON 导入 / 导出）
$('#backupBtn').onclick=()=>openBackupModal();
// 顶部全局搜索
bindGlobalSearch();
// 导航
document.querySelectorAll('.nav-item').forEach(n=>n.onclick=()=>switchNav(n.dataset.view));
// 初始化：尝试用演示账号登录后端（离线时静默失败，原型仍可用）
(async()=>{ try{ await API.login('lin@school.cn','123456'); }catch(e){} })();
// 后端 API 地址：读取本地已保存的配置（设置页可改，留空则纯本机模式）
try{ const ab = localStorage.getItem('yuyu_api_base') || ''; if(ab) API.setBase(ab); }catch(e){}
// 头像 / 昵称：读取本地设置并渲染，点击头像即可修改
loadSchedule(); // 读取本地已保存的课表（手动编辑/Excel 导入结果）
loadHomeworkData(); // 读取本地已保存的作业批改二级任务数据
loadSites();        // 读取本地已保存的备课网址聚合（首次沿用 DB.sites 兜底）
loadLessonPlans(); // 读取本地已保存的教案（新建/重命名真实保存）
loadTodoDone();   // 读取今日已完成待办（按日期）
loadTodos();      // 读取本地已保存的待办（智能体可增删）
loadComments();   // 读取已生成的操行评语（本地保存）
loadAgentReminders(); // 读取智能体提醒
initAgent();      // 创建智能体助手面板（悬浮入口 + 聊天抽屉）
loadProfile();
renderAvatar();
loadBg(); // 应用个性化背景（个人与设置）
SECRET.init(); // 凭据加密会话：识别是否已加密，决定是否需解锁
startAutoBackup(); // 启动 GitHub 自动备份（若已开启）
startRemind(); // 启动右上角上课提醒闹钟图标
['#sideAvatar'].forEach(sel=>{ const x=$(sel); if(x) x.onclick=openAvatarEditor; });
// 注册 Service Worker（PWA：可安装到手机主屏 / 离线可用；file:// 或旧浏览器自动跳过）
if('serviceWorker' in navigator){ window.addEventListener('load', ()=>{ try{ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }catch(e){} }); }
// 初始化 · 全局点击委托（一次注册，自动覆盖所有动态重渲的 [data-action] / [data-go] 元素，
// 修复二级标签切换后新渲染按钮无绑定的问题，如备课中心「常用备课网址」的打开网站按钮）
content.addEventListener('click', e=>{
  const act = e.target.closest('[data-action]');
  if(act){ handleAction(act.dataset.action, act); return; }
  const go = e.target.closest('[data-go]');
  if(go){ switchNav(go.dataset.go); }
});
// 初始化
render('dashboard');
