import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/glint/AppShell";
import { getUser, type GlintUser } from "@/lib/glint-db";

export const Route = createFileRoute("/light")({
  component: LightPage,
});

function LightPage() {
  const [user, setUser] = useState<GlintUser | null>(null);
  useEffect(() => {
    getUser().then(setUser);
  }, []);
  const pct = Math.min(100, ((user?.lightPoints ?? 0) / 300) * 100);

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
            <p className="mt-1 text-xs text-muted-foreground">距离下一档奖励 {Math.max(0, 300 - (user?.lightPoints ?? 0))}</p>
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
              <li key={k} className="flex justify-between border-b border-border/60 pb-2 last:border-0">
                <span className="text-foreground">{k}</span>
                <span className="text-primary font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          兑换商店将在下一个版本上线。
        </p>
      </div>
    </AppShell>
  );
}
