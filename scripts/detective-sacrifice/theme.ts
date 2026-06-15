export const THEME_CSS = `
.lex-layout {
  --lex-bg: #1a1c1a;            /* 深色森林绿背景 */
  --lex-bg-2: #242824;          /* 面板背景 */
  --lex-bg-3: #2d332d;          /* 面板头背景 */
  --lex-line: #3f453f;          /* 边框 */
  --lex-fg: #d4d4d4;            /* 主文字 */
  --lex-fg-dim: #888888;        /* 弱化文字 */
  --lex-accent: #d4af37;        /* 金色（强调色） */
  --lex-accent-bg: rgba(212, 175, 55, 0.15);
  --lex-good: #ffd700;          /* 结局色：金 */
  --lex-warn: #ff4444;          /* 警告色 */
  --lex-warn-bg: rgba(255, 68, 68, 0.1);

  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 关键词高亮样式 */
.sac-kw {
  color: var(--lex-accent);
  font-weight: bold;
  border-bottom: 1px dashed var(--lex-accent);
  padding: 0 2px;
}

/* 指控面板样式 */
.sac-accuse-panel {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--lex-bg-3);
  border: 1px solid var(--lex-line);
  border-radius: 4px;
  animation: sac-fade-in 0.5s ease-out;
}

.sac-accuse-title {
  font-size: 0.9rem;
  color: var(--lex-warn);
  margin-bottom: 0.8rem;
  text-align: center;
  font-weight: bold;
}

.sac-accuse-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sac-accuse-btn {
  background: transparent;
  border: 1px solid var(--lex-line);
  color: var(--lex-fg);
  padding: 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  border-radius: 2px;
}

.sac-accuse-btn:hover {
  background: var(--lex-accent-bg);
  border-color: var(--lex-accent);
}

@keyframes sac-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
