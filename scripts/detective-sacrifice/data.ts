import { has, addTopic, all, setState, stateEq } from '../../base/helpers';
import { NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts } from '../../base/types';

// ───────────────────────────────────────────
// 剧本扩展类型
// ───────────────────────────────────────────

export interface SacrificeNPC extends NPCBase {
  color: string;
  emoji: string;
  role: string;
}

// ───────────────────────────────────────────
// 文本常量
// ───────────────────────────────────────────

export const TEXTS: ScriptTexts = {
  introHint:      '你站在乔丹镇的入口。丛林的湿气与焚香的味道交织。\n\n[ 提示 ] 点选「乔丹镇」向大埘询问，开始调查。',
  hintIdle:       '在话题本中选一个话题，然后点 NPC 进行质问',
  hintSelected:   '已选 「{topic}」 —— 点 NPC 质问',
  hintEnded:      '已结束 · 点 ← 返回菜单 重玩',
  cancelLabel:    '取消',
  silentReply:    '{npc} 只是注视着你，对「{topic}」没有任何回应。',
  newTopicsFlash: '✨ 发现新线索：{topics}',
  endingFooter:   '点击 ← 返回菜单 重新开始',

  accusePanelHint: '⚠ 所有的碎片都已凑齐 —— 做出你的抉择',
  accusePrefix:    '抉择：',
};

// ───────────────────────────────────────────
// NPC
// ───────────────────────────────────────────

export const NPCS: SacrificeNPC[] = [
  { id: 'daimon',   name: '大埘',     role: '名侦探',   color: '#7ec8ff', emoji: '🕵️‍♂️' },
  { id: 'ririko',   name: '凛凛子',   role: '助手',     color: '#ffb3d9', emoji: '👩‍🔬' },
  { id: 'jim',      name: '吉姆·乔丹', role: '教主',     color: '#ffd700', emoji: '👑' },
  { id: 'believer', name: '信徒',     role: '乔丹镇居民', color: '#aaaaaa', emoji: '🙏' },
  { id: 'guard',    name: '守卫',     role: '治安维持者', color: '#ff4444', emoji: '🛡️' },
];

// ───────────────────────────────────────────
// Topics
// ───────────────────────────────────────────

export const TOPICS: TopicBase[] = [
  { id: 'jordan_town',    label: '乔丹镇' },
  { id: 'missing_ririko', label: '失踪的凛凛子' },
  { id: 'miracle',        label: '奇迹' },
  { id: 'healing',        label: '治愈' },
  { id: 'resurrection',   label: '复活' },
  { id: 'locked_room',    label: '密室' },
  { id: 'trick',          label: '诡计' },
  { id: 'sacrifice',      label: '献祭' },
  { id: 'truth',          label: '真相' },
  { id: 'suicide',        label: '集体自杀' },
];

// ───────────────────────────────────────────
// Dialogues
// ───────────────────────────────────────────

export const DIALOGUES: DialogueBase[] = [
  // --- 初始探索 ---
  {
    id: 'daimon.jordan_town',
    speaker: 'daimon', topic: 'jordan_town',
    text: '大埘压低了帽檐：“这里就是传闻中的乔丹镇。我们要找的【失踪的凛凛子】最后出现的地点就在这里。”',
    effect: addTopic('missing_ririko'),
  },
  {
    id: 'believer.jordan_town',
    speaker: 'believer', topic: 'jordan_town',
    text: '信徒张开双臂，神情陶醉：“这里是乐园，是病痛与伤感都不存在的【奇迹】之城。”',
    effect: addTopic('miracle'),
  },
  {
    id: 'jim.miracle',
    speaker: 'jim', topic: 'miracle',
    text: '吉姆·乔丹微笑着说：“侦探先生，在主的光辉下，【治愈】伤口甚至是【复活】死者都并非难事。”',
    effect: all(addTopic('healing'), addTopic('resurrection')),
  },

  // --- 发现凛凛子 ---
  {
    id: 'ririko.missing_ririko',
    speaker: 'ririko', topic: 'missing_ririko',
    text: '你在偏僻的礼拜堂找到了她。凛凛子眼神闪烁：“大埘老师，快离开这里...他们正在筹备一场可怕的【献祭】。”',
    effect: addTopic('sacrifice'),
  },

  // --- 案件发生 ---
  {
    id: 'guard.healing',
    speaker: 'guard', topic: 'healing',
    text: '守卫冷冷地展示着手臂上的伤疤瞬间愈合：“看见了吗？这就是这里的法则。如果不服从，你将见识到真正的【密室】谋杀。”',
    effect: addTopic('locked_room'),
  },
  {
    id: 'daimon.locked_room',
    speaker: 'daimon', topic: 'locked_room',
    text: '“一具无血的尸体，在完全封闭的圣坛。这绝不是神迹，而是一个拙劣的【诡计】。”',
    effect: addTopic('trick'),
  },

  // --- 推理过程 ---
  {
    id: 'daimon.trick',
    speaker: 'daimon', topic: 'trick',
    text: '大埘在现场仔细检查后抬起头：“原来如此。所谓的奇迹，不过是利用信徒的认知偏差。而杀人的【真相】，就隐藏在教义的背面。”',
    effect: addTopic('truth'),
  },
  {
    id: 'jim.truth',
    speaker: 'jim', topic: 'truth',
    text: '教主的脸色变得阴沉：“侦探，如果你打算揭穿我，那么这里九百名信徒将会跟随我一起完成最后的【集体自杀】。”',
    effect: all(addTopic('suicide'), setState('canEnding', true)),
  },

  // --- 终局抉择 ---
  {
    id: 'daimon.sacrifice',
    speaker: 'daimon', topic: 'sacrifice',
    text: '“为了救这九百人，我必须放弃名侦探的尊严吗？这就是所谓的【献祭】...”',
    effect: setState('choice', 'thinking'),
  },
];

// ───────────────────────────────────────────
// Endings
// ───────────────────────────────────────────

export const ENDINGS: EndingBase[] = [
  {
    id: 'true_end',
    title: '🕊️ 伟大的献祭',
    body: '大埘公开承认了“奇迹”的真实性，并故意指控了一个错误的嫌疑人。\n真相被永远埋葬，九百名信徒免于自杀的命运。\n侦探失去了他的荣誉，但乔丹镇迎来了一个虚伪却和平的明天。',
    condition: stateEq('final_choice', 'sacrifice'),
  },
  {
    id: 'bad_end',
    title: '🔥 血色的真实',
    body: '真相被公之于众，虚假的奇迹瞬间崩塌。\n教主触发了集体的毁灭开关，乔丹镇变成了一片血海。\n你得到了真相，却失去了一切。',
    condition: stateEq('final_choice', 'reveal'),
  },
  {
    id: 'fail_end',
    title: '🌑 沦陷的奇迹',
    body: '你未能看穿诡计，也未能找到真相。\n随着时间的流逝，你的理智逐渐被教义蚕食，最终成为了这片乐园中又一个盲目的祈祷者。',
    condition: stateEq('final_choice', 'join'),
  },
];

export const INITIAL_TOPICS = ['jordan_town'];
