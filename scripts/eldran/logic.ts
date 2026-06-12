// ==========================================================================
// scripts/eldran/logic.ts —— 艾尔德兰之夜 · 剧本类
//
// 职责：
//   - 实现 Script 抽象类（提供数据 + texts）
//   - 实现视图钩子（让默认 UI 知道怎么渲染本剧本特色）
//   - 提供剧本特有的"非对话型动作"：accuse(npcId)
//   - 自定义关键词高亮
//
// 不再有 mount/unmount/UI 类！默认 UI 接管渲染。
// ==========================================================================

import { Script } from '../../base/script-base';
import { WorldState, NPCBase, TopicBase, EndingBase } from '../../base/types';
import { Presenter } from '../../base/presenter';
import { NPCS, TOPICS, DIALOGUES, ENDINGS, INITIAL_TOPICS, TEXTS, EldranNPC } from './data';
import { THEME_CSS } from './theme';

export class EldranScript extends Script {
  id = 'eldran-night';
  meta = {
    title: '艾尔德兰之夜',
    subtitle: 'Eldran Night —— 推理 / 对话 / 多结局',
    author: 'Lexicon Demo',
  };

  npcs = NPCS;
  topics = TOPICS;
  dialogues = DIALOGUES;
  endings = ENDINGS;
  texts = TEXTS;
  themeCss = THEME_CSS;

  init(world: WorldState): void {
    for (const t of INITIAL_TOPICS) world.topics.add(t);
  }

  // ─────────────────────────────
  // 视图钩子（让默认 UI 知道怎么渲染本剧本特色）
  // ─────────────────────────────

  getNpcAccent(npc: NPCBase): string | undefined {
    return (npc as EldranNPC).color;
  }

  renderNpcAvatar(npc: NPCBase, target: HTMLElement): void {
    target.textContent = (npc as EldranNPC).sigil;
  }

  renderNpcSubtitle(npc: NPCBase, target: HTMLElement): void {
    target.textContent = (npc as EldranNPC).subtitle;
  }

  renderDialogueText(text: string, target: HTMLElement): void {
    target.innerHTML = this.highlightKeywords(text);
  }

  renderEndingBody(ending: EndingBase, target: HTMLElement): void {
    target.innerHTML = this.escapeHtml(ending.body).replace(/\n/g, '<br>');
  }

  /**
   * 自定义槽：当 world.custom.canAccuse 为 true 时显示指控面板。
   * 引擎每次状态变化都会调用本钩子，所以我们要幂等地决定渲染什么。
   */
  renderCustomSlot(customSlot: HTMLElement, presenter: Presenter): void {
    const canAccuse = presenter.getWorld().custom.canAccuse;
    const ended = presenter.getSnapshot().ended;
    if (!canAccuse || ended) return;

    const panel = document.createElement('div');
    panel.className = 'eld-accuse-panel';
    panel.innerHTML = `
      <div class="eld-accuse-title">${this.texts.accusePanelHint ?? '指控环节'}</div>
      <div class="eld-accuse-buttons"></div>
    `;
    const $btns = panel.querySelector('.eld-accuse-buttons') as HTMLElement;
    for (const npc of this.npcs as EldranNPC[]) {
      const b = document.createElement('button');
      b.className = 'eld-accuse-btn';
      b.style.borderColor = npc.color;
      b.style.color = npc.color;
      b.textContent = `${this.texts.accusePrefix ?? '指控'} ${npc.sigil} ${npc.name}`;
      b.onclick = () => this.accuse(presenter, npc.id);
      $btns.appendChild(b);
    }
    customSlot.appendChild(panel);
  }

  // ─────────────────────────────
  // 剧本特有的"非对话型动作"
  // ─────────────────────────────

  /** 指控某 NPC：触发对应 ending */
  accuse(presenter: Presenter, npcId: string): void {
    presenter.setCustom('accused', npcId);
  }

  // ─────────────────────────────
  // 内部工具
  // ─────────────────────────────

  /** 把 【话题label】 包装成高亮 span */
  private highlightKeywords(text: string): string {
    let html = this.escapeHtml(text);
    for (const t of this.topics) {
      const re = new RegExp(`【${this.escapeRe(t.label)}】`, 'g');
      html = html.replace(re, `<span class="eld-kw">${t.label}</span>`);
    }
    return html.replace(/\n/g, '<br>');
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  private escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
