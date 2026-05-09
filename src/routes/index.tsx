import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/glint/AppShell";
import {
  addLightPoints,
  getDiary,
  getRecentDiaries,
  saveDiary,
  todayStr,
  type MoodDiary,
} from "@/lib/glint-db";
import { MICRO_TASKS, STRESS_LABELS, WARM_QUOTES, pick } from "@/lib/glint-content";

export const Route = createFileRoute("/")({
  component: DiaryPage,
});

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function dateZh(d = new Date()): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function DiaryPage() {
  return (
    <AppShell>
      <DiaryView />
    </AppShell>
  );
}

function DiaryView() {
  const today = todayStr();
  const [stress, setStress] = useState(5);
  const [mood, setMood] = useState<string>("😐");
  const [note, setNote] = useState("");
  const [todayDiary, setTodayDiary] = useState<MoodDiary | null>(null);
  const [recent, setRecent] = useState<MoodDiary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState(false);
  const quote = useMemo(() => pick(WARM_QUOTES), []);
  const microTask = useMemo(() => pick(MICRO_TASKS), []);
  const burstRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    const [d, r] = await Promise.all([getDiary(today), getRecentDiaries(7)]);
    setTodayDiary(d ?? null);
    setRecent(r);
  };

  useEffect(() => {
    refresh();
  }, []);

  const showTask = useMemo(() => {
    if (recent.length < 2) return false;
    const last2 = recent.slice(-2);
    return last2.length === 2 && last2.every((d) => d.stressLevel >= 7);
  }, [recent]);

  const submit = async () => {
    if (todayDiary || submitting) return;
    setSubmitting(true);
    try {
      await saveDiary({
        date: today,
        stressLevel: stress,
        moodEmoji: mood,
        note: note.slice(0, 200),
      });
      await addLightPoints(10);
      window.dispatchEvent(new Event("glint:user-updated"));
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const completeTask = async () => {
    await addLightPoints(5);
    window.dispatchEvent(new Event("glint:user-updated"));
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
  };

  const last7Days = useMemo(() => {
    const arr: { date: string; done: boolean; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = todayStr(d);
      arr.push({
        date: ds,
        done: recent.some((r) => r.date === ds),
        isToday: ds === today,
      });
    }
    return arr;
  }, [recent, today]);

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-sm text-muted-foreground">{dateZh()}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {greeting()}，微光使者
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{quote}</p>
      </header>

      {/* Today's check-in card */}
      <section
        className="glass shadow-soft relative overflow-hidden p-6"
        style={{ borderRadius: 32 }}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">今日社交情绪</h2>
          {todayDiary && (
            <span className="text-xs text-muted-foreground">已完成 ✓</span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-4">
          {(["😊", "😐", "😔"] as const).map((m, i) => {
            const presets = [3, 6, 8];
            const labels = ["还不错", "一般般", "不太好"];
            const active = mood === m;
            return (
              <button
                key={m}
                type="button"
                disabled={!!todayDiary}
                onClick={() => {
                  setMood(m);
                  setStress(presets[i]);
                }}
                className="group flex flex-col items-center gap-1.5 transition-all duration-200 disabled:cursor-not-allowed"
                style={{ opacity: todayDiary ? 0.55 : 1 }}
              >
                <span
                  className="grid place-items-center rounded-full transition-all duration-200"
                  style={{
                    width: 64,
                    height: 64,
                    fontSize: 32,
                    background: active ? "var(--primary-glow)" : "var(--secondary)",
                    border: active ? "2px solid var(--primary)" : "2px solid transparent",
                    transform: active ? "scale(1.1)" : "scale(1)",
                    boxShadow: active ? "0 8px 20px var(--primary-glow)" : "none",
                  }}
                >
                  {m}
                </span>
                <span
                  className="text-[11px] transition-colors"
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)", fontWeight: active ? 600 : 400 }}
                >
                  {labels[i]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">困扰强度</span>
            <span className="font-semibold text-primary">
              {todayDiary?.stressLevel ?? stress} · {STRESS_LABELS[(todayDiary?.stressLevel ?? stress) - 1]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            disabled={!!todayDiary}
            value={todayDiary?.stressLevel ?? stress}
            onChange={(e) => setStress(Number(e.target.value))}
            className="glint-range"
          />
        </div>

        <div className="mt-5">
          <textarea
            value={todayDiary?.note ?? note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            disabled={!!todayDiary}
            placeholder="发生了什么？（选填，不超过200字）"
            rows={3}
            className="w-full resize-none rounded-2xl bg-background/60 p-3 text-sm outline-none focus:ring-2"
            style={{ borderColor: "var(--border)", border: "1px solid var(--border)" }}
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {(todayDiary?.note ?? note).length} / 200
          </div>
        </div>

        <button
          disabled={!!todayDiary || submitting}
          onClick={submit}
          className="mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50 gradient-warm"
          style={{ minHeight: 44 }}
        >
          {todayDiary ? "今日已打卡，明天见 🌙" : submitting ? "保存中…" : "完成打卡 +10 ✨"}
        </button>

        {burst && (
          <div
            ref={burstRef}
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <div
              className="glint-burst rounded-full"
              style={{
                width: 80,
                height: 80,
                background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
              }}
            />
          </div>
        )}
      </section>

      {/* 7-day streak */}
      <section className="glass shadow-soft p-5" style={{ borderRadius: 24 }}>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">最近 7 天</h3>
        <div className="flex items-center justify-between">
          {last7Days.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div
                className="grid place-items-center rounded-full transition-all"
                style={{
                  width: 28,
                  height: 28,
                  background: d.done ? "var(--success)" : "var(--secondary)",
                  boxShadow: d.isToday ? "0 0 0 4px var(--primary-glow)" : "none",
                }}
              >
                {d.done && <span style={{ fontSize: 12, color: "white" }}>✓</span>}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {d.date.slice(5).replace("-", "/")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Micro task */}
      {showTask && (
        <section
          className="shadow-soft p-5 text-primary-foreground gradient-warm"
          style={{ borderRadius: 24 }}
        >
          <div className="flex items-center gap-2 text-xs opacity-90">
            <span>🌟</span>
            <span>给你的微光任务</span>
          </div>
          <p className="mt-2 text-base font-medium leading-relaxed">{microTask}</p>
          <button
            onClick={completeTask}
            className="mt-3 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/30"
          >
            完成任务 +5 ✨
          </button>
        </section>
      )}

      {!showTask && recent.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          连续打卡 {recent.length} 天，慢慢来。
        </p>
      )}
    </div>
  );
}
