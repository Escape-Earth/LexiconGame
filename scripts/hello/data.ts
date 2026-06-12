// ==========================================================================
// scripts/hello/data.ts —— Hello, Lexicon! · 数据
// ==========================================================================

import { has, all, addTopic, setState } from '../../base/helpers';
import { NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts } from '../../base/types';

// ───────────────────────────────────────────
// 自定义字段
// ───────────────────────────────────────────

export interface HelloNPC extends NPCBase {
  emoji: string;
  role: string;
}

// ───────────────────────────────────────────
// 文本常量
// ───────────────────────────────────────────

export const TEXTS: ScriptTexts = {
  introHint:      '☕ 欢迎来到 Lexicon Café，今天是你上班的第一天！',
  hintIdle:       '👇 先选一个话题，然后点 NPC',
  hintSelected:   '已选 「{topic}」 · 点 NPC 进行对话',
  hintEnded:      '🎉 今天的工作完成啦！点 ← 返回菜单',
  cancelLabel:    '取消',
  silentReply:    '{npc} 困惑地看着你，似乎对「{topic}」没什么可说的。',
  newTopicsFlash: '✨ 新话题：{topics}',
  endingFooter:   '点 ← 返回菜单 重新开始',
};

// ───────────────────────────────────────────
// NPC
// ───────────────────────────────────────────

export const NPCS: HelloNPC[] = [
  { id: 'boss',     name: '店长',  role: '老板',   emoji: '👨‍🍳' },
  { id: 'customer', name: '客人',  role: '路人',   emoji: '🧑' },
];

// ───────────────────────────────────────────
// Topics
// ───────────────────────────────────────────

export const TOPICS: TopicBase[] = [
  { id: 'greet_boss', label: '向店长报到' },
  { id: 'menu',       label: '菜单' },
  { id: 'order',      label: '点单' },
  { id: 'coffee',     label: '咖啡' },
];

// ───────────────────────────────────────────
// Dialogues
// ───────────────────────────────────────────

export const DIALOGUES: DialogueBase[] = [
  {
    id: 'boss.greet', speaker: 'boss', topic: 'greet_boss',
    text: '👨‍🍳「新来的？欢迎来到 Lexicon Café。先看看【菜单】，再去问问客人要什么。」',
    effect: addTopic('menu'),
  },
  {
    id: 'boss.menu', speaker: 'boss', topic: 'menu',
    text: '👨‍🍳「我们这里就一种饮料 —— 咖啡。简单粗暴。\n现在去问客人她要什么【点单】吧。」',
    effect: addTopic('order'),
  },
  {
    id: 'customer.order', speaker: 'customer', topic: 'order',
    text: '🧑「啊...给我来杯【咖啡】吧。要热的。」',
    effect: addTopic('coffee'),
  },
  {
    id: 'customer.coffee', speaker: 'customer', topic: 'coffee',
    text: '🧑「噢！这就是我要的咖啡！谢谢！」\n（客人露出满意的笑容）',
    trigger: has('coffee'),
    effect: setState('served', true),
  },
  {
    id: 'boss.coffee', speaker: 'boss', topic: 'coffee',
    text: '👨‍🍳「我不喝自己店里的咖啡。给客人去。」',
    trigger: has('coffee'),
    once: false,
  },
];

// ───────────────────────────────────────────
// Endings
// ───────────────────────────────────────────

export const ENDINGS: EndingBase[] = [
  {
    id: 'happy_ending',
    title: '☕ 第一杯咖啡',
    body: `客人捧着热咖啡走出店门，留下 5 颗星好评。
店长拍拍你的肩：「不错。明天继续。」

—— 完美结局：你成功完成了第一天的工作。`,
    condition: w => w.custom.served === true,
  },
];

// ───────────────────────────────────────────
// 初始话题
// ───────────────────────────────────────────

export const INITIAL_TOPICS: string[] = [
  'greet_boss',
];
