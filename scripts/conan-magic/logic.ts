import { Script } from '../../base/script-base';
import { WorldState, NPCBase, EndingBase } from '../../base/types';
import { Presenter } from '../../base/presenter';
import { NPCS, TOPICS, DIALOGUES, ENDINGS, INITIAL_TOPICS, TEXTS, ConanNPC } from './data';
import { THEME_CSS } from './theme';

export class ConanScript extends Script {
  id = 'conan-magic';
  meta = {
    title: '柯南：魔术爱好者杀人事件',
    subtitle: '名侦探的推理 —— 真相只有一个',
    author: 'Lexicon Auto-Gen',
  };

  npcs = NPCS;
  topics = TOPICS;
  dialogues = DIALOGUES;
  endings = ENDINGS;
  texts = TEXTS;
  themeCss = THEME_CSS;

  private lastVisits = 0;
  private lastScore = 0;

  init(world: WorldState): void {
    for (const t of INITIAL_TOPICS) world.topics.add(t);
  }

  getNpcAccent(npc: NPCBase): string | undefined {
    return (npc as ConanNPC).color;
  }

  renderNpcAvatar(npc: NPCBase, target: HTMLElement): void {
    target.textContent = (npc as ConanNPC).emoji;
  }

  renderNpcSubtitle(npc: NPCBase, target: HTMLElement): void {
    target.textContent = (npc as ConanNPC).role;
  }

  renderDialogueText(text: string, target: HTMLElement): void {
    target.innerHTML = this.highlightKeywords(text);
  }

  renderEndingBody(ending: EndingBase, target: HTMLElement): void {
    let text = ending.body;
    text = text.replace('{VISITS}', this.lastVisits.toString());
    text = text.replace('{SCORE}', this.lastScore.toString());
    target.innerHTML = this.escapeHtml(text).replace(/\n/g, '<br>');
  }

  renderCustomSlot(customSlot: HTMLElement, presenter: Presenter): void {
    const ended = presenter.getSnapshot().ended;
    // We only show accuse buttons if there is a dead body (murder happened) and not ended yet
    if (ended || !presenter.getWorld().topics.has('dead_body')) return;

    const panel = document.createElement('div');
    panel.className = 'conan-accuse-panel';
    panel.innerHTML = `
      <div class="conan-accuse-title">${(this.texts as any).accusePanelHint ?? '指控环节'}</div>
      <div class="conan-accuse-buttons"></div>
    `;
    const $btns = panel.querySelector('.conan-accuse-buttons') as HTMLElement;
    
    // Only allow accusing the real suspects (exclude conan and dead hamano)
    const suspects = this.npcs.filter(n => n.id === 'tanaka' || n.id === 'doito');
    
    for (const npc of suspects as ConanNPC[]) {
      const b = document.createElement('button');
      b.className = 'conan-accuse-btn';
      b.style.borderColor = npc.color;
      b.style.color = npc.color;
      b.textContent = `${(this.texts as any).accusePrefix ?? '指控'} ${npc.emoji} ${npc.name}`;
      b.onclick = () => this.accuse(presenter, npc.id);
      $btns.appendChild(b);
    }
    customSlot.appendChild(panel);
  }

  accuse(presenter: Presenter, npcId: string): void {
    const world = presenter.getWorld();
    this.lastVisits = world.visited.size;
    this.lastScore = Math.max(0, 100 - this.lastVisits * 5);
    presenter.setCustom('accused', npcId);
  }

  private highlightKeywords(text: string): string {
    let html = this.escapeHtml(text);
    for (const t of this.topics) {
      const re = new RegExp(`【${this.escapeRe(t.label)}】`, 'g');
      html = html.replace(re, `<span class="conan-kw">${t.label}</span>`);
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
