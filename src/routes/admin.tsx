import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  appendCreditLog,
  appendReportLog,
  ensureSeedAdmin,
  getSession,
  loadAccounts,
  loadCreditLog,
  loadReportLog,
  logout,
  maskOpenid,
  type Account,
  type CreditLog,
  type ReportActionLog,
} from "@/lib/glint-auth";
import {
  deletePost,
  getUser,
  listAllDiaries,
  listAllPosts,
  listAllUsers,
  listReportedPosts,
  todayStr,
  updatePost,
  updateUser,
  type GlintUser,
  type MoodDiary,
  type TreeholePost,
} from "@/lib/glint-db";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Tab = "dashboard" | "reports" | "moderation" | "credits";

const NAV: { k: Tab; label: string; emoji: string }[] = [
  { k: "dashboard", label: "数据仪表盘", emoji: "📊" },
  { k: "reports", label: "举报审核", emoji: "🚨" },
  { k: "moderation", label: "内容监管", emoji: "🌳" },
  { k: "credits", label: "信用分管理", emoji: "👤" },
];

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSeedAdmin();
    const s = getSession();
    if (!s || !s.isAdmin) {
      navigate({ to: "/" });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready) return null;

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-60 flex-col border-r border-border/60 p-5 glass"
        style={{ minHeight: "100vh" }}
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight">微光 · 管理后台</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">慢一点，温柔执法</p>
        </div>
        <nav className="mt-6 flex-1 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.k}
              onClick={() => setTab(n.k)}
              className="w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium transition"
              style={{
                background: tab === n.k ? "var(--primary-glow)" : "transparent",
                color: tab === n.k ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <span className="mr-2">{n.emoji}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-4 space-y-2">
          <Link
            to="/"
            className="block rounded-xl border border-border px-3 py-2 text-center text-xs"
          >
            ← 回到前台
          </Link>
          <button
            onClick={onLogout}
            className="w-full rounded-xl px-3 py-2 text-xs font-semibold text-destructive-foreground"
            style={{ background: "var(--destructive)" }}
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="md:hidden glass fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{ height: 56 }}
      >
        <button
          onClick={() => setDrawer(true)}
          aria-label="菜单"
          className="text-2xl"
        >
          ☰
        </button>
        <h1 className="text-base font-semibold">管理后台 · {NAV.find((n) => n.k === tab)?.label}</h1>
        <button onClick={onLogout} className="text-xs text-muted-foreground">
          退出
        </button>
      </header>

      {drawer && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setDrawer(false)}
        >
          <div
            className="glass absolute bottom-0 left-0 right-0 p-5 animate-fade-up"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-semibold">导航</h3>
            <div className="space-y-1">
              {NAV.map((n) => (
                <button
                  key={n.k}
                  onClick={() => {
                    setTab(n.k);
                    setDrawer(false);
                  }}
                  className="w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium"
                  style={{
                    background: tab === n.k ? "var(--primary-glow)" : "var(--secondary)",
                    color: tab === n.k ? "var(--primary)" : "var(--secondary-foreground)",
                  }}
                >
                  <span className="mr-2">{n.emoji}</span>
                  {n.label}
                </button>
              ))}
              <Link
                to="/"
                className="block mt-2 rounded-xl border border-border px-3 py-2 text-center text-xs"
              >
                ← 回到前台
              </Link>
            </div>
          </div>
        </div>
      )}

      <main
        className="flex-1 p-5 md:p-8"
        style={{ paddingTop: 72, maxWidth: "100%" }}
      >
        {tab === "dashboard" && <DashboardView />}
        {tab === "reports" && <ReportsView />}
        {tab === "moderation" && <ModerationView />}
        {tab === "credits" && <CreditsView />}
      </main>
    </div>
  );
}

// ───────────────── Dashboard ─────────────────

function DashboardView() {
  const [users, setUsers] = useState<GlintUser[]>([]);
  const [posts, setPosts] = useState<TreeholePost[]>([]);
  const [diaries, setDiaries] = useState<MoodDiary[]>([]);

  const refresh = async () => {
    const [u, p, d] = await Promise.all([listAllUsers(), listAllPosts(), listAllDiaries()]);
    setUsers(u);
    setPosts(p);
    setDiaries(d);
  };
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, []);

  const today = todayStr();
  const todayDiaries = diaries.filter((d) => d.date === today).length;
  const todayPosts = posts.filter((p) => p.createdAt.slice(0, 10) === today).length;
  const totalLight = users.reduce((s, u) => s + (u.lightPoints || 0), 0);

  const last7 = useMemo(() => {
    const arr: { date: string; diaries: number; posts: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = todayStr(d);
      arr.push({
        date: ds.slice(5),
        diaries: diaries.filter((x) => x.date === ds).length,
        posts: posts.filter((p) => p.createdAt.slice(0, 10) === ds).length,
      });
    }
    return arr;
  }, [diaries, posts]);

  const stressDist = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffStr = todayStr(cutoff);
    const counts = Array(10).fill(0);
    diaries
      .filter((d) => d.date >= cutoffStr)
      .forEach((d) => {
        const lv = d.stressLevel;
        if (lv >= 1 && lv <= 10) counts[lv - 1]++;
      });
    return counts;
  }, [diaries]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">数据仪表盘</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="总用户数" value={users.length} emoji="👥" />
        <StatCard label="今日打卡" value={todayDiaries} emoji="📓" />
        <StatCard label="今日树洞" value={todayPosts} emoji="🌳" />
        <StatCard label="累计光能" value={totalLight} emoji="✨" />
      </div>

      <section className="glass shadow-soft p-5" style={{ borderRadius: 20 }}>
        <h3 className="mb-4 text-sm font-semibold">最近 7 天趋势</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="diaries"
                name="打卡人数"
                stroke="var(--primary)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="posts"
                name="树洞发帖"
                stroke="var(--warning)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass shadow-soft p-5" style={{ borderRadius: 20 }}>
        <h3 className="mb-4 text-sm font-semibold">近 7 天 · 困扰强度分布</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2">等级</th>
                {Array.from({ length: 10 }, (_, i) => (
                  <th key={i} className="px-2 py-2 text-center">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/60">
                <td className="py-2 font-medium">打卡次数</td>
                {stressDist.map((c, i) => (
                  <td key={i} className="px-2 py-2 text-center">
                    {c}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="glass shadow-soft p-4" style={{ borderRadius: 18 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span style={{ fontSize: 18 }}>{emoji}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}

// ───────────────── Reports ─────────────────

function ReportsView() {
  const [posts, setPosts] = useState<TreeholePost[]>([]);
  const [logs, setLogs] = useState<ReportActionLog[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // log filters
  const [fAction, setFAction] = useState<"all" | "approve" | "reject">("all");
  const [fAdmin, setFAdmin] = useState("");
  const [fKeyword, setFKeyword] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [pendingReason, setPendingReason] = useState<{
    post: TreeholePost;
    action: ReportAction;
  } | null>(null);
  const [reasonText, setReasonText] = useState("");

  const refresh = () => {
    listReportedPosts().then(setPosts);
    setLogs(loadReportLog());
  };
  useEffect(() => {
    refresh();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const openConfirm = (post: TreeholePost, action: ReportAction) => {
    setPendingReason({ post, action });
    setReasonText(
      action === "approve"
        ? `举报通过：${(post.reportReasons || []).join(",") || "违规"}`
        : "驳回：经核查未违规"
    );
  };

  const submitDecision = async () => {
    if (!pendingReason) return;
    const { post: p, action } = pendingReason;
    const reason = reasonText.trim() || (action === "approve" ? "通过举报" : "驳回举报");
    if (!p.id) return;
    const admin = getSession()?.openid || "admin";
    const at = new Date().toISOString();

    if (action === "approve") {
      if (p.openid) {
        const u = await getUser(p.openid);
        await updateUser({ creditScore: Math.max(0, u.creditScore - 20) }, p.openid);
        appendCreditLog({
          openid: p.openid,
          delta: -20,
          reason: `举报通过：${reason}`,
          by: admin,
          at,
        });
      }
      await deletePost(p.id);
    } else {
      p.reportCount = 0;
      p.reportReasons = [];
      p.isHidden = false;
      await updatePost(p);
    }

    appendReportLog({
      postId: p.id,
      action,
      reason,
      reportReasons: p.reportReasons || [],
      postOpenid: p.openid || "",
      postAnimal: p.anonymousAnimal || "",
      postContent: p.content || "",
      by: admin,
      at,
    });

    setPendingReason(null);
    setReasonText("");
    flash(action === "approve" ? "已通过举报并删除" : "已驳回举报，帖子恢复显示");
    refresh();
  };

  const filteredLogs = useMemo(() => {
    const k = fKeyword.trim().toLowerCase();
    const a = fAdmin.trim().toLowerCase();
    const fromTs = fFrom ? new Date(fFrom).getTime() : 0;
    const toTs = fTo ? new Date(fTo).getTime() + 86400000 : Infinity;
    return logs.filter((l) => {
      if (fAction !== "all" && l.action !== fAction) return false;
      if (a && !l.by.toLowerCase().includes(a)) return false;
      const t = new Date(l.at).getTime();
      if (t < fromTs || t > toTs) return false;
      if (k) {
        const hay = `${l.reason} ${l.reportReasons.join(" ")} ${l.postContent} ${l.postAnimal} ${l.postOpenid}`.toLowerCase();
        if (!hay.includes(k)) return false;
      }
      return true;
    });
  }, [logs, fAction, fAdmin, fKeyword, fFrom, fTo]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">举报审核</h1>
      <p className="text-sm text-muted-foreground">
        共 <b className="text-foreground">{posts.length}</b> 条待处理记录。
      </p>
      {posts.length === 0 ? (
        <Empty text="目前没有被举报的帖子。" />
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className="glass shadow-soft p-5"
              style={{ borderRadius: 20 }}
            >
              <header className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {p.emotionTag} {p.anonymousAnimal} · {maskOpenid(p.openid || "anon")}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    background: "color-mix(in oklab, var(--destructive) 15%, transparent)",
                    color: "var(--destructive)",
                  }}
                >
                  举报 ×{p.reportCount}
                </span>
              </header>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{p.content}</p>
              {p.reportReasons && p.reportReasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.reportReasons.map((r, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px]"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openConfirm(p, "reject")}
                  className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium"
                >
                  驳回（恢复）
                </button>
                <button
                  onClick={() => openConfirm(p, "approve")}
                  className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-destructive-foreground"
                  style={{ background: "var(--destructive)" }}
                >
                  通过 · 删除并扣分
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ───── Operation log ───── */}
      <section className="glass shadow-soft p-5 mt-8" style={{ borderRadius: 20 }}>
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold">操作日志</h3>
          <span className="text-xs text-muted-foreground">
            共 {filteredLogs.length} / {logs.length} 条
          </span>
        </header>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <select
            value={fAction}
            onChange={(e) => setFAction(e.target.value as typeof fAction)}
            className="rounded-xl bg-background/60 px-3 py-2 text-xs"
            style={{ border: "1px solid var(--border)" }}
          >
            <option value="all">全部操作</option>
            <option value="approve">通过</option>
            <option value="reject">驳回</option>
          </select>
          <input
            value={fAdmin}
            onChange={(e) => setFAdmin(e.target.value)}
            placeholder="管理员账号"
            className="rounded-xl bg-background/60 px-3 py-2 text-xs"
            style={{ border: "1px solid var(--border)" }}
          />
          <input
            value={fKeyword}
            onChange={(e) => setFKeyword(e.target.value)}
            placeholder="关键词（原因/内容）"
            className="rounded-xl bg-background/60 px-3 py-2 text-xs col-span-2 md:col-span-1"
            style={{ border: "1px solid var(--border)" }}
          />
          <input
            type="date"
            value={fFrom}
            onChange={(e) => setFFrom(e.target.value)}
            className="rounded-xl bg-background/60 px-3 py-2 text-xs"
            style={{ border: "1px solid var(--border)" }}
          />
          <input
            type="date"
            value={fTo}
            onChange={(e) => setFTo(e.target.value)}
            className="rounded-xl bg-background/60 px-3 py-2 text-xs"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>

        {filteredLogs.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">暂无符合条件的日志。</p>
        ) : (
          <ul className="mt-4 space-y-2 max-h-[420px] overflow-auto pr-1">
            {filteredLogs.map((l, i) => (
              <li
                key={i}
                className="rounded-xl border border-border/60 bg-background/40 p-3 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 font-semibold"
                    style={{
                      background:
                        l.action === "approve"
                          ? "color-mix(in oklab, var(--destructive) 15%, transparent)"
                          : "color-mix(in oklab, var(--primary) 15%, transparent)",
                      color:
                        l.action === "approve" ? "var(--destructive)" : "var(--primary)",
                    }}
                  >
                    {l.action === "approve" ? "通过" : "驳回"}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(l.at).toLocaleString("zh-CN", { hour12: false })}
                  </span>
                  <span className="text-muted-foreground">
                    管理员 <b className="text-foreground">{l.by}</b>
                  </span>
                  <span className="text-muted-foreground">
                    帖子 #{l.postId} · {l.postAnimal} · {maskOpenid(l.postOpenid || "anon")}
                  </span>
                </div>
                <p className="mt-2 text-foreground">原因：{l.reason}</p>
                {l.postContent && (
                  <p className="mt-1 text-muted-foreground line-clamp-2">
                    内容：{l.postContent}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ───── Reason confirm modal ───── */}
      {pendingReason && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setPendingReason(null)}
        >
          <div
            className="glass w-full max-w-md p-5"
            style={{ borderRadius: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">
              {pendingReason.action === "approve" ? "通过举报" : "驳回举报"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingReason.action === "approve"
                ? "永久删除该帖子，并扣除发帖人 20 信用分。"
                : "重置举报计数，恢复该帖子显示。"}
            </p>
            <label className="mt-4 block text-xs font-medium">操作原因（必填）</label>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl bg-background/60 px-3 py-2 text-sm outline-none"
              style={{ border: "1px solid var(--border)" }}
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPendingReason(null)}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm"
              >
                取消
              </button>
              <button
                disabled={!reasonText.trim()}
                onClick={submitDecision}
                className="flex-1 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{
                  background:
                    pendingReason.action === "approve"
                      ? "var(--destructive)"
                      : "var(--primary)",
                  color:
                    pendingReason.action === "approve"
                      ? "var(--destructive-foreground)"
                      : "var(--primary-foreground)",
                }}
              >
                确认{pendingReason.action === "approve" ? "通过" : "驳回"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast text={toast} />
    </div>
  );
}

type ReportAction = "approve" | "reject";

// ───────────────── Moderation ─────────────────

function ModerationView() {
  const [posts, setPosts] = useState<TreeholePost[]>([]);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const refresh = () => listAllPosts().then(setPosts);
  useEffect(() => {
    refresh();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const filtered = posts.filter((p) => {
    if (!q.trim()) return true;
    const k = q.trim().toLowerCase();
    return (
      p.anonymousAnimal.toLowerCase().includes(k) ||
      p.content.toLowerCase().includes(k)
    );
  });

  const toggleHide = async (p: TreeholePost) => {
    p.isHidden = !p.isHidden;
    await updatePost(p);
    flash(p.isHidden ? "已屏蔽" : "已恢复显示");
    refresh();
  };

  const hardDelete = async (p: TreeholePost) => {
    if (!p.id) return;
    if (!confirm("确定删除这条树洞？此操作不可恢复。")) return;
    await deletePost(p.id);
    flash("已删除");
    refresh();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">树洞内容监管</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="按匿名动物 / 内容关键词搜索"
        className="w-full rounded-2xl bg-background/60 px-4 py-2.5 text-sm outline-none focus:ring-2"
        style={{ border: "1px solid var(--border)" }}
      />
      <p className="text-xs text-muted-foreground">
        共 {filtered.length} / {posts.length} 条
      </p>
      {filtered.length === 0 ? (
        <Empty text="没有匹配的帖子。" />
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="glass shadow-soft p-4"
              style={{
                borderRadius: 18,
                opacity: p.isHidden ? 0.6 : 1,
              }}
            >
              <header className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {p.emotionTag} <b className="text-foreground">{p.anonymousAnimal}</b> ·{" "}
                  {maskOpenid(p.openid || "anon")}
                </span>
                <span>{new Date(p.createdAt).toLocaleString("zh-CN")}</span>
              </header>
              <p className="mt-2 whitespace-pre-wrap text-sm">{p.content}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  💬 {p.replies.length} · 🚨 {p.reportCount}
                  {p.isHidden ? " · 已屏蔽" : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleHide(p)}
                    className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground"
                  >
                    {p.isHidden ? "恢复显示" : "屏蔽"}
                  </button>
                  <button
                    onClick={() => hardDelete(p)}
                    className="rounded-full px-3 py-1 font-semibold text-destructive-foreground"
                    style={{ background: "var(--destructive)" }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Toast text={toast} />
    </div>
  );
}

// ───────────────── Credits ─────────────────

function CreditsView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<Record<string, GlintUser>>({});
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Account | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = async () => {
    const accs = loadAccounts();
    setAccounts(accs);
    setLogs(loadCreditLog());
    const map: Record<string, GlintUser> = {};
    for (const a of accs) {
      try {
        map[a.openid] = await getUser(a.openid);
      } catch {
        // ignore
      }
    }
    setUsers(map);
  };
  useEffect(() => {
    refresh();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const filtered = accounts.filter(
    (a) =>
      !q.trim() ||
      a.openid.toLowerCase().includes(q.toLowerCase()) ||
      a.nickname.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">用户信用分管理</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索用户名 / 昵称"
        className="w-full rounded-2xl bg-background/60 px-4 py-2.5 text-sm outline-none focus:ring-2"
        style={{ border: "1px solid var(--border)" }}
      />
      <div
        className="glass shadow-soft overflow-x-auto"
        style={{ borderRadius: 18 }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-3">用户</th>
              <th className="px-4 py-3">openid</th>
              <th className="px-4 py-3">注册时间</th>
              <th className="px-4 py-3 text-right">信用分</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const u = users[a.openid];
              const score = u?.creditScore ?? 100;
              return (
                <tr key={a.openid} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium">
                    {a.nickname}
                    {a.isAdmin && (
                      <span
                        className="ml-1 rounded-full px-1.5 py-0.5 text-[10px]"
                        style={{ background: "var(--primary-glow)", color: "var(--primary)" }}
                      >
                        admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {maskOpenid(a.openid)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td
                    className="px-4 py-3 text-right font-semibold"
                    style={{
                      color: score < 60 ? "var(--destructive)" : "var(--primary)",
                    }}
                  >
                    {score}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(a)}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                    >
                      调整
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  没有用户。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold">最近调整日志</h3>
        {logs.length === 0 ? (
          <Empty text="还没有调整记录。" />
        ) : (
          <ul className="space-y-2">
            {logs.slice(0, 20).map((l, i) => (
              <li
                key={i}
                className="glass shadow-soft flex items-center justify-between p-3 text-xs"
                style={{ borderRadius: 14 }}
              >
                <span>
                  <b>{maskOpenid(l.openid)}</b> · {l.reason}
                </span>
                <span
                  style={{
                    color: l.delta >= 0 ? "var(--success)" : "var(--destructive)",
                    fontWeight: 600,
                  }}
                >
                  {l.delta > 0 ? "+" : ""}
                  {l.delta} · by {l.by}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <CreditEditor
          account={editing}
          current={users[editing.openid]?.creditScore ?? 100}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            flash(msg);
            refresh();
          }}
        />
      )}
      <Toast text={toast} />
    </div>
  );
}

function CreditEditor({
  account,
  current,
  onClose,
  onSaved,
}: {
  account: Account;
  current: number;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!reason.trim() || delta === 0) return;
    setBusy(true);
    try {
      const next = Math.max(0, Math.min(200, current + delta));
      await updateUser({ creditScore: next }, account.openid);
      appendCreditLog({
        openid: account.openid,
        delta,
        reason: reason.trim(),
        by: getSession()?.openid || "admin",
        at: new Date().toISOString(),
      });
      onSaved(`已调整 ${account.nickname} 的信用分：${current} → ${next}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="glass shadow-soft w-full max-w-[420px] p-6 animate-fade-up"
        style={{ borderRadius: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">调整 {account.nickname} 的信用分</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          当前 {current} · 调整后 {Math.max(0, Math.min(200, current + delta))}
        </p>
        <div className="mt-4">
          <label className="text-xs text-muted-foreground">变更值（正数加分，负数扣分）</label>
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-2xl bg-background/60 px-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground">调整原因（必填，记入日志）</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 200))}
            rows={3}
            className="mt-1 w-full resize-none rounded-2xl bg-background/60 px-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm"
          >
            取消
          </button>
          <button
            onClick={save}
            disabled={busy || !reason.trim() || delta === 0}
            className="flex-[2] rounded-full px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 gradient-warm"
          >
            {busy ? "保存中…" : "确认调整"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div
      className="glass shadow-soft fixed left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-medium animate-fade-up"
      style={{ bottom: 24, border: "1px solid var(--primary)" }}
    >
      {text}
    </div>
  );
}
