import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureSeedAdmin, getSession, login } from "@/lib/glint-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [openid, setOpenid] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureSeedAdmin();
    if (getSession()) navigate({ to: "/" });
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const sess = login(openid.trim(), password);
      navigate({ to: sess.isAdmin ? "/admin" : "/" });
    } catch (e: any) {
      setErr(e.message || "登录失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <form
        onSubmit={submit}
        className="glass shadow-soft w-full max-w-[400px] p-7 animate-fade-up"
        style={{ borderRadius: 28 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">微光慢热</h1>
        <p className="mt-1 text-sm text-muted-foreground">慢一点，没关系。请先登录。</p>

        <label className="mt-6 block text-xs font-medium text-muted-foreground">用户名</label>
        <input
          value={openid}
          onChange={(e) => setOpenid(e.target.value)}
          placeholder="字母/数字"
          className="mt-1 w-full rounded-2xl bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2"
          style={{ border: "1px solid var(--border)" }}
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-2xl bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2"
          style={{ border: "1px solid var(--border)" }}
        />

        {err && (
          <p className="mt-3 text-sm" style={{ color: "var(--destructive)" }}>
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !openid || !password}
          className="mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 gradient-warm"
        >
          {busy ? "登录中…" : "进入"}
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          还没有账号？{" "}
          <Link to="/register" className="font-semibold text-primary">
            注册一个
          </Link>
        </p>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          管理员体验账号：admin / admin123
        </p>
      </form>
    </div>
  );
}
