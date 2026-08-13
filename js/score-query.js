/* 成绩自助查询（独立页）— 外部脚本，便于配合 CSP 生效 */
(function(){
  if(!window.DB || !DB.examScores){
    document.getElementById('scoreResult').innerHTML =
      '<div class="card"><div class="muted">成绩数据未能加载（请确保与 css/、js/ 同目录打开）。</div></div>'; return;
  }

  var exams = DB.examScores;
  var keys = ['monthly','mid','final'];

  var ex = document.getElementById('qExam');
  ex.innerHTML = keys.map(function(k){ return '<option value="'+k+'">'+exams[k].name+'</option>'; }).join('');

  // 深链预填：?exam=mid&name=王思远（查询码绝不进 URL）
  var p = new URLSearchParams(location.search);
  if(p.get('exam') && exams[p.get('exam')]) ex.value = p.get('exam');
  if(p.get('name')) document.getElementById('qName').value = p.get('name');

  function rankRows(rows){
    var t = rows.map(function(r){ return Object.assign({}, r,
      { total: Object.values(r.s).reduce(function(a,b){return a+b;},0) }); });
    t.sort(function(a,b){ return b.total - a.total; });
    return t.map(function(r,i){ return Object.assign({}, r, { rank:i+1 }); });
  }

  function scoreResultCard(examKey, r){
    var ex = DB.examScores[examKey];
    var sub = DB.examSubjects;
    return '<div class="card">' +
      '<div class="flex between mb12">' +
        '<div class="section-title" style="margin:0">📄 '+ex.name+'（'+ex.date+'） · '+r.name+' 成绩</div>' +
        '<span class="tag blue">班名 '+r.rank+' / '+ex.rows.length+'</span>' +
      '</div>' +
      '<table class="mt16"><thead><tr><th>科目</th>'+sub.map(function(s){return '<th>'+s+'</th>';}).join('')+'<th>总分</th></tr></thead>' +
        '<tbody><tr><td><b>得分</b></td>'+sub.map(function(s){return '<td>'+r.s[s]+'</td>';}).join('')+'<td><b>'+r.total+'</b></td></tr></tbody></table>' +
      '<div class="muted mt12" style="font-size:12px">查询结果仅本人可见；学校留存原始成绩用于学情分析</div>' +
    '</div>';
  }

  function doQuery(){
    var exam = ex.value;
    var name = document.getElementById('qName').value.trim();
    var code = document.getElementById('qCode').value.trim().toUpperCase();
    var box = document.getElementById('scoreResult');
    if(!name || !code){ box.innerHTML = '<div class="card"><div class="muted">请填写姓名与私密查询码。</div></div>'; return; }
    var ranked = rankRows(DB.examScores[exam].rows);
    var r = ranked.find(function(x){ return x.name===name && (x.code||'').toUpperCase()===code; });
    if(!r){ box.innerHTML = '<div class="card"><div class="muted">未查询到匹配记录，请核对姓名与私密查询码。</div></div>'; return; }
    box.innerHTML = scoreResultCard(exam, r);
  }

  function doShare(){
    var exam = ex.value;
    var name = document.getElementById('qName').value.trim();
    var base = location.href.split('?')[0];
    var url = base + '?exam=' + encodeURIComponent(exam) + (name ? '&name=' + encodeURIComponent(name) : '');
    var btn = document.getElementById('btnShare');
    var orig = btn.textContent;
    function ok(){ btn.textContent='✓ 已复制'; btn.disabled=true; setTimeout(function(){ btn.textContent=orig; btn.disabled=false; }, 1800); }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(ok, function(){ window.prompt('复制以下链接分享给学生 / 家长：', url); });
    } else {
      window.prompt('复制以下链接分享给学生 / 家长：', url);
    }
  }

  document.getElementById('btnQuery').onclick = doQuery;
  document.getElementById('btnShare').onclick = doShare;
  ['qName','qCode'].forEach(function(id){
    document.getElementById(id).addEventListener('keydown', function(e){ if(e.key==='Enter') doQuery(); });
  });
})();
