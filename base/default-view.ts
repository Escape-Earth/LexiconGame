// ==========================================================================
// base/default-view.ts —— 默认 UI（所有剧本共用）
//
// 这是一个 vanilla DOM 渲染层，订阅 Presenter 的 onChange / onMessage。
// 它不知道 Engine。只跟 Presenter + Script.viewHooks 对话。
//
// 布局（v3 风格 · 二栏）：
//   ┌────────────────────────────┬──────────────────┐
//   │ DIALOGUE (mode-hint + log) │ NPC              │
//   │                            │                  │
//   │ TOPIC BOOK                 │ ─────────────    │
//   │                            │ LOG · 探索记录    │
//   │ CUSTOM SLOT                │                  │
//   └────────────────────────────┴──────────────────┘
//
// 探索记录由 DefaultView 自动派生自 onMessage 流，所有剧本免费获得。
// 剧本无需做任何额外工作。
// ==========================================================================

import { Script } from './script-base';
import { Presenter, ViewSnapshot, ViewMessage } from './presenter';
import { NPCBase, EndingBase } from './types';

const BASE_STYLE_ID = 'lex-base-style';
const THEME_STYLE_ID = 'lex-theme-style';

export class DefaultView {
  private root: HTMLElement;

  // —— DOM 节点 —— //
  private $hint!: HTMLElement;
  private $log!: HTMLElement;
  private $topics!: HTMLElement;
  private $npcs!: HTMLElement;
  private $custom!: HTMLElement;
  private $record!: HTMLElement;

  // —— 注入的样式节点 —— //
  private themeStyleEl?: HTMLStyleElement;

  // —— Presenter unsubscribers —— //
  private offChange?: () => void;
  private offMessage?: () => void;

  constructor(container: HTMLElement, private presenter: Presenter, private script: Script) {
    this.root = container;
  }

  mount(): void {
    this.injectBaseStyle();
    this.injectThemeStyle();
    this.root.innerHTML = TEMPLATE;
    this.cacheRefs();
    this.subscribe();
  }

  unmount(): void {
    this.offChange?.(); this.offChange = undefined;
    this.offMessage?.(); this.offMessage = undefined;
    this.themeStyleEl?.remove();
    this.themeStyleEl = undefined;
    this.root.innerHTML = '';
  }

  /** 让剧本逻辑可以往"自定义面板"塞东西（如指控按钮） */
  getCustomSlot(): HTMLElement {
    return this.$custom;
  }

  // ───────────────────────────────────────
  // 订阅 Presenter
  // ───────────────────────────────────────

  private subscribe(): void {
    this.offChange  = this.presenter.onChange(snap => this.applySnapshot(snap));
    this.offMessage = this.presenter.onMessage(msg => {
      this.appendMessage(msg);
      this.appendRecord(msg);
    });
  }

  // ───────────────────────────────────────
  // 渲染
  // ───────────────────────────────────────

  private applySnapshot(snap: ViewSnapshot): void {
    this.renderHint(snap);
    this.renderTopics(snap);
    this.renderNpcs(snap);
    this.renderCustomSlot();
  }

  private renderCustomSlot(): void {
    if (!this.script.renderCustomSlot) {
      this.$custom.innerHTML = '';
      return;
    }
    this.$custom.innerHTML = '';
    this.script.renderCustomSlot(this.$custom, this.presenter);
  }

  private renderHint(snap: ViewSnapshot): void {
    const klass = `lex-hint ${snap.hint.kind}`;
    this.$hint.className = klass;
    if (snap.hint.kind === 'selected') {
      const t = this.script.texts.cancelLabel ?? '取消';
      this.$hint.innerHTML = `<span class="lex-hint-tag">质问模式</span> ${this.escapeHtml(snap.hint.text)} <button class="lex-cancel" data-act="cancel">${t}</button>`;
      const btn = this.$hint.querySelector('[data-act="cancel"]') as HTMLButtonElement;
      btn.onclick = () => this.presenter.cancelSelection();
    } else if (snap.hint.kind === 'ended') {
      this.$hint.innerHTML = `<span class="lex-hint-tag end">已结束</span> ${this.escapeHtml(snap.hint.text)}`;
    } else {
      this.$hint.innerHTML = `<span class="lex-hint-tag idle">选择模式</span> ${this.escapeHtml(snap.hint.text)}`;
    }
  }

  private renderTopics(snap: ViewSnapshot): void {
    this.$topics.innerHTML = '';
    if (snap.topics.length === 0) {
      this.$topics.innerHTML = `<div class="lex-empty">（话题本是空的）</div>`;
      return;
    }
    for (const vt of snap.topics) {
      const btn = document.createElement('button');
      btn.className = 'lex-topic' + (vt.selected ? ' selected' : '');
      btn.disabled = !vt.enabled;

      if (this.script.renderTopicLabel) {
        this.script.renderTopicLabel(vt.topic, btn);
      } else {
        btn.textContent = `「${vt.topic.label}」`;
      }

      btn.onclick = () => this.presenter.selectTopic(vt.topic.id);
      this.$topics.appendChild(btn);
    }
  }

  private renderNpcs(snap: ViewSnapshot): void {
    this.$npcs.innerHTML = '';
    for (const vn of snap.npcs) {
      const btn = document.createElement('button');
      btn.className = 'lex-npc';
      btn.disabled = !vn.enabled;

      const accent = this.script.getNpcAccent?.(vn.npc);
      if (accent) {
        btn.style.borderColor = accent;
        btn.style.setProperty('--lex-accent', accent);
      }

      const $avatar = document.createElement('div');
      $avatar.className = 'lex-npc-avatar';
      if (this.script.renderNpcAvatar) {
        this.script.renderNpcAvatar(vn.npc, $avatar);
      } else {
        $avatar.textContent = vn.npc.name.slice(0, 1);
      }

      const $name = document.createElement('div');
      $name.className = 'lex-npc-name';
      $name.textContent = vn.npc.name;
      if (accent) $name.style.color = accent;

      const $sub = document.createElement('div');
      $sub.className = 'lex-npc-sub';
      if (this.script.renderNpcSubtitle) {
        this.script.renderNpcSubtitle(vn.npc, $sub);
      }

      const $action = document.createElement('div');
      $action.className = 'lex-npc-action';
      $action.textContent = vn.actionLabel;

      btn.append($avatar, $name, $sub, $action);
      btn.onclick = () => this.presenter.clickNpc(vn.npc.id);
      this.$npcs.appendChild(btn);
    }
  }

  // ───────────────────────────────────────
  // 主对话区：消息气泡
  // ───────────────────────────────────────

  private appendMessage(msg: ViewMessage): void {
    const wrap = document.createElement('div');
    wrap.className = 'lex-msg ' + msg.kind;

    if (msg.kind === 'reply') {
      const accent = this.script.getNpcAccent?.(msg.npc);
      if (accent) wrap.style.borderLeftColor = accent;

      const $head = document.createElement('div');
      $head.className = 'lex-msg-head';
      if (accent) $head.style.color = accent;
      const topicLabel = msg.topic ? ` 关于「${msg.topic.label}」` : '';
      $head.textContent = `${msg.npc.name}${topicLabel}`;

      const $body = document.createElement('div');
      $body.className = 'lex-msg-body';
      if (this.script.renderDialogueText) {
        this.script.renderDialogueText(msg.text, $body);
      } else {
        $body.innerHTML = this.escapeHtml(msg.text).replace(/\n/g, '<br>');
      }

      wrap.append($head, $body);
    } else if (msg.kind === 'system') {
      wrap.innerHTML = this.escapeHtml(msg.text).replace(/\n/g, '<br>');
    } else if (msg.kind === 'flash') {
      wrap.textContent = msg.text;
    } else if (msg.kind === 'ending') {
      const $title = document.createElement('div');
      $title.className = 'lex-ending-title';
      $title.textContent = msg.ending.title ?? '结局';

      const $body = document.createElement('div');
      $body.className = 'lex-ending-body';
      if (this.script.renderEndingBody) {
        this.script.renderEndingBody(msg.ending, $body);
      } else {
        $body.innerHTML = this.escapeHtml(msg.ending.body).replace(/\n/g, '<br>');
      }

      const $foot = document.createElement('div');
      $foot.className = 'lex-ending-foot';
      $foot.textContent = this.script.texts.endingFooter ?? '点击 ← 返回菜单';

      wrap.append($title, $body, $foot);
    }

    this.$log.appendChild(wrap);
    this.$log.scrollTop = this.$log.scrollHeight;
  }

  // ───────────────────────────────────────
  // 右侧栏：探索记录（从消息流派生，引擎自带能力）
  // ───────────────────────────────────────

  private appendRecord(msg: ViewMessage): void {
    let line: string | null = null;
    if (msg.kind === 'reply') {
      const t = msg.topic ? `「${msg.topic.label}」` : '（接近）';
      line = `${msg.npc.name} · ${t}`;
    } else if (msg.kind === 'flash') {
      line = msg.text;
    } else if (msg.kind === 'ending') {
      line = `🏁 结局：${msg.ending.title ?? msg.ending.id}`;
    } else if (msg.kind === 'system') {
      // 系统级开场介绍不进 record，避免噪音；纯系统提示可加（这里跳过）
      return;
    }
    if (!line) return;
    const li = document.createElement('div');
    li.className = 'lex-record-line lex-record-' + msg.kind;
    li.textContent = `> ${line}`;
    this.$record.appendChild(li);
    this.$record.scrollTop = this.$record.scrollHeight;
  }

  // ───────────────────────────────────────
  // DOM
  // ───────────────────────────────────────

  private cacheRefs(): void {
    const q = (s: string) => this.root.querySelector(s) as HTMLElement;
    this.$hint   = q('[data-lex="hint"]');
    this.$log    = q('[data-lex="log"]');
    this.$topics = q('[data-lex="topics"]');
    this.$npcs   = q('[data-lex="npcs"]');
    this.$custom = q('[data-lex="custom"]');
    this.$record = q('[data-lex="record"]');
  }

  // ───────────────────────────────────────
  // 样式
  // ───────────────────────────────────────

  private injectBaseStyle(): void {
    if (document.getElementById(BASE_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = BASE_STYLE_ID;
    el.textContent = BASE_STYLE;
    document.head.appendChild(el);
  }

  private injectThemeStyle(): void {
    if (!this.script.themeCss) return;
    document.getElementById(THEME_STYLE_ID)?.remove();
    const el = document.createElement('style');
    el.id = THEME_STYLE_ID;
    el.textContent = this.script.themeCss;
    document.head.appendChild(el);
    this.themeStyleEl = el;
  }

  // ───────────────────────────────────────
  // 工具
  // ───────────────────────────────────────

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// ===== 模板 =====
// 二栏布局：左主区 = 对话面板 + 话题面板 + 自定义槽；右侧栏 = NPC 面板 + 探索记录面板
const TEMPLATE = `
<div class="lex-layout">
  <main class="lex-main-col">
    <section class="lex-panel lex-panel-dialogue">
      <div class="lex-panel-head">
        <span class="lex-panel-tag">DIALOGUE</span>
        <span class="lex-panel-hint">高亮关键词会自动入库</span>
      </div>
      <div class="lex-hint" data-lex="hint"></div>
      <div class="lex-log" data-lex="log"></div>
    </section>

    <section class="lex-panel lex-panel-topics">
      <div class="lex-panel-head">
        <span class="lex-panel-tag">TOPIC BOOK · 话题本</span>
        <span class="lex-panel-hint">点话题进入质问模式</span>
      </div>
      <div class="lex-topics" data-lex="topics"></div>
    </section>

    <div class="lex-custom" data-lex="custom"></div>
  </main>

  <aside class="lex-side-col">
    <section class="lex-panel lex-panel-record">
      <div class="lex-panel-head">
        <span class="lex-panel-tag">LOG · 探索记录</span>
      </div>
      <div class="lex-record" data-lex="record"></div>
    </section>

    <section class="lex-panel lex-panel-npcs">
      <div class="lex-panel-head">
        <span class="lex-panel-tag">NPC · 在场之人</span>
      </div>
      <div class="lex-npcs" data-lex="npcs"></div>
    </section>
  </aside>
</div>
`;

// ===== 默认样式（中性灰，剧本可用 themeCss 覆盖 CSS 变量） =====
const BASE_STYLE = `
.lex-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  height: 100%;
  font-family: "PingFang SC", "Microsoft YaHei", "Cascadia Code", sans-serif;
  font-size: 14px;
  color: var(--lex-fg, #d8d4c4);
}
.lex-main-col, .lex-side-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* —— 通用面板 —— */
.lex-panel {
  background: var(--lex-bg-2, #14161b);
  border: 1px solid var(--lex-line, #2a2f3a);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.lex-panel-head {
  background: var(--lex-bg-3, #1c1f27);
  border-bottom: 1px solid var(--lex-line, #2a2f3a);
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  letter-spacing: 1px;
}
.lex-panel-tag { color: var(--lex-accent, #f0b860); font-weight: bold; }
.lex-panel-hint { color: var(--lex-fg-dim, #6e7180); }

/* —— 对话面板（左主区上半 · 撑满）—— */
.lex-panel-dialogue { flex: 1; }

/* —— Hint 模式条 —— */
.lex-hint {
  background: var(--lex-bg-3, #1c1f27);
  border-bottom: 1px solid var(--lex-line, #2a2f3a);
  padding: 8px 14px;
  font-size: 12px;
  color: var(--lex-fg-dim, #6e7180);
  display: flex;
  align-items: center;
  gap: 8px;
}
.lex-hint.selected {
  background: var(--lex-accent-bg, rgba(240,184,96,0.08));
  color: var(--lex-fg, #d8d4c4);
  border-bottom-color: var(--lex-accent, #f0b860);
}
.lex-hint.ended {
  background: var(--lex-warn-bg, rgba(230,57,70,0.1));
  color: var(--lex-warn, #e63946);
  border-bottom-color: var(--lex-warn, #e63946);
}
.lex-hint-tag {
  background: var(--lex-line, #2a2f3a);
  color: var(--lex-accent, #f0b860);
  padding: 2px 8px;
  border-radius: 2px;
  font-weight: bold;
  letter-spacing: 1px;
}
.lex-hint.selected .lex-hint-tag {
  background: var(--lex-accent, #f0b860);
  color: var(--lex-bg, #0c0d10);
}
.lex-hint-tag.end {
  background: var(--lex-warn, #e63946);
  color: white;
}
.lex-cancel {
  background: transparent;
  border: 1px solid currentColor;
  color: currentColor;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  margin-left: auto;
}
.lex-cancel:hover {
  color: var(--lex-warn, #e63946);
  border-color: var(--lex-warn, #e63946);
}

/* —— 对话气泡区 —— */
.lex-log {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  line-height: 1.7;
}
.lex-msg {
  border-left: 3px solid var(--lex-line, #2a2f3a);
  padding: 10px 14px;
  background: var(--lex-bg-3, #1c1f27);
  border-radius: 0 4px 4px 0;
}
.lex-msg.system {
  border-left-color: var(--lex-accent, #f0b860);
  background: var(--lex-accent-bg, rgba(240,184,96,0.05));
  color: var(--lex-accent, #f0b860);
  font-style: italic;
}
.lex-msg.flash {
  border-left-color: var(--lex-accent, #f0b860);
  background: var(--lex-accent-bg, rgba(240,184,96,0.12));
  color: var(--lex-accent, #f0b860);
  font-weight: bold;
  animation: lexFlash 0.4s ease-out;
}
@keyframes lexFlash {
  0% { transform: scale(1.02); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}
.lex-msg-head { font-size: 12px; font-weight: bold; margin-bottom: 6px; }
.lex-msg-body { color: var(--lex-fg, #d8d4c4); }

.lex-msg.ending {
  background: var(--lex-bg, #0c0d10);
  border-left: 5px solid var(--lex-good, #fcbf49);
  padding: 16px 20px;
  margin-top: 16px;
}
.lex-ending-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--lex-good, #fcbf49);
  margin-bottom: 10px;
}
.lex-ending-foot {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--lex-line, #2a2f3a);
  color: var(--lex-fg-dim, #6e7180);
  font-size: 12px;
}

/* —— 话题面板（左主区中部）—— */
.lex-panel-topics {
  flex: 0 0 auto;
  max-height: 200px;
}
.lex-topics {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-y: auto;
  align-content: flex-start;
}
.lex-empty {
  color: var(--lex-fg-dim, #6e7180);
  font-size: 12px;
  font-style: italic;
  padding: 12px;
  width: 100%;
  text-align: center;
}
.lex-topic {
  background: var(--lex-bg, #0c0d10);
  border: 1px solid var(--lex-accent, #f0b860);
  color: var(--lex-accent, #f0b860);
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  transition: all 0.15s;
}
.lex-topic:hover:not(:disabled) { transform: translateY(-1px); }
.lex-topic.selected {
  background: var(--lex-accent, #f0b860);
  color: var(--lex-bg, #0c0d10);
  box-shadow: 0 0 12px var(--lex-accent, #f0b860);
}
.lex-topic:disabled { opacity: 0.4; cursor: not-allowed; }

/* —— 自定义槽（如指控面板）—— */
.lex-custom:empty { display: none; }
.lex-custom { flex: 0 0 auto; }

/* —— 右侧探索记录面板（在上，可伸缩占据剩余空间）—— */
.lex-panel-record { flex: 1; min-height: 0; }
.lex-record {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--lex-fg-dim, #6e7180);
  line-height: 1.6;
  font-family: "Cascadia Code", "JetBrains Mono", "Consolas", monospace;
}
.lex-record-line { padding: 1px 0; }
.lex-record-flash { color: var(--lex-accent, #f0b860); }
.lex-record-ending { color: var(--lex-good, #fcbf49); font-weight: bold; }

/* —— 右侧 NPC 面板（在下，紧邻话题区）—— */
.lex-panel-npcs { flex: 0 0 auto; }
.lex-npcs {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lex-npc {
  background: var(--lex-bg, #0c0d10);
  border: 1px solid var(--lex-line, #2a2f3a);
  border-radius: 4px;
  padding: 10px 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  display: grid;
  grid-template-columns: 28px 1fr;
  grid-template-rows: auto auto auto;
  gap: 0 10px;
  transition: all 0.15s;
}
.lex-npc:hover:not(:disabled) {
  background: var(--lex-bg-3, #1c1f27);
  transform: translateX(2px);
}
.lex-npc:disabled { opacity: 0.5; cursor: not-allowed; }
.lex-npc-avatar {
  grid-row: 1/4;
  font-size: 20px;
  align-self: center;
  text-align: center;
}
.lex-npc-name { font-weight: bold; font-size: 14px; color: var(--lex-fg, #d8d4c4); }
.lex-npc-sub { color: var(--lex-fg-dim, #6e7180); font-size: 11px; }
.lex-npc-sub:empty { display: none; }
.lex-npc-action { color: var(--lex-accent, #f0b860); font-size: 11px; }

/* —— 滚动条 —— */
.lex-log::-webkit-scrollbar,
.lex-record::-webkit-scrollbar,
.lex-topics::-webkit-scrollbar,
.lex-npcs::-webkit-scrollbar { width: 6px; height: 6px; }
.lex-log::-webkit-scrollbar-track,
.lex-record::-webkit-scrollbar-track,
.lex-topics::-webkit-scrollbar-track,
.lex-npcs::-webkit-scrollbar-track { background: transparent; }
.lex-log::-webkit-scrollbar-thumb,
.lex-record::-webkit-scrollbar-thumb,
.lex-topics::-webkit-scrollbar-thumb,
.lex-npcs::-webkit-scrollbar-thumb {
  background: var(--lex-line, #2a2f3a);
  border-radius: 3px;
}
`;
