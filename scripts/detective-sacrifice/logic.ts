import { Script } from '../../base/script-base';
import { WorldState, NPCBase, EndingBase } from '../../base/types';
import { Presenter } from '../../base/presenter';
import { NPCS, TOPICS, DIALOGUES, ENDINGS, INITIAL_TOPICS, TEXTS, SacrificeNPC } from './data';
import { THEME_CSS } from './theme';

export class SacrificeScript extends Script {
  id = 'detective-sacrifice';
  meta = {
    title: '名侦探的献祭',
    subtitle: '在谎言与真相的边界，见证最后的正义。',
    author: 'Lexicon AI',
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
  // 视图钩子
  // ─────────────────────────────

  getNpcAccent(npc: NPCBase): string | undefined {
    return (npc as SacrificeNPC).color;
  }

  renderNpcAvatar(npc: NPCBase, target: HTMLElement): void {
    target.textContent = (npc as SacrificeNPC).emoji;
  }

  renderNpcSubtitle(npc: NPCBase, target: HTMLElement): void {
    target.textContent = (npc as SacrificeNPC).role;
  }

  renderDialogueText(text: string, target: HTMLElement): void {
    target.innerHTML = this.highlightKeywords(text);
  }

  renderEndingBody(ending: EndingBase, target: HTMLElement): void {
    target.innerHTML = this.escapeHtml(ending.body).replace(/\n/g, '<br>');
  }

  /**
   * 当 world.custom.canEnding 为 true 时显示最终抉择面板。
   */
  renderCustomSlot(customSlot: HTMLElement, presenter: Presenter): void {
    const world = presenter.getWorld();
    const canEnding = world.custom.canEnding;
    const ended = presenter.getSnapshot().ended;
    if (!canEnding || ended) return;

    const panel = document.createElement('div');
    panel.className = 'sac-accuse-panel';
    panel.innerHTML = `
      <div class="sac-accuse-title">${this.texts.accusePanelHint ?? '最终抉择'}</div>
      <div class="sac-accuse-buttons"></div>
    `;
    const $btns = panel.querySelector('.sac-accuse-buttons') as HTMLElement;

    const choices = [
      { id: 'sacrifice', label: '维持现状，献祭真相 (救下九百人)', color: '#d4af37' },
      { id: 'reveal',    label: '揭穿奇迹，揭露真实 (可能引发惨剧)', color: '#ff4444' },
      { id: 'join',      label: '放弃思考，加入奇迹', color: '#aaaaaa' },
    ];

    for (const c of choices) {
      const b = document.createElement('button');
      b.className = 'sac-accuse-btn';
      b.style.borderColor = c.color;
      b.style.color = c.color;
      b.textContent = `${this.texts.accusePrefix ?? ''}${c.label}`;
      b.onclick = () => {
        presenter.setCustom('final_choice', c.id);
      };
      $btns.appendChild(b);
    }
    customSlot.appendChild(panel);
  }

  // ─────────────────────────────
  // 内部工具
  // ─────────────────────────────

  private highlightKeywords(text: string): string {
    let html = this.escapeHtml(text);
    // 匹配 【XXX】
    html = html.replace(/【(.*?)】/g, (match, p1) => {
      const topic = this.topics.find(t => t.label === p1);
      if (topic) {
        return `<span class="sac-kw">${p1}</span>`;
      }
      return match;
    });
    return html.replace(/\n/g, '<br>');
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
