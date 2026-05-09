import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/glint/AppShell";
import {
  DEMO_OPENID,
  addLightPoints,
  addPost,
  getUser,
  listPosts,
  updatePost,
  type TreeholePost,
} from "@/lib/glint-db";
import {
  AI_REPLIES,
  ANIMALS,
  EMOTION_TAGS,
  REPLY_TEMPLATES,
  filterBannedWords,
  pick,
  relativeTime,
} from "@/lib/glint-content";

export const Route = createFileRoute("/treehole")({
  component: TreeholePage,
});

function TreeholePage() {
  return (
    <AppShell>
      <TreeholeView />
    </AppShell>
  );
}

const AI_REPLY_AFTER_MS = 30 * 60 * 1000;

function TreeholeView() {
  const [posts, setPosts] = useState<TreeholePost[]>([]);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState(EMOTION_TAGS[2]);
  const [animal, setAnimal] = useState(() => pick(ANIMALS));
  const [creditScore, setCreditScore] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<TreeholePost | null>(null);

  const refresh = async () => {
    const [p, u] = await Promise.all([listPosts(), getUser()]);
    setPosts(p);
    setCreditScore(u.creditScore);
  };

  useEffect(() => {
    refresh();
  }, []);

  // Scan for posts needing AI reply on load
  useEffect(() => {
    (async () => {
      const all = await listPosts();
      const now = Date.now();
      let changed = false;
      for (const p of all) {
        if (
          !p.hasAIReply &&
          p.replies.length === 0 &&
          now - new Date(p.createdAt).getTime() >= AI_REPLY_AFTER_MS
        ) {
          p.replies.push({
            animal: "AI暖心伙伴",
            content: pick(AI_REPLIES),
            createdAt: new Date().toISOString(),
          });
          p.hasAIReply = true;
          await updatePost(p);
          changed = true;
        }
      }
      if (changed) refresh();
    })();
  }, []);

  const blocked = creditScore < 60;

  const submit = async () => {
    if (!content.trim() || submitting || blocked) return;
    setSubmitting(true);
    try {
      const cleaned = filterBannedWords(content.trim()).slice(0, 500);
      await addPost({
        anonymousAnimal: animal,
        content: cleaned,
        emotionTag: tag,
        createdAt: new Date().toISOString(),
        replies: [],
        hasAIReply: false,
        reportCount: 0,
        isHidden: false,
        openid: DEMO_OPENID,
      });
      setContent("");
      setAnimal(pick(ANIMALS));
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (post: TreeholePost, replyText: string) => {
    if (!replyText.trim()) return;
    const cleaned = filterBannedWords(replyText.trim()).slice(0, 200);
    post.replies.push({
      animal: pick(ANIMALS),
      content: cleaned,
      createdAt: new Date().toISOString(),
    });
    await updatePost(post);
    await addLightPoints(3);
    window.dispatchEvent(new Event("glint:user-updated"));
    setReplyTo(null);
    refresh();
  };

  const report = async (post: TreeholePost) => {
    post.reportCount += 1;
    if (post.reportCount >= 3) post.isHidden = true;
    await updatePost(post);
    refresh();
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">匿名树洞 🌳</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          说出来，没关系。这里没有评判，只有回声。
        </p>
      </header>

      {blocked && (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            background: "color-mix(in oklab, var(--destructive) 12%, transparent)",
            color: "var(--destructive)",
          }}
        >
          你的信用分较低，暂时无法发帖或回应。请稍后再来。
        </div>
      )}

      {/* Compose */}
      <section className="glass shadow-soft p-5" style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={() => setAnimal(pick(ANIMALS))}
            className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground"
            title="点击换一个"
          >
            🎲 你是「{animal}」
          </button>
          <span>{content.length} / 500</span>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          placeholder="写下此刻心里的话…"
          rows={4}
          disabled={blocked}
          className="mt-3 w-full resize-none rounded-2xl bg-background/60 p-3 text-sm outline-none"
          style={{ border: "1px solid var(--border)" }}
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {EMOTION_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className="grid place-items-center rounded-full transition"
                style={{
                  width: 36,
                  height: 36,
                  fontSize: 18,
                  background: tag === t ? "var(--primary-glow)" : "var(--secondary)",
                  border: tag === t ? "2px solid var(--primary)" : "2px solid transparent",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={!content.trim() || submitting || blocked}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50 gradient-warm"
          >
            {submitting ? "…" : "发出树洞"}
          </button>
        </div>
      </section>

      {/* List */}
      <section className="space-y-3">
        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            还没有回声。要不要做第一个开口的人？
          </div>
        )}
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            canReply={creditScore >= 80}
            onReply={() => setReplyTo(p)}
            onReport={() => report(p)}
          />
        ))}
      </section>

      {replyTo && (
        <ReplyModal
          post={replyTo}
          onClose={() => setReplyTo(null)}
          onSubmit={(text) => submitReply(replyTo, text)}
        />
      )}
    </div>
  );
}

function PostCard({
  post,
  canReply,
  onReply,
  onReport,
}: {
  post: TreeholePost;
  canReply: boolean;
  onReply: () => void;
  onReport: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = post.content.length > 100;
  const display = expanded || !long ? post.content : post.content.slice(0, 100) + "…";

  return (
    <article className="glass shadow-soft p-5" style={{ borderRadius: 24 }}>
      <header className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>{post.emotionTag}</span>
          <span className="font-medium text-foreground">{post.anonymousAnimal}</span>
        </div>
        <span className="text-muted-foreground">{relativeTime(post.createdAt)}</span>
      </header>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {display}
        {long && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 text-primary"
          >
            {expanded ? "收起" : "展开"}
          </button>
        )}
      </p>

      {post.replies.length > 0 && (
        <div className="mt-4 space-y-2 rounded-2xl bg-background/40 p-3">
          {post.replies.map((r, i) => (
            <div key={i} className="text-xs leading-relaxed">
              <span className="font-medium text-primary">{r.animal}</span>
              <span className="ml-2 text-muted-foreground">{relativeTime(r.createdAt)}</span>
              <p className="mt-1 text-foreground">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-3 flex items-center justify-end gap-3 text-xs">
        {canReply && (
          <button onClick={onReply} className="text-primary font-medium">
            回应
          </button>
        )}
        <button onClick={onReport} className="text-muted-foreground hover:text-destructive">
          举报
        </button>
      </footer>
    </article>
  );
}

function ReplyModal({
  post,
  onClose,
  onSubmit,
}: {
  post: TreeholePost;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const templates = useMemo(() => REPLY_TEMPLATES, []);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="glass shadow-soft w-full max-w-[640px] p-5 animate-fade-up"
        style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">回应「{post.anonymousAnimal}」</h3>
          <button onClick={onClose} className="text-muted-foreground">✕</button>
        </div>
        <p className="text-xs text-muted-foreground">建议从这些句式开始：</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t}
              onClick={() => setText((v) => (v ? v : t))}
              className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 200))}
          rows={4}
          placeholder="温柔地说出你的回应（最多 200 字）"
          className="mt-3 w-full resize-none rounded-2xl bg-background/60 p-3 text-sm outline-none"
          style={{ border: "1px solid var(--border)" }}
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">{text.length} / 200</div>
        <button
          onClick={() => onSubmit(text)}
          disabled={!text.trim()}
          className="mt-3 w-full rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 gradient-warm"
        >
          发送回应 +3 ✨
        </button>
      </div>
    </div>
  );
}
