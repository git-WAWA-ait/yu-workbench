// ===== 文枢 · 后端 API 客户端（带 mock 兜底）=====
// 使用：window.API.listSafety() / createSafety() / ...
// 返回 null 表示离线或请求失败，调用方应回退到本地 mock 数据。
window.API = (function(){
  let BASE = window.API_BASE || 'http://127.0.0.1:8000';
  const TOKEN_KEY = 'wenxu_token';
  let token = localStorage.getItem(TOKEN_KEY) || '';

  function setToken(t){ token = t || ''; if(t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }
  function setBase(url){ BASE = (url || '').replace(/\/+$/,''); }
  function authHeaders(){
    const h = { 'Content-Type':'application/json' };
    if(token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  async function req(method, path, body){
    const opt = { method, headers: authHeaders() };
    if(body !== undefined) opt.body = JSON.stringify(body);
    const r = await fetch(BASE + path, opt);
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  }
  function get(path){ return req('GET', path); }
  function post(path, body){ return req('POST', path, body); }
  function del(path){ return req('DELETE', path); }

  // 登录拿 JWT（离线时静默失败）
  async function login(email, password){
    try{ const j = await post('/api/auth/login', { email, password }); if(j && j.token){ setToken(j.token); return true; } }catch(e){}
    return false;
  }
  async function online(){ try{ const r = await fetch(BASE + '/'); return r.ok; }catch(e){ return false; } }

  // —— 列表类：离线返回 null，由调用方回退 mock ——
  async function listSafety(){ try{ return await get('/api/safety'); }catch(e){ return null; } }
  async function listMeetings(){ try{ return await get('/api/meeting'); }catch(e){ return null; } }
  async function getReminders(date){ try{ return await get('/api/reminders?date=' + encodeURIComponent(date)); }catch(e){ return null; } }

  // —— 写类：失败会抛错，由调用方做离线兜底 ——
  function createSafety(d){ return post('/api/safety', d); }
  function deleteSafety(id){ return del('/api/safety/' + id); }
  function createMeeting(d){ return post('/api/meeting', d); }
  function deleteMeeting(id){ return del('/api/meeting/' + id); }

  return {
    BASE, login, online, setBase, setToken,
    listSafety, createSafety, deleteSafety,
    listMeetings, createMeeting, deleteMeeting,
    getReminders,
    get token(){ return token; }
  };
})();
