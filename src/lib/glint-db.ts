// IndexedDB wrapper for Glint Slow Warmth
const DB_NAME = "GlintSlowWarmthDB";
const DB_VERSION = 2;

export const DEMO_OPENID = "demo_user_001";

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
    req.onupgradeneeded = () => {
      const db = req.result;
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
      if (!db.objectStoreNames.contains("letters")) {
        const s = db.createObjectStore("letters", { keyPath: "id", autoIncrement: true });
        s.createIndex("byToOpenid", "toOpenid");
        s.createIndex("byFromOpenid", "fromOpenid");
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
export async function getUser(openid = DEMO_OPENID): Promise<GlintUser> {
  const u = await tx<GlintUser | undefined>("users", "readonly", (s) => s.get(openid) as IDBRequest<GlintUser | undefined>);
  if (u) return u;
  const fresh: GlintUser = {
    openid,
    nickname: "微光使者",
    avatar: "🌱",
    creditScore: 100,
    lightPoints: 0,
    createdAt: new Date().toISOString(),
  };
  await tx("users", "readwrite", (s) => s.put(fresh));
  return fresh;
}

export async function updateUser(patch: Partial<GlintUser>, openid = DEMO_OPENID): Promise<GlintUser> {
  const cur = await getUser(openid);
  const next = { ...cur, ...patch };
  await tx("users", "readwrite", (s) => s.put(next));
  return next;
}

export async function addLightPoints(delta: number, openid = DEMO_OPENID): Promise<GlintUser> {
  const cur = await getUser(openid);
  return updateUser({ lightPoints: Math.max(0, cur.lightPoints + delta) }, openid);
}

// ---------- Mood Diaries ----------
export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getDiary(date: string, openid = DEMO_OPENID): Promise<MoodDiary | undefined> {
  return tx<MoodDiary | undefined>("moodDiaries", "readonly", (s) => {
    const idx = s.index("byOpenidDate");
    return idx.get([openid, date]) as IDBRequest<MoodDiary | undefined>;
  });
}

export async function saveDiary(diary: Omit<MoodDiary, "id" | "openid" | "createdAt">, openid = DEMO_OPENID): Promise<MoodDiary> {
  const existing = await getDiary(diary.date, openid);
  if (existing) throw new Error("今日已打卡");
  const record: MoodDiary = { ...diary, openid, createdAt: new Date().toISOString() };
  const id = await tx<IDBValidKey>("moodDiaries", "readwrite", (s) => s.add(record));
  return { ...record, id: id as number };
}

export async function getRecentDiaries(days: number, openid = DEMO_OPENID): Promise<MoodDiary[]> {
  const all = await tx<MoodDiary[]>("moodDiaries", "readonly", (s) => s.index("byOpenid").getAll(openid));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffStr = todayStr(cutoff);
  return all.filter((d) => d.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Treehole ----------
export async function listPosts(): Promise<TreeholePost[]> {
  const all = await tx<TreeholePost[]>("treeholePosts", "readonly", (s) => s.getAll());
  return all.filter((p) => !p.isHidden).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addPost(post: Omit<TreeholePost, "id">): Promise<TreeholePost> {
  const id = await tx<IDBValidKey>("treeholePosts", "readwrite", (s) => s.add(post));
  return { ...post, id: id as number };
}

export async function updatePost(post: TreeholePost): Promise<void> {
  await tx("treeholePosts", "readwrite", (s) => s.put(post));
}

export async function getPost(id: number): Promise<TreeholePost | undefined> {
  return tx<TreeholePost | undefined>("treeholePosts", "readonly", (s) => s.get(id) as IDBRequest<TreeholePost | undefined>);
}

// ---------- Letters (同频陪伴) ----------
export type Letter = {
  id?: number;
  fromOpenid: string;
  fromName: string;
  toOpenid: string;
  theme: string;
  content: string;
  createdAt: string;
  deliverAt: string; // when it becomes visible to recipient
  readAt?: string;
  isReply?: boolean;
  parentId?: number;
};

export async function listInbox(openid = DEMO_OPENID): Promise<Letter[]> {
  const all = await tx<Letter[]>("letters", "readonly", (s) =>
    s.index("byToOpenid").getAll(openid)
  );
  const now = new Date().toISOString();
  return all
    .filter((l) => l.deliverAt <= now)
    .sort((a, b) => b.deliverAt.localeCompare(a.deliverAt));
}

export async function listOutbox(openid = DEMO_OPENID): Promise<Letter[]> {
  const all = await tx<Letter[]>("letters", "readonly", (s) =>
    s.index("byFromOpenid").getAll(openid)
  );
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addLetter(letter: Omit<Letter, "id">): Promise<Letter> {
  const id = await tx<IDBValidKey>("letters", "readwrite", (s) => s.add(letter));
  return { ...letter, id: id as number };
}

export async function markLetterRead(id: number): Promise<void> {
  const l = await tx<Letter | undefined>("letters", "readonly", (s) =>
    s.get(id) as IDBRequest<Letter | undefined>
  );
  if (l && !l.readAt) {
    l.readAt = new Date().toISOString();
    await tx("letters", "readwrite", (s) => s.put(l));
  }
}
