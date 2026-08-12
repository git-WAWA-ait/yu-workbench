// 语寓工作台 · 挖挖大模型中继（Cloudflare Worker）
//
// 作用：把浏览器发来的对话请求转发到真实大模型接口，并加上 CORS 响应头，
//       从而绕过「静态站点（GitHub Pages）直连大模型被跨域(CORS)拦截」的问题。
//
// 部署步骤（免费，只需邮箱注册，无需绑卡）：
//   1. 打开 https://dash.cloudflare.com → 左侧「Workers & Pages」→「Create Worker」
//   2. 把本文件全部内容粘贴进去，点「Deploy」
//   3. 进入该 Worker → Settings → Variables → 添加两个环境变量（点 Encrypt 加密保存）：
//        BASE_URL = 你的接口地址（含 /v1），如 https://api.deepseek.com/v1
//        API_KEY = 你的模型密钥，如 sk-xxxx
//   4. 部署完成后会得到一个 *.workers.dev 网址，把它填到工作台
//      「个人与设置 → 🐸 挖挖（大模型）→ 🌉 中继地址」即可。
//
// 安全说明：密钥只存在 Worker 的环境变量里，浏览器/前端永远看不到；
//          前端只把对话内容（model / messages / tools）发往中继，密钥不落地前端。

export default {
  async fetch(request, env){
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    // CORS 预检
    if(request.method === 'OPTIONS'){
      return new Response(null, { status: 204, headers: cors });
    }
    if(request.method !== 'POST'){
      return new Response('只接受 POST {model,messages,...}', { status: 405, headers: cors });
    }
    try{
      const body = await request.json();
      const upstream = (env.BASE_URL || 'https://api.openai.com/v1') + '/chat/completions';
      const upstreamRes = await fetch(upstream, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (env.API_KEY || ''),
        },
        body: JSON.stringify(body),
      });
      const text = await upstreamRes.text();
      return new Response(text, {
        status: upstreamRes.status,
        headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors),
      });
    }catch(e){
      return new Response(JSON.stringify({ error: { message: String(e) } }), {
        status: 500,
        headers: Object.assign({ 'Content-Type': 'application/json' }, cors),
      });
    }
  }
};
