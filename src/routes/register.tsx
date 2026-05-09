import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { register } from "@/lib/glint-auth";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [openid, setOpenid] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) return setErr("两次密码不一致");
    setBusy(true);
    try {
      register(openid.trim(), password, nickname.trim());
      navigate({ to: "/" });
    } catch (e: any) {
      setErr(e.message || "注册失败");
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
        <h1 className="text-2xl font-semibold tracking-tight">注册账号</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          一个温柔的角落，等你来住下。
        </p>

        <label className="mt-6 block text-xs font-medium text-muted-foreground">用户名</label>
        <input
          value={openid}
          onChange={(e) => setOpenid(e.target.value)}
          placeholder="3-20 位字母/数字/下划线"
          className="mt-1 w-full rounded-2xl bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2"
          style={{ border: "1px solid var(--border)" }}
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">昵称（可选）</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="想被怎么称呼？"
          className="mt-1 w-full rounded-2xl bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2"
          style={{ border: "1px solid var(--border)" }}
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="至少 6 位"
          className="mt-1 w-full rounded-2xl bg-background/60 px-3 py-2.5 text-sm outline-none focus:ring-2"
          style={{ border: "1px solid var(--border)" }}
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground">确认密码</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
          disabled={busy}
          className="mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 gradient-warm"
        >
          {busy ? "创建中…" : "创建账号"}
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          已有账号？{" "}
          <Link to="/login" className="font-semibold text-primary">
            去登录
          </Link>
        </p>
      </form>
    </div>
  );
}
