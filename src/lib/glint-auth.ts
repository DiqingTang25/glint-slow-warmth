// Local-only auth: accounts + session live in localStorage.
// In a real backend these would be server-side. Demo only.

export type Account = {
  openid: string;
  password: string; // demo only — plaintext is fine for a sandbox
  nickname: string;
  isAdmin: boolean;
  createdAt: string;
};

export type Session = { openid: string; token: string; isAdmin: boolean };

const ACCOUNTS_KEY = "glint:accounts";
const SESSION_KEY = "glint:session";

function safeLS(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadAccounts(): Account[] {
  const ls = safeLS();
  if (!ls) return [];
  try {
    return JSON.parse(ls.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAccounts(arr: Account[]) {
  safeLS()?.setItem(ACCOUNTS_KEY, JSON.stringify(arr));
}

export function ensureSeedAdmin() {
  const ls = safeLS();
  if (!ls) return;
  const all = loadAccounts();
  if (all.some((a) => a.openid === "admin")) return;
  all.unshift({
    openid: "admin",
    password: "admin123",
    nickname: "管理员",
    isAdmin: true,
    createdAt: new Date().toISOString(),
  });
  saveAccounts(all);
}

export function getSession(): Session | null {
  const ls = safeLS();
  if (!ls) return null;
  try {
    const raw = ls.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCurrentOpenid(): string | null {
  return getSession()?.openid ?? null;
}

export function isAdmin(): boolean {
  return !!getSession()?.isAdmin;
}

export function logout() {
  safeLS()?.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("glint:auth-changed"));
}

export function login(openid: string, password: string): Session {
  const acc = loadAccounts().find((a) => a.openid === openid);
  if (!acc || acc.password !== password) throw new Error("账号或密码错误");
  const sess: Session = {
    openid: acc.openid,
    token: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    isAdmin: acc.isAdmin,
  };
  safeLS()?.setItem(SESSION_KEY, JSON.stringify(sess));
  window.dispatchEvent(new Event("glint:auth-changed"));
  return sess;
}

export function register(openid: string, password: string, nickname: string): Session {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(openid))
    throw new Error("用户名仅限 3-20 位字母/数字/下划线");
  if (password.length < 6) throw new Error("密码至少 6 位");
  const all = loadAccounts();
  if (all.some((a) => a.openid === openid)) throw new Error("用户名已被使用");
  const acc: Account = {
    openid,
    password,
    nickname: nickname.trim() || openid,
    isAdmin: false,
    createdAt: new Date().toISOString(),
  };
  all.push(acc);
  saveAccounts(all);
  return login(openid, password);
}

export function maskOpenid(openid: string): string {
  if (openid.length <= 4) return openid;
  return openid.slice(0, 2) + "***" + openid.slice(-2);
}

// Credit log
export type CreditLog = {
  openid: string;
  delta: number;
  reason: string;
  by: string;
  at: string;
};
const LOG_KEY = "glint:credit-log";
export function loadCreditLog(): CreditLog[] {
  try {
    return JSON.parse(safeLS()?.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}
export function appendCreditLog(entry: CreditLog) {
  const all = loadCreditLog();
  all.unshift(entry);
  safeLS()?.setItem(LOG_KEY, JSON.stringify(all.slice(0, 500)));
}

// Report action log
export type ReportAction = "approve" | "reject";
export type ReportActionLog = {
  postId: number;
  action: ReportAction;
  reason: string;
  reportReasons: string[];
  postOpenid: string;
  postAnimal: string;
  postContent: string;
  by: string;
  at: string;
};
const REPORT_LOG_KEY = "glint:report-log";
export function loadReportLog(): ReportActionLog[] {
  try {
    return JSON.parse(safeLS()?.getItem(REPORT_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}
export function appendReportLog(entry: ReportActionLog) {
  const all = loadReportLog();
  all.unshift(entry);
  safeLS()?.setItem(REPORT_LOG_KEY, JSON.stringify(all.slice(0, 1000)));
}
