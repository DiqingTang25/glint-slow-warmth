// Static content libraries for Glint Slow Warmth

export const WARM_QUOTES = [
  "慢一点，没关系。",
  "你已经走了很远，停下来歇一会儿吧。",
  "今天的光，是为你而留的。",
  "一呼一吸之间，就是当下。",
  "做不到也没关系，先抱抱自己。",
  "不必急着开花，根在悄悄长。",
  "你存在本身，就值得被温柔以待。",
  "云会散，雨会停，难过也会过去。",
  "微光也是光，慢热也是热。",
  "今天，做你自己就够了。",
];

export const STRESS_LABELS = [
  "极低", "很低", "低", "较低", "一般",
  "稍高", "偏高", "高", "很高", "极高",
];

export const MICRO_TASKS = [
  "站起来伸个懒腰，深呼吸3次。",
  "喝一杯温水，分五口慢慢咽下。",
  "闭眼听当前环境中最远的三种声音。",
  "给桌上的绿植浇一点水。",
  '用手机备忘录写一句"今天最庆幸的一件事"。',
  "整理桌面，把一件杂物放回原位。",
  "打开窗户，看户外1分钟，数出五种颜色。",
  "做5个深呼吸，每次吸气4秒，呼气6秒。",
  "给微信好友发一个表情包，不要求回复。",
  "原地高抬腿10次。",
  "找一首纯音乐，只听前60秒。",
  "把自己最近的一张照片调成黑白。",
  "写下明天要做的第一件小事。",
  "拉伸颈部，左转右转各5次。",
  "看一段1分钟的动物短片。",
  '对自己说一句"辛苦了"。',
  '给父母发一句"今天天气不错"。',
  "收拾床铺，叠好被子。",
  "吃掉一个水果。",
  "静坐30秒，什么都不想。",
  "走到窗边，做3次深呼吸。",
  "用温水洗一下脸。",
  "给自己泡一杯热茶。",
  "把手机静音5分钟。",
  "翻开一本书，读一页就好。",
  "听自己最喜欢的一首歌。",
  "写下三件感谢的小事。",
  "把房间灯光调暖。",
  "做一次温柔的自我拥抱。",
  "在纸上画一个圆。",
];

export const BANNED_WORDS = [
  "色情", "裸聊", "约炮", "毒品", "赌博", "诈骗",
  "傻逼", "脑残", "弱智", "去死", "自杀方式",
  "广告加微信", "代理",
];

export const ANIMALS = [
  "迷茫的树懒", "安静的海豚", "沉默的鲸鱼",
  "胆小的刺猬", "温柔的鹿", "孤独的猫",
  "好奇的狐狸", "认真的水獭", "贪睡的考拉",
];

export const EMOTION_TAGS = ["😭", "😤", "😔", "😌", "😊"];

export const AI_REPLIES = [
  "听到你这么说，我感觉你经历了一些不容易的事情。我在这里陪着你。",
  "谢谢你愿意分享这些。你的感受是真实的，也是重要的。",
  "这种时刻确实很难熬，但你不是一个人。抱抱你 🤗",
  "你已经做得很好了，承认自己的情绪本身就是勇气。",
  '看到你的文字，我想给你一个温柔的"在"。🌿',
  "无论现在多难，请记得你值得被温柔以待。",
];

export const REPLY_TEMPLATES = [
  "我听到你说……",
  "这种感受我也有过……",
  "谢谢你愿意分享……",
  "想给你一个温柔的回应……",
];

export const LETTER_THEMES = [
  { key: "study", emoji: "📚", label: "学业" },
  { key: "love", emoji: "💌", label: "感情" },
  { key: "future", emoji: "🌅", label: "迷茫" },
  { key: "homesick", emoji: "🏠", label: "想家" },
  { key: "joy", emoji: "🌼", label: "小确幸" },
  { key: "other", emoji: "✨", label: "其他" },
] as const;

export type LetterTheme = (typeof LETTER_THEMES)[number]["key"];

export const PEN_PAL_NAMES = [
  "西操跑道上的风", "二食堂二楼的光", "BB楼23层的云",
  "图书馆窗边的雨", "湖边的晚霞", "宿舍楼下的猫",
];

export const LETTER_STARTERS = [
  "见信好。今天写信给你，是因为……",
  "你好呀，陌生的同频朋友。",
  "如果可以，我想悄悄对你说……",
  "这封信不需要回复，只是想被听见。",
];

export const PEN_PAL_REPLIES: Record<LetterTheme, string[]> = {
  study: [
    "学业的压力像看不见的风，但你已经站着没有倒下，这本身就很厉害了。慢一点，没关系。",
    "我也在赶 ddl 的夜里写过类似的话。给你一个隔空的击掌🤝，明天的我们会继续努力。",
  ],
  love: [
    "感情这件事没有正确答案。你愿意说出来，已经比很多人都勇敢了。",
    "无论结果如何，请先好好爱自己。爱不是消耗，是彼此都更亮一点。",
  ],
  future: [
    "迷茫的时候，先不要做大决定。把今天过好，路就长出来了。",
    "我也常常不知道方向，但我们走着走着，会有光从某个地方照进来的。",
  ],
  homesick: [
    "想家的时候记得吃顿热饭。家会一直在那儿，等你慢慢长大再回去看它。",
    "我把一杯热水放在窗台上，假装是从家乡带来的。给你也留一杯。",
  ],
  joy: [
    "谢谢你分享的小确幸，我读完之后嘴角也翘起来了。世界因此多了一束光。",
    "请继续把这些小事记下来，它们会在你低谷的时候点燃自己。",
  ],
  other: [
    "我读了你的信，谢谢你愿意说。你不是一个人。",
    "隔着校园的某个角落，我在想你。希望今晚你睡得安稳。",
  ],
};

export const SEED_LETTERS: Array<{ theme: LetterTheme; from: string; content: string }> = [
  {
    theme: "future",
    from: "南门外的银杏",
    content:
      "见信好。最近每天都在赶 due，赶完一个又一个，却觉得自己什么都没学到。\n如果你也在这样的夜里，我想悄悄告诉你：能撑到现在已经很厉害了。我们一起，慢慢来。",
  },
  {
    theme: "joy",
    from: "BB楼楼梯口的猫",
    content:
      "今天在校园里看到了一只胖橘猫，它在草坪上打了个滚就走了，我莫名其妙地笑了好久。\n世界很大，烦恼很多，但今天有一只猫为我营业。希望你也能被一些小事温柔击中。",
  },
];

export function filterBannedWords(text: string): string {
  let out = text;
  for (const w of BANNED_WORDS) {
    out = out.replaceAll(w, "*".repeat(w.length));
  }
  return out;
}

/**
 * 过滤后若仅剩星号 / 标点 / 空白，返回 null —— 表示拒绝发布。
 */
export function sanitizeUserText(text: string): string | null {
  const cleaned = filterBannedWords(text.trim());
  const stripped = cleaned.replace(/[\s*\p{P}]/gu, "");
  if (!stripped) return null;
  return cleaned;
}

export const REPORT_REASONS = [
  "恶意攻击",
  "色情低俗",
  "广告骚扰",
  "其他不适",
] as const;

export const SHOP_ITEMS = [
  { id: "skin-sakura", emoji: "🌸", name: "樱花主题色", desc: "粉嫩柔光皮肤", cost: 50 },
  { id: "skin-night", emoji: "🌙", name: "暗夜模式皮肤", desc: "安静的深色调", cost: 80 },
  { id: "avatar-otter", emoji: "🦦", name: "限定水獭头像", desc: "树洞专属身份", cost: 60 },
  { id: "postcard", emoji: "📮", name: "实体明信片", desc: "由校园信使寄出", cost: 200 },
  { id: "letter-paper", emoji: "📜", name: "复古信纸", desc: "写慢信用", cost: 30 },
  { id: "badge-firefly", emoji: "🪰", name: "萤火徽章", desc: "陪伴他人的勋章", cost: 100 },
] as const;

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}
