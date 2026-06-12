export const THEME_CSS = `
.lex-layout {
  --lex-bg: #f8fafc;
  --lex-bg-2: #ffffff;
  --lex-bg-3: #e2e8f0;
  --lex-line: #cbd5e1;
  --lex-fg: #1e293b;
  --lex-fg-dim: #64748b;
  --lex-accent: #3b82f6;
  --lex-accent-bg: rgba(59, 130, 246, 0.1);
  --lex-good: #10b981;
  --lex-warn: #ef4444;
  --lex-warn-bg: rgba(239, 68, 68, 0.1);

  font-family: system-ui, -apple-system, sans-serif;
}

.conan-kw {
  color: var(--lex-accent);
  font-weight: 600;
  cursor: pointer;
  border-bottom: 1px dashed var(--lex-accent);
}

.conan-accuse-panel {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed var(--lex-line);
}
.conan-accuse-title {
  font-size: 14px;
  color: var(--lex-fg-dim);
  margin-bottom: 12px;
  text-align: center;
}
.conan-accuse-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.conan-accuse-btn {
  background: transparent;
  border: 1px solid var(--lex-line);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.conan-accuse-btn:hover {
  background: var(--lex-warn-bg);
  border-color: var(--lex-warn);
  color: var(--lex-warn) !important;
}
`;