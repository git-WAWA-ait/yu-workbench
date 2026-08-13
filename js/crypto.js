/* 凭据加密存储（Web Crypto：PBKDF2 + AES-GCM）
 * 用途：把 GitHub Token / 大模型 API Key 以「口令 + 浏览器原生加密」形式存到 localStorage，
 *       明文不再落盘；口令仅存于本次会话内存（SECRET_PASS），关闭页面即失效。
 * 依赖：window.crypto.subtle（现代浏览器均支持；file:// 或非安全上下文会优雅降级）。
 */
const YuCrypto = (function () {
  function supported() { return !!(window.crypto && crypto.subtle); }
  function bufToB64(buf) { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function b64ToBuf(b64) { const s = atob(b64); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
  function importKey(pass) { return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), { name: 'PBKDF2' }, false, ['deriveKey']); }
  async function deriveKey(pass, salt) {
    const base = await importKey(pass);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  // 返回 'yuv1.<salt>.<iv>.<ct>' 形式，全部 base64
  async function encrypt(plaintext, pass) {
    if (!supported()) throw new Error('当前环境不支持 Web Crypto（需 https 或 localhost）');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pass, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext || ''));
    return 'yuv1.' + bufToB64(salt) + '.' + bufToB64(iv) + '.' + bufToB64(ct);
  }
  async function decrypt(payload, pass) {
    if (!supported()) throw new Error('当前环境不支持 Web Crypto（需 https 或 localhost）');
    const parts = String(payload).split('.');
    if (parts[0] !== 'yuv1' || parts.length !== 4) throw new Error('密文格式错误');
    const salt = b64ToBuf(parts[1]), iv = b64ToBuf(parts[2]), ct = b64ToBuf(parts[3]);
    const key = await deriveKey(pass, salt);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(pt);
  }
  function isEncrypted(v) { return typeof v === 'string' && v.indexOf('yuv1.') === 0; }
  return { encrypt, decrypt, isEncrypted, supported };
})();
