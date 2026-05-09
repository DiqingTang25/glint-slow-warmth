import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/glint/AppShell";
import { addLightPoints, getUser, type GlintUser } from "@/lib/glint-db";
import { SHOP_ITEMS } from "@/lib/glint-content";

export const Route = createFileRoute("/light")({
  component: LightPage,
});

const REDEMPTIONS_KEY = "glint:redemptions";

function loadRedemptions(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(REDEMPTIONS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRedemptions(r: Record<string, number>) {
  localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(r));
}

function LightPage() {
  const [user, setUser] = useState<GlintUser | null>(null);
  const [redemptions, setRedemptions] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<(typeof SHOP_ITEMS)[number] | null>(null);

  const refresh = () => getUser().then(setUser);
  useEffect(() => {
    refresh();
    setRedemptions(loadRedemptions());
  }, []);

  const pct = Math.min(100, ((user?.lightPoints ?? 0) / 300) * 100);

  const redeem = async (item: (typeof SHOP_ITEMS)[number]) => {
    if (!user || user.lightPoints < item.cost) return;
    await addLightPoints(-item.cost);
    const next = { ...redemptions, [item.id]: (redemptions[item.id] || 0) + 1 };
    setRedemptions(next);
    saveRedemptions(next);
    window.dispatchEvent(new Event("glint:user-updated"));
    setConfirmItem(null);
    setToast(`已兑换「${item.name}」 ${item.emoji}`);
    setTimeout(() => setToast(null), 2400);
    refresh();
  };

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-up">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">光能中心 ✨</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            每一次温柔的练习，都会变成一点光。
          </p>
        </header>

        <section
          className="glass shadow-soft relative overflow-hidden p-6"
          style={{ borderRadius: 32, height: 200 }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700"
            style={{
              height: `${pct}%`,
              background: "linear-gradient(to top, var(--primary), var(--primary-glow))",
              opacity: 0.5,
            }}
          />
          <div className="relative">
            <p className="text-xs text-muted-foreground">当前光能</p>
            <p className="mt-1 text-5xl font-semibold text-primary">{user?.lightPoints ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              距离下一档奖励 {Math.max(0, 300 - (user?.lightPoints ?? 0))}
            </p>
          </div>
        </section>

        <section className="glass shadow-soft p-5" style={{ borderRadius: 24 }}>
          <h3 className="mb-3 text-sm font-semibold">如何获得光能</h3>
          <ul className="space-y-2 text-sm">
            {[
              ["完成情绪日记", "+10 / 日"],
              ["完成微光任务", "+5 / 日"],
              ["树洞合格回应", "+3，至多 15/日"],
              ["发出原创信笺", "+5，至多 5/日"],
              ["举报成功", "+10，至多 5/日"],
            ].map(([k, v]) => (
              <li
                key={k}
                className="flex justify-between border-b border-border/60 pb-2 last:border-0"
              >
                <span className="text-foreground">{k}</span>
                <span className="text-primary font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="text-base font-semibold">兑换商店 🛍️</h3>
            <span className="text-xs text-muted-foreground">用光能换一份温柔</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SHOP_ITEMS.map((item) => {
              const owned = redemptions[item.id] || 0;
              const affordable = (user?.lightPoints ?? 0) >= item.cost;
              return (
                <div
                  key={item.id}
                  className="glass shadow-soft flex flex-col p-4"
                  style={{ borderRadius: 20 }}
                >
                  <div className="text-3xl">{item.emoji}</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                  {owned > 0 && (
                    <div className="mt-1 text-[10px] text-primary">已拥有 ×{owned}</div>
                  )}
                  <div className="mt-auto pt-3">
                    <button
                      onClick={() => setConfirmItem(item)}
                      disabled={!affordable}
                      className="w-full rounded-full px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 gradient-warm"
                    >
                      ✨ {item.cost} 光能
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          实物奖励将由校园信使在下个周末统一寄出 📮
        </p>
      </div>

      {confirmItem && (
        <div
          className="fixed inset-0 z-50 grid place-items-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setConfirmItem(null)}
        >
          <div
            className="glass shadow-soft w-[88%] max-w-[400px] p-6 text-center animate-fade-up"
            style={{ borderRadius: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl">{confirmItem.emoji}</div>
            <h3 className="mt-3 text-base font-semibold">兑换「{confirmItem.name}」？</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              将消耗 ✨ {confirmItem.cost} 光能（当前 {user?.lightPoints ?? 0}）
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 rounded-full border border-border px-5 py-3 text-sm font-medium text-muted-foreground"
              >
                再想想
              </button>
              <button
                onClick={() => redeem(confirmItem)}
                className="flex-[2] rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground gradient-warm"
              >
                确认兑换
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="glass shadow-soft fixed left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-medium text-foreground animate-fade-up"
          style={{ bottom: 96, border: "1px solid var(--primary)" }}
        >
          {toast}
        </div>
      )}
    </AppShell>
  );
}
