// ==========================================================================
// scripts/eldran/data.ts —— 艾尔德兰之夜 · 数据
//
// 职责：
//   - 定义 NPC、Topic、Dialogue、Ending 数组
//   - 定义所有 UI 文本（texts 常量）
//   - 闭包写在 data 里：trigger / effect 都是 (w) => ...
//   - 不导入 Engine、不操作 DOM
// ==========================================================================

import { has, all, addTopic, setState } from '../../base/helpers';
import { NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts } from '../../base/types';

// ───────────────────────────────────────────
// 剧本扩展类型（自定义字段）
// ───────────────────────────────────────────

export interface EldranNPC extends NPCBase {
  color: string;
  sigil: string;
  subtitle: string;
}

// ───────────────────────────────────────────
// 文本常量（所有 UI 文案统一放这里）
// ───────────────────────────────────────────

export const TEXTS: ScriptTexts = {
  introHint:      '你睁开眼，烛光摇曳。三个身影站在床边 ——\n[ 提示 ] 在话题本中点选「与XX搭话」开始你的探索。',
  hintIdle:       '在话题本中选一个话题，然后点 NPC 进行质问',
  hintSelected:   '已选 「{topic}」 —— 点 NPC 质问',
  hintEnded:      '已结束 · 点 ← 返回菜单 重玩',
  cancelLabel:    '取消',
  silentReply:    '{npc} 沉默了一会，似乎对「{topic}」一无所知。',
  newTopicsFlash: '✨ 新话题入库：{topics}',
  endingFooter:   '点击 ← 返回菜单 重新开始',

  // 剧本特有的文本（指控面板）
  accusePanelHint: '⚠ 你已掌握足够线索 —— 选择要指控的人',
  accusePrefix:    '指控',
};

// ───────────────────────────────────────────
// NPC
// ───────────────────────────────────────────

export const NPCS: EldranNPC[] = [
  { id: 'selene', name: '塞莱娜', subtitle: '冷艳女骑士', color: '#7ec8ff', sigil: '🛡️' },
  { id: 'lilia',  name: '莉莉娅', subtitle: '温柔神官',   color: '#ffb3d9', sigil: '🌸' },
  { id: 'vivian', name: '薇薇安', subtitle: '神秘魔法师', color: '#c8a2ff', sigil: '🔮' },
];

// ───────────────────────────────────────────
// Topics
// ───────────────────────────────────────────

export const TOPICS: TopicBase[] = [
  { id: 'greet_selene', label: '与塞莱娜搭话' },
  { id: 'greet_lilia',  label: '与莉莉娅搭话' },
  { id: 'greet_vivian', label: '与薇薇安搭话' },

  { id: 'guardian',  label: '守护者' },
  { id: 'healer',    label: '治愈者' },
  { id: 'summoner',  label: '召唤者' },
  { id: 'contract',  label: '契约' },

  { id: 'bloodoath', label: '血誓' },
  { id: 'sacrifice', label: '献祭' },
  { id: 'forbidden', label: '禁忌' },

  { id: 'ritual',    label: '月光仪式' },
  { id: 'betrayer',  label: '叛徒' },
  { id: 'truename',  label: '真名' },
];

// ───────────────────────────────────────────
// Dialogues
// ───────────────────────────────────────────

export const DIALOGUES: DialogueBase[] = [
  // === 自我介绍（用 greet_X 话题触发）===
  {
    id: 'selene.greet',
    speaker: 'selene', topic: 'greet_selene',
    text: '骑士单膝跪地，金属护甲发出清冷碰响。\n「吾主，臣塞莱娜以剑之名，誓为您的【守护者】。无论此地是何方，请将后背交予我。」',
    effect: addTopic('guardian'),
  },
  {
    id: 'lilia.greet',
    speaker: 'lilia', topic: 'greet_lilia',
    text: '神官双手交叠胸前，垂眸微笑。\n「主上......莉莉娅愿做您的【治愈者】。这片土地疾病横行，请相信我手中的圣光。我们之间......早已有了【契约】。」',
    effect: all(addTopic('healer'), addTopic('contract')),
  },
  {
    id: 'vivian.greet',
    speaker: 'vivian', topic: 'greet_vivian',
    text: '魔法师斜倚法杖，紫眸中燃着妖异的火。\n「呵......终于醒了，我的小可爱。是我把你拖进这个世界的，所以我才是你真正的【召唤者】。别听她们瞎说。」',
    effect: addTopic('summoner'),
  },

  // === 第 1 层 ===
  {
    id: 'selene.healer', speaker: 'selene', topic: 'healer',
    text: '「莉莉娅那女人......她对您唱的圣咏不是治愈，是【献祭】。我亲眼见她在月下采血。」',
    effect: addTopic('sacrifice'),
  },
  {
    id: 'selene.summoner', speaker: 'selene', topic: 'summoner',
    text: '「她确实是召唤者。但召唤的代价 —— 是您身上的【印记】，那是禁忌的痕迹。」',
    effect: addTopic('forbidden'),
  },
  {
    id: 'lilia.guardian', speaker: 'lilia', topic: 'guardian',
    text: '「塞莱娜骑士......她隐瞒了【血誓】的事。立下血誓的骑士，会优先服从誓约的真正主人 —— 而不是您。」',
    effect: addTopic('bloodoath'),
  },
  {
    id: 'lilia.summoner', speaker: 'lilia', topic: 'summoner',
    text: '「召唤异世界灵魂的法术被神殿明令【禁忌】。薇薇安是罪人。」',
    effect: addTopic('forbidden'),
  },
  {
    id: 'vivian.guardian', speaker: 'vivian', topic: 'guardian',
    text: '「她对您立过【血誓】 —— 一旦血誓主人现身，她会毫不犹豫斩了您。」',
    effect: addTopic('bloodoath'),
  },

  // === 第 2 层 ===
  {
    id: 'selene.sacrifice', speaker: 'selene', topic: 'sacrifice',
    text: '「献祭仪式需要三样：圣女的血、魔法师的咒、以及主祭者的【真名】。逼她们说出真名，叛徒就藏不住了。」',
    effect: all(addTopic('truename'), addTopic('betrayer')),
  },
  {
    id: 'selene.forbidden', speaker: 'selene', topic: 'forbidden',
    text: '「禁忌之术......那是契约篡改。被篡改的契约会让您忘记【真名】—— 这就是您醒来什么都不记得的原因。」',
    effect: addTopic('truename'),
  },
  {
    id: 'lilia.bloodoath', speaker: 'lilia', topic: 'bloodoath',
    text: '「血誓需要鲜血与誓主的【真名】共同封印。当您想起真名时，谁立过血誓便会暴露。」',
    effect: addTopic('truename'),
  },
  {
    id: 'vivian.sacrifice', speaker: 'vivian', topic: 'sacrifice',
    text: '「献祭？您说【月光仪式】？那是莉莉娅主导的灵魂仪式，要抹去您的【真名】。这就是【叛徒】，找到她。」',
    effect: all(addTopic('ritual'), addTopic('betrayer'), addTopic('truename')),
  },
  {
    id: 'vivian.forbidden', speaker: 'vivian', topic: 'forbidden',
    text: '「禁术里最毒的不是召唤，是篡改。有人篡改了您的记忆契约 —— 要记起【真名】，就得擦掉那道神官的符。」',
    effect: addTopic('truename'),
  },

  // === 终局触发（任一 NPC 问"叛徒"都开启指控）===
  {
    id: 'selene.betrayer', speaker: 'selene', topic: 'betrayer',
    text: '「您终于看清了。指控吧 —— 选择您要指控的那一位。」',
    trigger: has('betrayer'),
    effect: setState('canAccuse', true),
  },
  {
    id: 'lilia.betrayer', speaker: 'lilia', topic: 'betrayer',
    text: '「叛徒......主上，请相信您的直觉。」',
    trigger: has('betrayer'),
    effect: setState('canAccuse', true),
  },
  {
    id: 'vivian.betrayer', speaker: 'vivian', topic: 'betrayer',
    text: '「指控吧。但记住 —— 错了，错的那个会立刻执行最后的仪式。」',
    trigger: has('betrayer'),
    effect: setState('canAccuse', true),
  },
];

// ───────────────────────────────────────────
// Endings
// ───────────────────────────────────────────

export const ENDINGS: EndingBase[] = [
  {
    id: 'true_lilia',
    title: '🌟 真相之夜',
    body: `您指控莉莉娅。神官的笑容凝固 —— 她正是月之裔的暗祭司。
塞莱娜剑横其颈。薇薇安撤去召唤符。
「您的真名是利奥纳德·凡·艾尔德兰 —— 这片土地真正的王。」
—— 真相结局：王者归位。`,
    condition: w => w.custom.accused === 'lilia',
  },
  {
    id: 'harem_selene',
    title: '💔 误会的剑刃',
    body: `您指控塞莱娜。骑士单膝跪下，剑落地。
莉莉娅从背后将您拥入怀中，戴上冰冷的项环。
「主上，从今以后，您再也不必思考了。」
—— 后宫结局：失声的主上。`,
    condition: w => w.custom.accused === 'selene',
  },
  {
    id: 'harem_vivian',
    title: '💔 紫雾中的拥抱',
    body: `您指控薇薇安。紫雾涌起，吞没整个房间。
莉莉娅缓步走向您，手中拿着月光仪式的法器。
—— 后宫结局：被禁锢的主上。`,
    condition: w => w.custom.accused === 'vivian',
  },
];

// ───────────────────────────────────────────
// 初始话题
// ───────────────────────────────────────────

export const INITIAL_TOPICS: string[] = [
  'greet_selene',
  'greet_lilia',
  'greet_vivian',
];
