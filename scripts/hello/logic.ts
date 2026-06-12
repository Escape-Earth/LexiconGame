// ==========================================================================
// scripts/hello/logic.ts —— Hello, Lexicon! 剧本类
//
// 极简范例：除了 init + 几个视图钩子，没有任何"剧本逻辑代码"。
// ==========================================================================

import { Script } from '../../base/script-base';
import { WorldState, NPCBase } from '../../base/types';
import { NPCS, TOPICS, DIALOGUES, ENDINGS, INITIAL_TOPICS, TEXTS, HelloNPC } from './data';
import { THEME_CSS } from './theme';

export class HelloScript extends Script {
  id = 'hello-lexicon';
  meta = {
    title: 'Hello, Lexicon!',
    subtitle: '☕ 咖啡店的第一天 —— 最简示例剧本',
    author: 'Lexicon Tutorial',
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

  // —— 视图钩子（让默认 UI 渲染 emoji 头像 + 角色副标题）—— //

  renderNpcAvatar(npc: NPCBase, target: HTMLElement): void {
    target.textContent = (npc as HelloNPC).emoji;
  }

  renderNpcSubtitle(npc: NPCBase, target: HTMLElement): void {
    target.textContent = (npc as HelloNPC).role;
  }
}
