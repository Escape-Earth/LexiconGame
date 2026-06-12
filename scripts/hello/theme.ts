// ==========================================================================
// scripts/hello/theme.ts —— Hello, Lexicon! · 暖色主题
//
// 通过覆盖 CSS 变量，把整个默认 UI 改造成暖色卡片风。
// 这里只重定义颜色，不改 DOM 结构。
// ==========================================================================

export const THEME_CSS = `
/* —— 暖色调：覆盖默认 CSS 变量 —— */
.lex-stage {
  --lex-bg: #f7efe2;
  --lex-bg-2: #fff7e8;
  --lex-line: #d4b48a;
  --lex-fg: #5a4a36;
  --lex-fg-dim: #a08770;
  --lex-accent: #d49a4a;
  --lex-accent-bg: rgba(212,154,74,0.15);
  --lex-good: #98c156;
  --lex-warn: #d4632a;
  --lex-warn-bg: rgba(212,99,42,0.1);

  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 略微加大字号让咖啡店感更亲切 */
.lex-stage .lex-msg-body { font-size: 15px; }
.lex-stage .lex-ending-title { font-size: 20px; }

/* 把 NPC 头像改大一点，强调 emoji */
.lex-stage .lex-npc-avatar { font-size: 28px; }
`;
