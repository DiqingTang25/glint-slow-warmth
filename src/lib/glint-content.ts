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
  "看到你的文字，我想给你一个温柔的"在"。🌿",
  "无论现在多难，请记得你值得被温柔以待。",
];

export const REPLY_TEMPLATES = [
  "我听到你说……",
  "这种感受我也有过……",
  "谢谢你愿意分享……",
  "想给你一个温柔的回应……",
];

export function filterBannedWords(text: string): string {
  let out = text;
  for (const w of BANNED_WORDS) {
    out = out.replaceAll(w, "*".repeat(w.length));
  }
  return out;
}

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
