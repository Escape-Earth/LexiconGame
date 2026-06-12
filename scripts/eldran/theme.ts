// ==========================================================================
// scripts/eldran/theme.ts —— 艾尔德兰之夜 · 主题
//
// 通过 CSS 自定义属性覆盖默认样式 + 添加剧本特有的元素样式（关键词高亮）。
// 默认 UI 已经定义了 .lex-* 系列；这里只覆盖颜色变量 + 加新选择器。
// ==========================================================================

export const THEME_CSS = `
/* —— 暗色控制台风：覆盖默认 CSS 变量 —— */
.lex-layout {
  --lex-bg: #0c0d10;
  --lex-bg-2: #14161b;
  --lex-bg-3: #1c1f27;
  --lex-line: #2a2f3a;
  --lex-fg: #d8d4c4;
  --lex-fg-dim: #6e7180;
  --lex-accent: #f0b860;
  --lex-accent-bg: rgba(240,184,96,0.08);
  --lex-good: #fcbf49;
  --lex-warn: #e63946;
  --lex-warn-bg: rgba(230,57,70,0.1);

  font-family: "Cascadia Code", "JetBrains Mono", "Consolas", "微软雅黑", monospace;
}

/* —— 关键词高亮（剧本特色）—— */
.eld-kw {
  display: inline-block;
  padding: 0 4px;
  margin: 0 1px;
  border: 1px dashed #f0b860;
  border-radius: 3px;
  font-weight: bold;
  color: #f0b860;
  background: rgba(240,184,96,0.06);
}

/* —— 指控面板（剧本特有，挂在 customSlot 上）—— */
.eld-accuse-panel {
  background: var(--lex-bg-2);
  border: 1px solid var(--lex-warn);
  border-radius: 6px;
  padding: 10px 12px;
  margin-top: 4px;
}
.eld-accuse-title {
  font-size: 12px; letter-spacing: 1px;
  color: var(--lex-warn);
  font-weight: bold;
  margin-bottom: 8px;
}
.eld-accuse-buttons {
  display: flex; gap: 10px;
}
.eld-accuse-btn {
  flex: 1;
  background: var(--lex-bg);
  border: 1px solid;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: bold;
  transition: all 0.15s;
}
.eld-accuse-btn:hover { background: rgba(230,57,70,0.08); transform: translateY(-1px); }
`;
