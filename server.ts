import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Files
const IPS_FILE = path.join(process.cwd(), 'allowed-ips.json');
const CONSULTATIONS_FILE = path.join(process.cwd(), 'consultations.json');
const SESSIONS_FILE = path.join(process.cwd(), 'admin-sessions.json');
const LOGS_FILE = path.join(process.cwd(), 'admin-access-logs.json');

// Interface definitions
interface AllowedIp {
  ip: string;
  createdAt: string;
  lastLoginAt: string;
  memo: string;
}

interface LoginTracker {
  attempts: number;
  lockedUntil: number;
}

// Memory lock state
const loginTrackers: Record<string, LoginTracker> = {};

// Helper to load parsed allowed IPs
function getAllowedIpsParsed(): AllowedIp[] {
  if (fs.existsSync(IPS_FILE)) {
    try {
      const data = fs.readFileSync(IPS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (typeof item === 'string') {
            return {
              ip: item,
              createdAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
              lastLoginAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
              memo: '기존 등록 IP'
            };
          }
          return {
            ip: item.ip || '',
            createdAt: item.createdAt || new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
            lastLoginAt: item.lastLoginAt || new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
            memo: item.memo || ''
          };
        }).filter(item => item.ip);
      }
    } catch (e) {
      console.error('Failed to parse allowed-ips.json', e);
    }
  }
  return [];
}

// Helper to save allowed IP objects
function saveAllowedIpsObj(ips: AllowedIp[]) {
  fs.writeFileSync(IPS_FILE, JSON.stringify(ips, null, 2), 'utf-8');
}

// Get raw IP array for fast lookups
function getAllowedIps(): string[] {
  return getAllowedIpsParsed().map(item => item.ip);
}

// Helper to load consultations
function getConsultations(): any[] {
  if (fs.existsSync(CONSULTATIONS_FILE)) {
    try {
      const data = fs.readFileSync(CONSULTATIONS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse consultations.json', e);
    }
  }
  return [];
}

// Helper to save consultations
function saveConsultations(data: any[]) {
  fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to load active session tokens
function getSessions(): string[] {
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
    } catch (e) {
      // Ignore
    }
  }
  return [];
}

// Helper to save active session tokens
function saveSessions(sessions: string[]) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

// Helper to append a security/access log
function appendAccessLog(log: any) {
  let logs: any[] = [];
  if (fs.existsSync(LOGS_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    } catch (e) {
      console.error('Failed to parse admin-access-logs.json', e);
    }
  }
  logs.unshift(log);
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 500), null, 2), 'utf-8'); // Keep last 500 records
}

// Detect client IP address (highly reliable behind reverse proxy/Nginx)
function getClientIp(req: express.Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = (typeof xForwardedFor === 'string' ? xForwardedFor : xForwardedFor[0]).split(',');
    const primaryIp = ips[0].trim();
    if (primaryIp.startsWith('::ffff:')) {
      return primaryIp.substring(7);
    }
    return primaryIp;
  }
  const remoteIp = req.socket.remoteAddress || '127.0.0.1';
  if (remoteIp.startsWith('::ffff:')) {
    return remoteIp.substring(7);
  }
  if (remoteIp === '::1') {
    return '127.0.0.1';
  }
  return remoteIp;
}

// Helper to get structured device, OS, browser, and location information
function getClientMeta(req: express.Request) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  let deviceType = "PC";
  if (/iPad|Tablet/i.test(userAgent)) {
    deviceType = "태블릿";
  } else if (/Mobile|Android|iPhone/i.test(userAgent)) {
    deviceType = "모바일";
  }

  let os = "기타 OS";
  if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/Macintosh|Mac OS/i.test(userAgent)) os = "macOS";
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(userAgent)) os = "iOS";
  else if (/Linux/i.test(userAgent)) os = "Linux";

  let browser = "기타 브라우저";
  if (/SamsungBrowser/i.test(userAgent)) browser = "Samsung Internet";
  else if (/Edge|Edg/i.test(userAgent)) browser = "Edge";
  else if (/Chrome/i.test(userAgent)) {
    if (/CriOS/i.test(userAgent)) browser = "Chrome (iOS)";
    else browser = "Chrome";
  }
  else if (/Safari/i.test(userAgent)) browser = "Safari";
  else if (/Firefox/i.test(userAgent)) browser = "Firefox";

  const dateKST = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return {
    ip: clientIp,
    deviceType,
    os,
    browser,
    userAgent,
    timestamp: dateKST
  };
}

// Helper to inspect IP lock status
function isIpLocked(ip: string): { locked: boolean; remainingSec: number } {
  const tracker = loginTrackers[ip];
  if (tracker) {
    if (tracker.attempts >= 5 && Date.now() < tracker.lockedUntil) {
      return { locked: true, remainingSec: Math.ceil((tracker.lockedUntil - Date.now()) / 1000) };
    }
    if (tracker.attempts >= 5 && Date.now() >= tracker.lockedUntil) {
      delete loginTrackers[ip];
    }
  }
  return { locked: false, remainingSec: 0 };
}

// Auto-bootstrap: If the list is empty, or only contains loopback/localhost IPs,
// and we detect a valid external client IP, automatically bootstrap it.
app.use((req, res, next) => {
  const clientIp = getClientIp(req);
  let ipsObj = getAllowedIpsParsed();
  
  const isDefaultOnly = ipsObj.length === 0 || 
                        ipsObj.every(item => item.ip === '127.0.0.1' || item.ip === '::1' || item.ip === 'localhost');
                        
  if (isDefaultOnly && clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1' && clientIp !== 'localhost' && clientIp !== 'unknown') {
    if (!ipsObj.some(item => item.ip === clientIp)) {
      const dateKST = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      ipsObj.push({
        ip: clientIp,
        createdAt: dateKST,
        lastLoginAt: dateKST,
        memo: '자동 추가된 초기 외부 IP'
      });
      saveAllowedIpsObj(ipsObj);
      console.log(`[Bootstrap] Automatically whitelisted initial external visitor IP: ${clientIp}`);
    }
  }
  next();
});

// Middleware to verify if admin has a valid session token AND client IP is whitelisted
function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const sessions = getSessions();

  if (!token || !sessions.includes(token)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '로그인이 필요합니다.'
    });
  }

  // Token is valid! Now check IP Whitelisting
  const clientIp = getClientIp(req);
  const ips = getAllowedIps();

  const isIpAuthorized = ips.includes(clientIp) || 
                         clientIp === '127.0.0.1' || 
                         clientIp === 'localhost' ||
                         clientIp === '::1';

  if (!isIpAuthorized) {
    return res.status(403).json({
      error: 'IpNotWhitelisted',
      message: '현재 IP가 허용 목록에 없습니다.',
      detectedIp: clientIp
    });
  }

  next();
}

// ==========================================
// Public API Endpoints
// ==========================================

// 1. Get client IP and authorization status
app.get('/api/my-ip', (req, res) => {
  const clientIp = getClientIp(req);
  const ips = getAllowedIps();
  const isAuthorized = ips.includes(clientIp) || 
                       clientIp === '127.0.0.1' || 
                       clientIp === 'localhost' ||
                       clientIp === '::1';
  res.json({
    ip: clientIp,
    allowedIps: ips,
    isAuthorized
  });
});

// 2. Submit a new consultation request
app.post('/api/consultations', (req, res) => {
  const newReq = req.body;
  if (!newReq.name || !newReq.contact) {
    return res.status(400).json({ error: '이름과 연락처는 필수 입력 항목입니다.' });
  }

  const clientMeta = getClientMeta(req);
  const clientIp = clientMeta.ip;

  const clientMetaInput = newReq.submitMeta || {};

  newReq.submitMeta = {
    ipAddress: clientIp || clientMetaInput.ipAddress || 'unknown',
    deviceType: clientMeta.deviceType || clientMetaInput.deviceType || 'PC',
    os: clientMeta.os || clientMetaInput.os || '기타 OS',
    browser: clientMeta.browser || clientMetaInput.browser || '기타 브라우저',
    userAgent: clientMeta.userAgent || clientMetaInput.userAgent || '',
    pageUrl: clientMetaInput.pageUrl || req.headers['referer'] || req.headers['origin'] || '',
    submittedAt: clientMeta.timestamp || clientMetaInput.submittedAt || newReq.submittedAt || ''
  };
  
  const consultations = getConsultations();
  consultations.unshift(newReq);
  saveConsultations(consultations);
  res.json({ success: true, data: newReq });
});

// 3. Admin Login API with lockout and emergency overrides
app.post('/api/admin/login', (req, res) => {
  const { id, password, emergencyPassword } = req.body;
  const clientMeta = getClientMeta(req);
  const clientIp = clientMeta.ip;

  // Check Lock status
  const lockStatus = isIpLocked(clientIp);
  if (lockStatus.locked) {
    appendAccessLog({
      timestamp: clientMeta.timestamp,
      ip: clientIp,
      deviceType: clientMeta.deviceType,
      browser: `${clientMeta.os} / ${clientMeta.browser}`,
      success: false,
      action: 'login_locked_attempt',
      details: `차단된 IP 로그인 시도 (남은 시간: ${lockStatus.remainingSec}초)`
    });
    return res.status(429).json({
      error: 'Locked',
      message: `로그인 시도가 5회 실패하여 10분간 로그인 시도가 제한됩니다. (남은 시간: ${lockStatus.remainingSec}초)`
    });
  }

  // Loaded from environment with robust fallbacks
  const sysId = process.env.ADMIN_ID || 'admin';
  const sysPw = process.env.ADMIN_PASSWORD || 'admin1234';
  const sysEmerg = process.env.EMERGENCY_PASSWORD || 'emergency911';

  if (id === sysId && password === sysPw) {
    // Reset attempts on successful verification
    if (loginTrackers[clientIp]) {
      delete loginTrackers[clientIp];
    }

    const token = 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const sessions = getSessions();
    sessions.push(token);
    saveSessions(sessions);

    const ips = getAllowedIps();
    let isIpWhitelisted = ips.includes(clientIp) || 
                          clientIp === '127.0.0.1' || 
                          clientIp === 'localhost' ||
                          clientIp === '::1';

    // Check emergency override
    if (!isIpWhitelisted && emergencyPassword) {
      if (emergencyPassword === sysEmerg) {
        // Auto-whitelist current IP due to emergency code matching
        const parsed = getAllowedIpsParsed();
        parsed.push({
          ip: clientIp,
          createdAt: clientMeta.timestamp,
          lastLoginAt: clientMeta.timestamp,
          memo: '비상 인증 자동 등록 (유동 IP)'
        });
        saveAllowedIpsObj(parsed);
        isIpWhitelisted = true;

        appendAccessLog({
          timestamp: clientMeta.timestamp,
          ip: clientIp,
          deviceType: clientMeta.deviceType,
          browser: `${clientMeta.os} / ${clientMeta.browser}`,
          success: true,
          action: 'emergency_login_success',
          details: '비상 비밀번호 인증 성공 및 현재 IP 자동 등록'
        });

        return res.json({
          success: true,
          token,
          isIpWhitelisted: true,
          detectedIp: clientIp
        });
      } else {
        // Invalid emergency password increment failed attempts
        if (!loginTrackers[clientIp]) {
          loginTrackers[clientIp] = { attempts: 0, lockedUntil: 0 };
        }
        loginTrackers[clientIp].attempts += 1;
        if (loginTrackers[clientIp].attempts >= 5) {
          loginTrackers[clientIp].lockedUntil = Date.now() + 10 * 60 * 1000;
        }

        appendAccessLog({
          timestamp: clientMeta.timestamp,
          ip: clientIp,
          deviceType: clientMeta.deviceType,
          browser: `${clientMeta.os} / ${clientMeta.browser}`,
          success: false,
          action: 'emergency_login_fail',
          details: `비상 비밀번호 인증 실패 (시도 횟수: ${loginTrackers[clientIp].attempts}/5)`
        });

        return res.status(401).json({
          error: 'InvalidEmergencyPassword',
          message: '비상 비밀번호가 올바르지 않습니다.'
        });
      }
    }

    // Success standard authentication
    appendAccessLog({
      timestamp: clientMeta.timestamp,
      ip: clientIp,
      deviceType: clientMeta.deviceType,
      browser: `${clientMeta.os} / ${clientMeta.browser}`,
      success: true,
      action: 'login_success',
      details: isIpWhitelisted ? '일반 로그인 성공 (IP 승인됨)' : '일반 로그인 성공 (IP 등록 대기)'
    });

    if (isIpWhitelisted) {
      const parsed = getAllowedIpsParsed();
      const existing = parsed.find(item => item.ip === clientIp);
      if (existing) {
        existing.lastLoginAt = clientMeta.timestamp;
        saveAllowedIpsObj(parsed);
      }
    }

    return res.json({
      success: true,
      token,
      isIpWhitelisted,
      detectedIp: clientIp
    });

  } else {
    // Increment failed standard logins
    if (!loginTrackers[clientIp]) {
      loginTrackers[clientIp] = { attempts: 0, lockedUntil: 0 };
    }
    loginTrackers[clientIp].attempts += 1;
    if (loginTrackers[clientIp].attempts >= 5) {
      loginTrackers[clientIp].lockedUntil = Date.now() + 10 * 60 * 1000;
    }

    appendAccessLog({
      timestamp: clientMeta.timestamp,
      ip: clientIp,
      deviceType: clientMeta.deviceType,
      browser: `${clientMeta.os} / ${clientMeta.browser}`,
      success: false,
      action: 'login_fail',
      details: `로그인 인증 실패 (ID/PW 불일치, 시도 횟수: ${loginTrackers[clientIp].attempts}/5)`
    });

    const remaining = 5 - loginTrackers[clientIp].attempts;
    return res.status(401).json({
      error: 'InvalidCredentials',
      message: remaining > 0 
        ? `아이디 또는 비밀번호가 잘못되었습니다. (제한까지 ${remaining}회 남음)`
        : `로그인 시도가 5회 실패하여 10분간 로그인 시도가 제한됩니다.`
    });
  }
});

// 4. Token verification endpoint
app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const sessions = getSessions();

  if (!token || !sessions.includes(token)) {
    return res.status(401).json({ error: 'Unauthorized', isLogged: false });
  }

  const clientIp = getClientIp(req);
  const ips = getAllowedIps();
  const isIpWhitelisted = ips.includes(clientIp) || 
                          clientIp === '127.0.0.1' || 
                          clientIp === 'localhost' ||
                          clientIp === '::1';

  res.json({
    success: true,
    isLogged: true,
    isIpWhitelisted,
    detectedIp: clientIp
  });
});

// 5. Direct IP register for logged-in sessions (Auxiliary bypass)
app.post('/api/admin/whitelist-current-ip', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const sessions = getSessions();

  if (!token || !sessions.includes(token)) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const clientMeta = getClientMeta(req);
  const clientIp = clientMeta.ip;
  const parsed = getAllowedIpsParsed();

  const existing = parsed.find(item => item.ip === clientIp);
  if (!existing) {
    parsed.push({
      ip: clientIp,
      createdAt: clientMeta.timestamp,
      lastLoginAt: clientMeta.timestamp,
      memo: '관리자 세션 직접 등록 (유동 IP)'
    });
    saveAllowedIpsObj(parsed);

    appendAccessLog({
      timestamp: clientMeta.timestamp,
      ip: clientIp,
      deviceType: clientMeta.deviceType,
      browser: `${clientMeta.os} / ${clientMeta.browser}`,
      success: true,
      action: 'ip_whitelisted_self',
      details: '관리자가 세션 로그인 후 직접 본인 유동 IP 등록 승인'
    });
  } else {
    existing.lastLoginAt = clientMeta.timestamp;
    saveAllowedIpsObj(parsed);
  }

  res.json({ success: true, message: '현재 IP가 성공적으로 허용 목록에 등록되었습니다.' });
});

// ==========================================
// Protected Admin API Endpoints (Admin token + IP validated)
// ==========================================

// Get all consultation requests
app.get('/api/admin/consultations', checkAdminAuth, (req, res) => {
  res.json(getConsultations());
});

// Update consultation status
app.post('/api/admin/consultations/status', checkAdminAuth, (req, res) => {
  const { id, status } = req.body;
  const consultations = getConsultations();
  const updated = consultations.map(c => c.id === id ? { ...c, status } : c);
  saveConsultations(updated);
  res.json({ success: true });
});

// Update consultation memo
app.post('/api/admin/consultations/memo', checkAdminAuth, (req, res) => {
  const { id, memo } = req.body;
  const consultations = getConsultations();
  const updated = consultations.map(c => c.id === id ? { ...c, adminMemo: memo } : c);
  saveConsultations(updated);
  res.json({ success: true });
});

// Delete single consultation
app.delete('/api/admin/consultations/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const consultations = getConsultations();
  const filtered = consultations.filter(c => c.id !== id);
  saveConsultations(filtered);
  res.json({ success: true });
});

// Delete all consultations
app.post('/api/admin/consultations/clear', checkAdminAuth, (req, res) => {
  saveConsultations([]);
  res.json({ success: true });
});

// Get detailed whitelist IP objects
app.get('/api/admin/ips', checkAdminAuth, (req, res) => {
  res.json(getAllowedIpsParsed());
});

// Add custom IP address manually
app.post('/api/admin/ips', checkAdminAuth, (req, res) => {
  const { ip, memo } = req.body;
  if (!ip) {
    return res.status(400).json({ error: 'IP 주소를 입력해주세요.' });
  }

  const cleanIp = ip.trim();
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  const isValid = cleanIp === 'localhost' || ipv4Regex.test(cleanIp) || ipv6Regex.test(cleanIp);
  if (!isValid) {
    return res.status(400).json({ error: '올바른 IP 주소를 입력해주세요.' });
  }

  const parsed = getAllowedIpsParsed();
  if (parsed.some(item => item.ip === cleanIp)) {
    return res.status(400).json({ error: '이미 등록된 IP입니다.' });
  }

  const dateKST = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  parsed.push({
    ip: cleanIp,
    createdAt: dateKST,
    lastLoginAt: dateKST,
    memo: memo ? memo.trim() : '직접 추가됨'
  });
  saveAllowedIpsObj(parsed);

  const clientMeta = getClientMeta(req);
  appendAccessLog({
    timestamp: clientMeta.timestamp,
    ip: clientMeta.ip,
    deviceType: clientMeta.deviceType,
    browser: `${clientMeta.os} / ${clientMeta.browser}`,
    success: true,
    action: 'ip_added_manual',
    details: `IP ${cleanIp} (${memo || '메모 없음'}) 수동 등록 성공`
  });

  res.json({ success: true, allowedIps: parsed });
});

// Delete whitelisted IP manually
app.delete('/api/admin/ips/:ip', checkAdminAuth, (req, res) => {
  const ipToDelete = req.params.ip;
  const parsed = getAllowedIpsParsed();

  if (parsed.length <= 1) {
    return res.status(400).json({ error: '허용 IP가 하나도 없게 삭제되는 것은 막아줘. 최소 1개 이상은 유지되어야 합니다.' });
  }

  const filtered = parsed.filter(item => item.ip !== ipToDelete);
  saveAllowedIpsObj(filtered);

  const clientMeta = getClientMeta(req);
  appendAccessLog({
    timestamp: clientMeta.timestamp,
    ip: clientMeta.ip,
    deviceType: clientMeta.deviceType,
    browser: `${clientMeta.os} / ${clientMeta.browser}`,
    success: true,
    action: 'ip_deleted_manual',
    details: `IP ${ipToDelete} 수동 삭제 완료`
  });

  res.json({ success: true, allowedIps: filtered });
});

// Fetch detailed security access logs
app.get('/api/admin/logs', checkAdminAuth, (req, res) => {
  if (fs.existsSync(LOGS_FILE)) {
    try {
      const logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
      return res.json(logs);
    } catch (e) {
      // Ignore
    }
  }
  res.json([]);
});

// ==========================================
// Vite Dev / Static Production Middleware
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
