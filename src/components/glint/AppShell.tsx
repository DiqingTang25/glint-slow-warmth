import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getUser, type GlintUser } from "@/lib/glint-db";
import {
  ensureSeedAdmin,
  getSession,
  isAdmin as checkAdmin,
  logout,
} from "@/lib/glint-auth";

const TABS = [
  { to: "/", icon: "📓", label: "日记" },
  { to: "/treehole", icon: "🌳", label: "树洞" },
  { to: "/companion", icon: "🤝", label: "陪伴" },
  { to: "/light", icon: "✨", label: "光能" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<GlintUser | null>(null);
  const [session, setSession] = useState(() =>
    typeof window === "undefined" ? null : getSession()
  );

  useEffect(() => {
    ensureSeedAdmin();
    if (!getSession()) {
      navigate({ to: "/login" });
      return;
    }
    let mounted = true;
    getUser().then((u) => mounted && setUser(u)).catch(() => {});
    const handler = () => getUser().then((u) => mounted && setUser(u));
    const auth = () => setSession(getSession());
    window.addEventListener("glint:user-updated", handler);
    window.addEventListener("glint:auth-changed", auth);
    return () => {
      mounted = false;
      window.removeEventListener("glint:user-updated", handler);
      window.removeEventListener("glint:auth-changed", auth);
    };
  }, [navigate]);

  if (!session) return null;

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main
        className="mx-auto w-full max-w-[640px]"
        style={{ padding: "24px 20px 110px 20px" }}
      >
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>👋 {session.openid}{session.isAdmin ? " · 管理员" : ""}</span>
          <div className="flex items-center gap-3">
            {checkAdmin() && (
              <Link to="/admin" className="font-medium text-primary">
                管理后台
              </Link>
            )}
            <button onClick={onLogout} className="hover:text-foreground">
              退出
            </button>
          </div>
        </div>
        {children}
      </main>

      <Link
        to="/light"
        aria-label="光能中心"
        className="fixed z-40 grid place-items-center rounded-full text-primary-foreground shadow-soft glint-pulse gradient-warm"
        style={{
          right: 18,
          bottom: 92,
          width: 56,
          height: 56,
          fontSize: 11,
          lineHeight: 1.1,
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        <div>
          <div style={{ fontSize: 16 }}>✨</div>
          <div style={{ fontWeight: 600 }}>{user?.lightPoints ?? 0}</div>
        </div>
      </Link>

      <nav
        className="glass fixed bottom-0 left-0 right-0 z-30 mx-auto flex items-center justify-around"
        style={{ height: 70, maxWidth: 640, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        {TABS.map((t) => {
          const active =
            t.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex flex-1 flex-col items-center justify-center gap-1"
              style={{
                color: active ? "var(--primary)" : "var(--muted-foreground)",
                fontWeight: active ? 600 : 400,
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 11 }}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
