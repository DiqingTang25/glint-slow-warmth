// IndexedDB wrapper for Glint Slow Warmth
import { getCurrentOpenid } from "./glint-auth";

const DB_NAME = "GlintSlowWarmthDB";
const DB_VERSION = 3;

export const DEMO_OPENID = "demo_user_001";

function defaultOpenid(): string {
  return getCurrentOpenid() || DEMO_OPENID;
}

export type GlintUser = {
  openid: string;
  nickname: string;
  avatar: string;
  creditScore: number;
  lightPoints: number;
  createdAt: string;
};

export type MoodDiary = {
  id?: number;
  openid: string;
  date: string;
  stressLevel: number;
  moodEmoji: string;
  note: string;
  completedTaskId?: number;
  createdAt: string;
};

export type TreeholeReply = {
  animal: string;
  content: string;
  createdAt: string;
};

export type TreeholePost = {
  id?: number;
  anonymousAnimal: string;
  content: string;
  emotionTag: string;
  createdAt: string;
  replies: TreeholeReply[];
  hasAIReply: boolean;
  reportCount: number;
  reportReasons?: string[];
  isHidden: boolean;
  openid: string;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      const oldVersion = e.oldVersion;
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "openid" });
      }
      if (!db.objectStoreNames.contains("moodDiaries")) {
        const s = db.createObjectStore("moodDiaries", { keyPath: "id", autoIncrement: true });
        s.createIndex("byOpenidDate", ["openid", "date"], { unique: true });
        s.createIndex("byOpenid", "openid");
      }
      if (!db.objectStoreNames.contains("treeholePosts")) {
        const s = db.createObjectStore("treeholePosts", { keyPath: "id", autoIncrement: true });
        s.createIndex("byCreatedAt", "createdAt");
      }
      // v2 → letters
      if (!db.objectStoreNames.contains("letters")) {
        const s = db.createObjectStore("letters", { keyPath: "id", autoIncrement: true });
        s.createIndex("byFromOpenid", "fromOpenid");
      }
      // v3 → drop fake seed letters and switch to pool model
      if (oldVersion < 3 && db.objectStoreNames.contains("letters")) {
        const tx = req.transaction!;
        const ls = tx.objectStore("letters");
        ls.clear();
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const req = fn(s);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ---------- Users ----------
export async function getUser(openid?: string): Promise<GlintUser> {
  const id = openid || defaultOpenid();
  const u = await tx<GlintUser | undefined>("users", "readonly", (s) => s.get(id) as IDBRequest<GlintUser | undefined>);
  if (u) return u;
  const fresh: GlintUser = {
    openid: id,
    nickname: "微光使者",
    avatar: "🌱",
    creditScore: 100,
    lightPoints: 0,
    createdAt: new Date().toISOString(),
  };
  await tx("users", "readwrite", (s) => s.put(fresh));
  return fresh;
}

export async function updateUser(patch: Partial<GlintUser>, openid?: string): Promise<GlintUser> {
  const cur = await getUser(openid);
  const next = { ...cur, ...patch };
  await tx("users", "readwrite", (s) => s.put(next));
  return next;
}

export async function addLightPoints(delta: number, openid?: string): Promise<GlintUser> {
  const cur = await getUser(openid);
  return updateUser({ lightPoints: Math.max(0, cur.lightPoints + delta) }, openid);
}

export async function listAllUsers(): Promise<GlintUser[]> {
  return tx<GlintUser[]>("users", "readonly", (s) => s.getAll());
}

// ---------- Mood Diaries ----------
export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getDiary(date: string, openid?: string): Promise<MoodDiary | undefined> {
  const id = openid || defaultOpenid();
  return tx<MoodDiary | undefined>("moodDiaries", "readonly", (s) => {
    const idx = s.index("byOpenidDate");
    return idx.get([id, date]) as IDBRequest<MoodDiary | undefined>;
  });
}

export async function saveDiary(diary: Omit<MoodDiary, "id" | "openid" | "createdAt">, openid?: string): Promise<MoodDiary> {
  const id = openid || defaultOpenid();
  const existing = await getDiary(diary.date, id);
  if (existing) throw new Error("今日已打卡");
  const record: MoodDiary = { ...diary, openid: id, createdAt: new Date().toISOString() };
  const newId = await tx<IDBValidKey>("moodDiaries", "readwrite", (s) => s.add(record));
  return { ...record, id: newId as number };
}

export async function getRecentDiaries(days: number, openid?: string): Promise<MoodDiary[]> {
  const id = openid || defaultOpenid();
  const all = await tx<MoodDiary[]>("moodDiaries", "readonly", (s) => s.index("byOpenid").getAll(id));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffStr = todayStr(cutoff);
  return all.filter((d) => d.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));
}

export async function listAllDiaries(): Promise<MoodDiary[]> {
  return tx<MoodDiary[]>("moodDiaries", "readonly", (s) => s.getAll());
}

// ---------- Treehole ----------
export async function listPosts(): Promise<TreeholePost[]> {
  const all = await tx<TreeholePost[]>("treeholePosts", "readonly", (s) => s.getAll());
  return all.filter((p) => !p.isHidden).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllPosts(): Promise<TreeholePost[]> {
  const all = await tx<TreeholePost[]>("treeholePosts", "readonly", (s) => s.getAll());
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listReportedPosts(): Promise<TreeholePost[]> {
  const all = await tx<TreeholePost[]>("treeholePosts", "readonly", (s) => s.getAll());
  return all
    .filter((p) => (p.reportCount ?? 0) >= 1)
    .sort((a, b) => b.reportCount - a.reportCount);
}

export async function addPost(post: Omit<TreeholePost, "id">): Promise<TreeholePost> {
  const id = await tx<IDBValidKey>("treeholePosts", "readwrite", (s) => s.add(post));
  return { ...post, id: id as number };
}

export async function updatePost(post: TreeholePost): Promise<void> {
  await tx("treeholePosts", "readwrite", (s) => s.put(post));
}

export async function deletePost(id: number): Promise<void> {
  await tx("treeholePosts", "readwrite", (s) => s.delete(id));
}

export async function getPost(id: number): Promise<TreeholePost | undefined> {
  return tx<TreeholePost | undefined>("treeholePosts", "readonly", (s) => s.get(id) as IDBRequest<TreeholePost | undefined>);
}

// ---------- Letters (同频陪伴) — pool / real-only ----------
export type Letter = {
  id?: number;
  fromOpenid: string;
  fromName: string;
  toOpenid?: string; // legacy field; ignored in new flow
  theme: string;
  content: string;
  createdAt: string;
  deliverAt: string;
  claimedBy?: string;
  readAt?: string;
  isReply?: boolean;
  parentId?: number;
};

// Inbox: any letter from someone else, available now,
// not yet claimed (or claimed by me).
export async function listInbox(openid?: string): Promise<Letter[]> {
  const id = openid || defaultOpenid();
  const all = await tx<Letter[]>("letters", "readonly", (s) => s.getAll());
  const now = new Date().toISOString();
  return all
    .filter(
      (l) =>
        l.fromOpenid !== id &&
        l.deliverAt <= now &&
        (!l.claimedBy || l.claimedBy === id)
    )
    .sort((a, b) => b.deliverAt.localeCompare(a.deliverAt));
}

export async function listOutbox(openid?: string): Promise<Letter[]> {
  const id = openid || defaultOpenid();
  const all = await tx<Letter[]>("letters", "readonly", (s) =>
    s.index("byFromOpenid").getAll(id)
  );
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addLetter(letter: Omit<Letter, "id">): Promise<Letter> {
  const id = await tx<IDBValidKey>("letters", "readwrite", (s) => s.add(letter));
  return { ...letter, id: id as number };
}

export async function claimLetter(id: number, openid?: string): Promise<void> {
  const me = openid || defaultOpenid();
  const l = await tx<Letter | undefined>("letters", "readonly", (s) =>
    s.get(id) as IDBRequest<Letter | undefined>
  );
  if (!l) return;
  if (l.claimedBy && l.claimedBy !== me) return;
  l.claimedBy = me;
  if (!l.readAt) l.readAt = new Date().toISOString();
  await tx("letters", "readwrite", (s) => s.put(l));
}

export async function markLetterRead(id: number): Promise<void> {
  // backward-compat alias for claim
  await claimLetter(id);
}
