// ==========================================================================
// base/default-view.ts —— 默认 UI（所有剧本共用）
//
// 这是一个 vanilla DOM 渲染层，订阅 Presenter 的 onChange / onMessage。
// 它不知道 Engine。只跟 Presenter + Script.viewHooks 对话。
//
// 剧本通过 useDefaultView=true（默认）使用本视图。
// 剧本可通过实现 ScriptViewHooks 中的钩子定制渲染（颜色、头像、文本高亮）。
// 剧本可通过 themeCss 注入额外样式做主题覆盖。
// ==========================================================================

import { Script } from './script-base';
import { Presenter, ViewSnapshot, ViewMessage } from './presenter';
import { NPCBase, TopicBase, EndingBase } from './types';

const BASE_STYLE_ID = 'lex-base-style';
const THEME_STYLE_ID = 'lex-theme-style';

export class DefaultView {
  private root: HTMLElement;

  // —— DOM 节点 —— //
  private $stage!: HTMLElement;
  private $hint!: HTMLElement;
  private $log!: HTMLElement;
  private $topics!: HTMLElement;
  private $npcs!: HTMLElement;
  private $custom!: HTMLElement;

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
    this.offMessage = this.presenter.onMessage(msg => this.appendMessage(msg));
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
      this.$hint.innerHTML = `${this.escapeHtml(snap.hint.text)} <button class="lex-cancel" data-act="cancel">${t}</button>`;
      const btn = this.$hint.querySelector('[data-act="cancel"]') as HTMLButtonElement;
      btn.onclick = () => this.presenter.cancelSelection();
    } else {
      this.$hint.textContent = snap.hint.text;
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

      // 调用剧本钩子（如果提供）
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

      // —— 头像 —— //
      const $avatar = document.createElement('div');
      $avatar.className = 'lex-npc-avatar';
      if (this.script.renderNpcAvatar) {
        this.script.renderNpcAvatar(vn.npc, $avatar);
      } else {
        $avatar.textContent = vn.npc.name.slice(0, 1);
      }

      // —— 名字 —— //
      const $name = document.createElement('div');
      $name.className = 'lex-npc-name';
      $name.textContent = vn.npc.name;
      if (accent) $name.style.color = accent;

      // —— 副标题（剧本可选）—— //
      const $sub = document.createElement('div');
      $sub.className = 'lex-npc-sub';
      if (this.script.renderNpcSubtitle) {
        this.script.renderNpcSubtitle(vn.npc, $sub);
      }

      // —— 操作提示 —— //
      const $action = document.createElement('div');
      $action.className = 'lex-npc-action';
      $action.textContent = vn.actionLabel;

      btn.append($avatar, $name, $sub, $action);
      btn.onclick = () => this.presenter.clickNpc(vn.npc.id);
      this.$npcs.appendChild(btn);
    }
  }

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
  // DOM
  // ───────────────────────────────────────

  private cacheRefs(): void {
    const q = (s: string) => this.root.querySelector(s) as HTMLElement;
    this.$stage  = q('[data-lex="stage"]');
    this.$hint   = q('[data-lex="hint"]');
    this.$log    = q('[data-lex="log"]');
    this.$topics = q('[data-lex="topics"]');
    this.$npcs   = q('[data-lex="npcs"]');
    this.$custom = q('[data-lex="custom"]');
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
const TEMPLATE = `
<div class="lex-stage" data-lex="stage">
  <div class="lex-top">
    <div class="lex-hint" data-lex="hint"></div>
  </div>
  <div class="lex-log" data-lex="log"></div>
  <div class="lex-bottom">
    <div class="lex-section">
      <div class="lex-section-title">📒 话题</div>
      <div class="lex-topics" data-lex="topics"></div>
    </div>
    <div class="lex-section">
      <div class="lex-section-title">👥 NPC</div>
      <div class="lex-npcs" data-lex="npcs"></div>
    </div>
  </div>
  <div class="lex-custom" data-lex="custom"></div>
</div>
`;

// ===== 默认样式（中性灰，剧本可用 themeCss 覆盖） =====
const BASE_STYLE = `
.lex-stage {
  display: flex; flex-direction: column;
  height: 100%;
  font-family: "PingFang SC", "Microsoft YaHei", "Cascadia Code", sans-serif;
  font-size: 14px;
  color: var(--lex-fg, #d8d4c4);
  background: var(--lex-bg, #14161b);
  border-radius: 8px;
  padding: 14px 18px;
  gap: 12px;
}
.lex-top {
  border-bottom: 1px solid var(--lex-line, #2a2f3a);
  padding-bottom: 10px;
}
.lex-hint {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--lex-bg-2, #1c1f27);
  color: var(--lex-fg-dim, #6e7180);
  font-size: 13px;
  display: flex; align-items: center; gap: 8px;
  transition: all 0.2s;
}
.lex-hint.selected {
  background: var(--lex-accent-bg, rgba(240,184,96,0.12));
  color: var(--lex-fg, #d8d4c4);
  border: 1px solid var(--lex-accent, #f0b860);
}
.lex-hint.ended {
  background: var(--lex-warn-bg, rgba(230,57,70,0.1));
  color: var(--lex-warn, #e63946);
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
.lex-log {
  flex: 1;
  overflow-y: auto;
  display: flex; flex-direction: column;
  gap: 10px;
  padding: 4px 2px;
  line-height: 1.7;
}
.lex-msg {
  padding: 10px 14px;
  border-radius: 6px;
  background: var(--lex-bg-2, #1c1f27);
  border-left: 3px solid var(--lex-line, #2a2f3a);
}
.lex-msg.system {
  background: transparent;
  color: var(--lex-fg-dim, #6e7180);
  font-style: italic;
  border-left: none;
  text-align: center;
  font-size: 13px;
}
.lex-msg.flash {
  background: var(--lex-accent-bg, rgba(240,184,96,0.12));
  color: var(--lex-accent, #f0b860);
  border-left-color: var(--lex-accent, #f0b860);
  font-weight: bold;
  text-align: center;
  animation: lexFlash 0.4s ease-out;
}
@keyframes lexFlash { 0% { transform: scale(1.05); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
.lex-msg.ending {
  background: var(--lex-bg, #0c0d10);
  border: 1px solid var(--lex-good, #fcbf49);
  border-left-width: 5px;
  padding: 16px 20px;
  margin-top: 16px;
}
.lex-msg-head {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 6px;
}
.lex-ending-title {
  font-size: 18px; font-weight: bold;
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

.lex-bottom {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 14px;
}
.lex-section {
  background: var(--lex-bg-2, #1c1f27);
  border: 1px solid var(--lex-line, #2a2f3a);
  border-radius: 6px;
  padding: 10px 12px;
}
.lex-section-title {
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--lex-fg-dim, #6e7180);
  margin-bottom: 8px;
  font-weight: bold;
}
.lex-topics { display: flex; flex-wrap: wrap; gap: 8px; min-height: 36px; }
.lex-empty { color: var(--lex-fg-dim, #6e7180); font-size: 12px; font-style: italic; }
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

.lex-npcs { display: flex; flex-direction: column; gap: 8px; }
.lex-npc {
  background: var(--lex-bg, #0c0d10);
  border: 1px solid var(--lex-line, #2a2f3a);
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  display: grid;
  grid-template-columns: 32px 1fr;
  grid-template-rows: auto auto auto;
  gap: 0 10px;
  transition: all 0.15s;
}
.lex-npc:hover:not(:disabled) { transform: translateX(2px); background: var(--lex-bg-2, #1c1f27); }
.lex-npc:disabled { opacity: 0.5; cursor: not-allowed; }
.lex-npc-avatar { grid-row: 1/4; font-size: 22px; align-self: center; text-align: center; }
.lex-npc-name { font-weight: bold; font-size: 14px; color: var(--lex-fg, #d8d4c4); }
.lex-npc-sub { color: var(--lex-fg-dim, #6e7180); font-size: 11px; }
.lex-npc-sub:empty { display: none; }
.lex-npc-action { color: var(--lex-accent, #f0b860); font-size: 11px; }

.lex-custom:empty { display: none; }
`;
