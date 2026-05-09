import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/glint/AppShell";
import {
  DEMO_OPENID,
  addLetter,
  addLightPoints,
  listInbox,
  listOutbox,
  markLetterRead,
  type Letter,
} from "@/lib/glint-db";
import {
  LETTER_STARTERS,
  LETTER_THEMES,
  PEN_PAL_NAMES,
  PEN_PAL_REPLIES,
  SEED_LETTERS,
  filterBannedWords,
  pick,
  relativeTime,
  type LetterTheme,
} from "@/lib/glint-content";

export const Route = createFileRoute("/companion")({
  component: () => (
    <AppShell>
      <CompanionView />
    </AppShell>
  ),
});

const SEED_KEY = "glint:companion-seeded";
const REPLY_DELAY_MS = 45 * 1000; // 演示版：45 秒

function CompanionView() {
  const [tab, setTab] = useState<"inbox" | "compose" | "outbox">("inbox");
  const [inbox, setInbox] = useState<Letter[]>([]);
  const [outbox, setOutbox] = useState<Letter[]>([]);
  const [openLetter, setOpenLetter] = useState<Letter | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const seededRef = useRef(false);

  const refresh = async () => {
    const [i, o] = await Promise.all([listInbox(), listOutbox()]);
    setInbox(i);
    setOutbox(o);
  };

  // Seed inbox on first visit
  useEffect(() => {
    (async () => {
      if (seededRef.current) return;
      seededRef.current = true;
      if (typeof localStorage !== "undefined" && !localStorage.getItem(SEED_KEY)) {
        for (const seed of SEED_LETTERS) {
          await addLetter({
            fromOpenid: `pen_pal_${seed.from}`,
            fromName: seed.from,
            toOpenid: DEMO_OPENID,
            theme: seed.theme,
            content: seed.content,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            deliverAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          });
        }
        localStorage.setItem(SEED_KEY, "1");
      }
      await refresh();
    })();
  }, []);

  // Tick for countdowns + redeliver newly-arrived letters
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
      refresh();
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleSend = async (theme: LetterTheme, content: string) => {
    const cleaned = filterBannedWords(content.trim()).slice(0, 600);
    const palName = pick(PEN_PAL_NAMES);
    const palOpenid = `pen_pal_${palName}_${Date.now()}`;
    const sentAt = new Date();
    // The "sent" letter shows up in outbox immediately
    await addLetter({
      fromOpenid: DEMO_OPENID,
      fromName: "你",
      toOpenid: palOpenid,
      theme,
      content: cleaned,
      createdAt: sentAt.toISOString(),
      deliverAt: sentAt.toISOString(),
    });
    // Schedule a reply that arrives after REPLY_DELAY_MS
    const replyContent = pick(PEN_PAL_REPLIES[theme] ?? PEN_PAL_REPLIES.other);
    await addLetter({
      fromOpenid: palOpenid,
      fromName: palName,
      toOpenid: DEMO_OPENID,
      theme,
      content: replyContent,
      createdAt: new Date(sentAt.getTime() + REPLY_DELAY_MS).toISOString(),
      deliverAt: new Date(sentAt.getTime() + REPLY_DELAY_MS).toISOString(),
      isReply: true,
    });
    await addLightPoints(5);
    window.dispatchEvent(new Event("glint:user-updated"));
    showToast("信笺已寄出 · 光能 +5 ✨");
    await refresh();
    setTab("outbox");
  };

  const openAndRead = async (l: Letter) => {
    setOpenLetter(l);
    if (!l.readAt && l.id != null) {
      await markLetterRead(l.id);
      await refresh();
    }
  };

  const unreadCount = inbox.filter((l) => !l.readAt).length;

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">同频陪伴 🤝</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          慢信笺：写下心里的话，校园里某个同频的人会读到，并慢慢回你。
        </p>
      </header>

      {/* Tab switcher */}
      <div
        className="glass shadow-soft flex p-1"
        style={{ borderRadius: 100 }}
      >
        {(
          [
            { k: "inbox", label: `收件箱${unreadCount ? ` · ${unreadCount}` : ""}` },
            { k: "compose", label: "写信笺" },
            { k: "outbox", label: "已寄出" },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className="flex-1 rounded-full py-2 text-sm font-medium transition"
            style={{
              background: tab === t.k ? "var(--primary)" : "transparent",
              color: tab === t.k ? "var(--primary-foreground)" : "var(--muted-foreground)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "compose" && <Compose onSend={handleSend} />}

      {tab === "inbox" && (
        <LetterList
          letters={inbox}
          empty="还没有信笺。先写一封，把光递给某个人吧。"
          onOpen={openAndRead}
          highlightUnread
        />
      )}

      {tab === "outbox" && (
        <OutboxList letters={outbox} now={now} onOpen={openAndRead} />
      )}

      {openLetter && (
        <LetterModal letter={openLetter} onClose={() => setOpenLetter(null)} />
      )}

      {toast && (
        <div
          className="glass shadow-soft fixed left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-medium text-foreground animate-fade-up"
          style={{ bottom: 96, border: "1px solid var(--primary)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Compose({ onSend }: { onSend: (t: LetterTheme, c: string) => void }) {
  const [theme, setTheme] = useState<LetterTheme>("future");
  const starter = useMemo(() => pick(LETTER_STARTERS), []);
  const [text, setText] = useState(starter);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSend(theme, text);
      setText(pick(LETTER_STARTERS));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass shadow-soft p-5" style={{ borderRadius: 24 }}>
      <p className="text-xs text-muted-foreground">主题 · 帮助同频朋友找到你</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {LETTER_THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition"
            style={{
              background: theme === t.key ? "var(--primary-glow)" : "var(--secondary)",
              border: theme === t.key ? "1.5px solid var(--primary)" : "1.5px solid transparent",
              color: theme === t.key ? "var(--primary)" : "var(--secondary-foreground)",
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 600))}
        rows={8}
        placeholder="见信好…"
        className="mt-4 w-full resize-none rounded-2xl bg-background/60 p-3 text-sm leading-relaxed outline-none"
        style={{
          border: "1px solid var(--border)",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>不实名 · 不留账号 · 不催促回信</span>
        <span>{text.length} / 600</span>
      </div>

      <button
        onClick={submit}
        disabled={!text.trim() || submitting}
        className="mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 gradient-warm"
      >
        {submitting ? "正在折叠信纸…" : "封口寄出 +5 ✨"}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        信笺会在数十秒内被某个同频的同学收到，对方有空时会慢慢回你。
      </p>
    </section>
  );
}

function themeBadge(themeKey: string) {
  const t = LETTER_THEMES.find((x) => x.key === themeKey);
  return t ? `${t.emoji} ${t.label}` : "✨";
}

function LetterList({
  letters,
  empty,
  onOpen,
  highlightUnread = false,
}: {
  letters: Letter[];
  empty: string;
  onOpen: (l: Letter) => void;
  highlightUnread?: boolean;
}) {
  if (letters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {letters.map((l) => {
        const unread = highlightUnread && !l.readAt;
        return (
          <li key={l.id}>
            <button
              onClick={() => onOpen(l)}
              className="glass shadow-soft w-full p-4 text-left transition hover:scale-[1.01]"
              style={{
                borderRadius: 20,
                border: unread ? "1.5px solid var(--primary)" : undefined,
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  {l.isReply ? "↩ " : ""}
                  {l.fromName}
                </span>
                <span className="text-muted-foreground">
                  {themeBadge(l.theme)} · {relativeTime(l.deliverAt)}
                </span>
              </div>
              <p
                className="mt-2 line-clamp-2 text-sm text-foreground"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {l.content}
              </p>
              {unread && (
                <span
                  className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: "var(--primary-glow)",
                    color: "var(--primary)",
                  }}
                >
                  · 未读
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function OutboxList({
  letters,
  now,
  onOpen,
}: {
  letters: Letter[];
  now: number;
  onOpen: (l: Letter) => void;
}) {
  if (letters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        还没有寄出过信。一封信，可能就是另一个人黑夜里的灯。
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {letters.map((l) => {
        const arrived = new Date(l.deliverAt).getTime() <= now;
        return (
          <li key={l.id}>
            <button
              onClick={() => onOpen(l)}
              className="glass shadow-soft w-full p-4 text-left"
              style={{ borderRadius: 20 }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  寄给「{l.fromName === "你" ? "同频朋友" : l.fromName}」
                </span>
                <span className="text-muted-foreground">
                  {themeBadge(l.theme)} · {relativeTime(l.createdAt)}
                </span>
              </div>
              <p
                className="mt-2 line-clamp-2 text-sm text-foreground"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {l.content}
              </p>
              <p
                className="mt-2 text-[11px]"
                style={{ color: arrived ? "var(--success)" : "var(--muted-foreground)" }}
              >
                {arrived ? "✓ 已被某位同学读到" : "⏳ 信笺正在路上…"}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function LetterModal({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="glass shadow-soft w-full max-w-[560px] p-6 animate-fade-up"
        style={{ borderRadius: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{themeBadge(letter.theme)}</span>
          <button onClick={onClose} aria-label="关闭" className="text-lg">
            ✕
          </button>
        </div>
        <h3 className="mt-2 text-base font-semibold">
          {letter.isReply ? "↩ " : ""}
          来自「{letter.fromName}」
        </h3>
        <p className="text-[11px] text-muted-foreground">
          {relativeTime(letter.deliverAt)}
        </p>
        <div
          className="mt-4 whitespace-pre-wrap rounded-2xl bg-background/50 p-4 text-sm leading-relaxed text-foreground"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            border: "1px solid var(--border)",
          }}
        >
          {letter.content}
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          每封信只会被一个人读到。请把这份慢，留给真正需要的人。
        </p>
      </div>
    </div>
  );
}
