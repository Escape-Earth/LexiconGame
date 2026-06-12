// ==========================================================================
// scripts/eldran/data.ts —— 艾尔德兰之夜 · 数据
//
// 完全恢复自 prototypes/eldran-night/script.js v1 原版剧本。
// 仅做以下最小架构适配（不改剧情）：
//   1. 加 greet_selene/lilia/vivian 三个初始话题（用 ask 替代 v1 的 approach）
//   2. v1 中"接近"时的 intro 与 unlock，迁移为 greet 对话条目的 effect
//   3. v1 中的 __READY_ACCUSE__ 魔法字符串，用 setState('canAccuse', true) 等价表达
// 其余台词、话题、结局原文一字不改。
// ==========================================================================

import { has, addTopic, all, setState } from '../../base/helpers';
import { NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts } from '../../base/types';

// ───────────────────────────────────────────
// 剧本扩展类型
// ───────────────────────────────────────────

export interface EldranNPC extends NPCBase {
  color: string;
  sigil: string;
  subtitle: string;
}

// ───────────────────────────────────────────
// 文本常量
// ───────────────────────────────────────────

export const TEXTS: ScriptTexts = {
  introHint:      '你睁开眼，烛光摇曳。三个身影站在床边 ——\n\n[ 提示 ] 在话题本中点选「醒来」，分别向她们三人询问，开始你的探索。',
  hintIdle:       '在话题本中选一个话题，然后点 NPC 进行质问',
  hintSelected:   '已选 「{topic}」 —— 点 NPC 质问',
  hintEnded:      '已结束 · 点 ← 返回菜单 重玩',
  cancelLabel:    '取消',
  silentReply:    '{npc} 沉默了一会，似乎对「{topic}」一无所知。',
  newTopicsFlash: '✨ 新话题入库：{topics}',
  endingFooter:   '点击 ← 返回菜单 重新开始',

  accusePanelHint: '⚠ 你已掌握足够线索 —— 选择要指控的人',
  accusePrefix:    '指控',
};

// ───────────────────────────────────────────
// NPC（v1 原版）
// ───────────────────────────────────────────

export const NPCS: EldranNPC[] = [
  { id: 'selene', name: '塞莱娜', subtitle: '冷艳女骑士', color: '#7ec8ff', sigil: '🛡️' },
  { id: 'lilia',  name: '莉莉娅', subtitle: '温柔神官',   color: '#ffb3d9', sigil: '🌸' },
  { id: 'vivian', name: '薇薇安', subtitle: '神秘魔法师', color: '#c8a2ff', sigil: '🔮' },
];

// ───────────────────────────────────────────
// Topics（v1 原版 12 个 + 3 个 greet 初始话题）
// ───────────────────────────────────────────

export const TOPICS: TopicBase[] = [
  // 初始话题（玩家醒来时唯一持有的话题，用来触发任意 NPC 的自我介绍）
  { id: 'wake_up', label: '醒来' },

  // 第 0 层
  { id: 'guardian',  label: '守护者' },
  { id: 'healer',    label: '治愈者' },
  { id: 'summoner',  label: '召唤者' },
  { id: 'contract',  label: '契约' },

  // 第 1 层
  { id: 'bloodoath', label: '血誓' },
  { id: 'sacrifice', label: '献祭' },
  { id: 'forbidden', label: '禁忌' },
  { id: 'sigil',     label: '印记' },

  // 第 2 层
  { id: 'ritual',    label: '月光仪式' },
  { id: 'betrayer',  label: '叛徒' },
  { id: 'truename',  label: '真名' },
];

// ───────────────────────────────────────────
// Dialogues（v1 原版 33 条 + 3 条 greet 自我介绍）
// ───────────────────────────────────────────

export const DIALOGUES: DialogueBase[] = [
  // ════════════════════════════════════════════════════════
  // 自我介绍（用「醒来」话题问任意 NPC 触发自我介绍；台词与解锁与 v1 的 approach 完全一致）
  // ════════════════════════════════════════════════════════
  {
    id: 'selene.wake_up',
    speaker: 'selene', topic: 'wake_up',
    text: '骑士单膝跪地，金属护甲发出清冷碰响。\n「吾主，臣塞莱娜以剑之名，誓为您的【守护者】。无论此地是何方，请将后背交予我。」',
    effect: addTopic('guardian'),
  },
  {
    id: 'lilia.wake_up',
    speaker: 'lilia', topic: 'wake_up',
    text: '神官双手交叠胸前，垂眸微笑。\n「主上......莉莉娅愿做您的【治愈者】。这片土地疾病横行，请相信我手中的圣光。我们之间......早已有了【契约】。」',
    effect: all(addTopic('healer'), addTopic('contract')),
  },
  {
    id: 'vivian.wake_up',
    speaker: 'vivian', topic: 'wake_up',
    text: '魔法师斜倚法杖，紫眸中燃着妖异的火。\n「呵......终于醒了，我的小可爱。是我把你拖进这个世界的，所以我才是你真正的【召唤者】。别听她们瞎说。」',
    effect: addTopic('summoner'),
  },

  // ════════════════════════════════════════════════════════
  // 塞莱娜（v1 原版 11 条）
  // ════════════════════════════════════════════════════════
  {
    id: 'selene.guardian', speaker: 'selene', topic: 'guardian',
    text: '「【守护者】是我对您许下的誓。但......那个魔法师不可信，她口中的【召唤】不过是禁断之术。」\n塞莱娜按着剑柄，目光锐利。',
  },
  {
    id: 'selene.healer', speaker: 'selene', topic: 'healer',
    text: '「莉莉娅那女人......她对您唱的圣咏不是治愈，是【献祭】。我亲眼见她在月下采血。」\n骑士声音压低。',
    effect: addTopic('sacrifice'),
  },
  {
    id: 'selene.summoner', speaker: 'selene', topic: 'summoner',
    text: '「她确实是召唤者，这点我不否认。但召唤的代价 —— 是您身上的【印记】。」\n塞莱娜伸手似要触碰您的胸口又收回。',
    effect: addTopic('sigil'),
  },
  {
    id: 'selene.contract', speaker: 'selene', topic: 'contract',
    text: '「契约？吾主，您与我之间没有契约 —— 只有誓言。但您与那两人之间......胸口的【印记】会在月圆时灼烧，那便是契约的烙痕。」',
    effect: addTopic('sigil'),
  },
  {
    id: 'selene.bloodoath', speaker: 'selene', topic: 'bloodoath',
    text: '「血誓？您从哪里听来的？......那是骑士对誓主的最高约束。我未曾立下，因为吾主不需要锁链。」\n她的眼神有一瞬动摇。',
  },
  {
    id: 'selene.sacrifice', speaker: 'selene', topic: 'sacrifice',
    text: '「献祭仪式需要三样：圣女的血、魔法师的咒、以及主祭者的【真名】。如果您能逼她们说出真名 —— 那个真正的叛徒就藏不住了。」',
    effect: addTopic('truename'),
  },
  {
    id: 'selene.forbidden', speaker: 'selene', topic: 'forbidden',
    text: '「禁忌之术......那是只有大魔法师能施展的契约篡改。吾主，请记住一件事：被篡改的契约，会让您忘记【真名】。这就是为什么您醒来什么都不记得。」',
    effect: addTopic('truename'),
  },
  {
    id: 'selene.sigil', speaker: 'selene', topic: 'sigil',
    text: '「您胸口的印记是双重的 —— 一层是召唤的符文，一层是契约的封印。它们叠在一起，是有人故意混淆。」',
  },
  {
    id: 'selene.ritual', speaker: 'selene', topic: 'ritual',
    text: '「月光仪式是莉莉娅主持的。她说那是治愈仪式，但......」\n塞莱娜咬牙。\n「那一晚，您昏迷了三天三夜。」',
  },
  {
    id: 'selene.betrayer', speaker: 'selene', topic: 'betrayer',
    text: '「您终于看清了。叛徒不止一人 —— 但执剑指向您喉咙的那个，只有一个。」\n骑士拔剑，剑尖指向地面。\n「您准备好指控了吗？」',
    effect: setState('canAccuse', true),
  },
  {
    id: 'selene.truename', speaker: 'selene', topic: 'truename',
    text: '「我的真名 —— 是塞莱娜·凡·艾尔德兰。我以艾尔德兰王室之名起誓，从未背叛过您。」',
  },

  // ════════════════════════════════════════════════════════
  // 莉莉娅（v1 原版 11 条）
  // ════════════════════════════════════════════════════════
  {
    id: 'lilia.guardian', speaker: 'lilia', topic: 'guardian',
    text: '「塞莱娜骑士......她剑术高超，但她隐瞒了【血誓】的事。一个立下血誓的骑士，会优先服从誓约的真正主人 —— 而不是您。」\n神官轻叹。',
    effect: addTopic('bloodoath'),
  },
  {
    id: 'lilia.healer', speaker: 'lilia', topic: 'healer',
    text: '「主上的伤痛，唯莉莉娅能解。圣光的代价是信任 —— 您愿信我吗？」\n她伸出手，掌心温暖。',
  },
  {
    id: 'lilia.summoner', speaker: 'lilia', topic: 'summoner',
    text: '「薇薇安召唤了您，没错。但召唤本身是【禁忌】 —— 任何召唤异世界灵魂的法术都被神殿明令禁止。她是罪人。」',
    effect: addTopic('forbidden'),
  },
  {
    id: 'lilia.contract', speaker: 'lilia', topic: 'contract',
    text: '「我与您的契约，是灵魂层面的。」\n莉莉娅垂眸。\n「但所有的契约都需要【印记】见证。您胸口的印记里，有一笔是我画的 —— 这是约定。」',
  },
  {
    id: 'lilia.bloodoath', speaker: 'lilia', topic: 'bloodoath',
    text: '「血誓需要鲜血与誓主的【真名】共同封印。所以......当您想起自己的真名时，谁立过血誓便会暴露。」',
    effect: addTopic('truename'),
  },
  {
    id: 'lilia.sacrifice', speaker: 'lilia', topic: 'sacrifice',
    text: '「献祭？！主上，那是异端才做的事，圣殿严令禁止！是塞莱娜告诉您的吗？她在污蔑我！」\n神官第一次提高了声音。',
  },
  {
    id: 'lilia.forbidden', speaker: 'lilia', topic: 'forbidden',
    text: '「禁忌召唤之所以是禁忌，是因为它会在召唤者与被召唤者之间留下一条无法切断的【血誓】。薇薇安立下了血誓 —— 所以她无法伤害您。但......能伤害您的，是另一个没立血誓的人。」',
    effect: addTopic('bloodoath'),
  },
  {
    id: 'lilia.sigil', speaker: 'lilia', topic: 'sigil',
    text: '「印记是约束符文。三层叠加 —— 骑士的誓约、神官的契约、魔法师的召唤符。最强的那一层 —— 才是真正控制您的人。」',
  },
  {
    id: 'lilia.ritual', speaker: 'lilia', topic: 'ritual',
    text: '「月光仪式是为了稳固您的灵魂。您醒来时记忆模糊，正是因为仪式没完成 —— 有人打断了它。」\n莉莉娅的眼神飘忽。',
  },
  {
    id: 'lilia.betrayer', speaker: 'lilia', topic: 'betrayer',
    text: '「叛徒......主上，请相信您的直觉。能在月下出剑的人，能调换药剂的人，不会是无名之辈。」\n神官闭目祈祷。',
    effect: setState('canAccuse', true),
  },
  {
    id: 'lilia.truename', speaker: 'lilia', topic: 'truename',
    text: '「我的真名是莉莉娅·赛蕾娜·艾文。圣殿登记在案，从未隐瞒。」',
  },

  // ════════════════════════════════════════════════════════
  // 薇薇安（v1 原版 11 条）
  // ════════════════════════════════════════════════════════
  {
    id: 'vivian.guardian', speaker: 'vivian', topic: 'guardian',
    text: '「她？哼，剑士不过是肉盾。但她对您立过【血誓】 —— 这倒是真的。一旦血誓主人现身，她会毫不犹豫斩了您。」\n薇薇安轻笑。',
    effect: addTopic('bloodoath'),
  },
  {
    id: 'vivian.healer', speaker: 'vivian', topic: 'healer',
    text: '「圣光？呵，你以为那是治愈？她在用您的灵魂给自己延寿。每一次"治疗"，您就少活十天。」',
  },
  {
    id: 'vivian.summoner', speaker: 'vivian', topic: 'summoner',
    text: '「是我把您拽到这个世界的，没什么好否认。但召唤者的代价是 —— 我必须保护您直到契约结束。所以，我反倒是这里最不可能背叛您的人。」',
  },
  {
    id: 'vivian.contract', speaker: 'vivian', topic: 'contract',
    text: '「契约？您身上有三道契约：我的召唤符、神官的灵魂约、骑士的剑誓。而骑士的那道 —— 不是和您签的。」\n魔法师缓缓地说。',
  },
  {
    id: 'vivian.bloodoath', speaker: 'vivian', topic: 'bloodoath',
    text: '「血誓的另一端是真正的主人。塞莱娜立的血誓主人不是您 —— 是另一个人，那人正在某处操控这一切。」\n薇薇安眯起眼。',
  },
  {
    id: 'vivian.sacrifice', speaker: 'vivian', topic: 'sacrifice',
    text: '「献祭？您说【月光仪式】？那确实是一场献祭 —— 但献祭的目标不是您，是您的【真名】。神官想用仪式抹去您的真名，让您永远是她的"主上"。」\n薇薇安的语气罕见地严肃。\n「这就是叛徒，找到她。」',
    effect: all(addTopic('ritual'), addTopic('betrayer'), addTopic('truename')),
  },
  {
    id: 'vivian.forbidden', speaker: 'vivian', topic: 'forbidden',
    text: '「禁忌？我承认我用了禁术召唤您，但禁术里最毒的不是召唤 —— 是篡改。有人篡改了您的记忆契约。」',
  },
  {
    id: 'vivian.sigil', speaker: 'vivian', topic: 'sigil',
    text: '「印记里那道神官的符 —— 是篡改契约的源头。把它擦掉，您就能想起【真名】。」',
    effect: addTopic('truename'),
  },
  {
    id: 'vivian.ritual', speaker: 'vivian', topic: 'ritual',
    text: '「月光仪式 —— 那是莉莉娅主导的灵魂仪式。她声称是治愈，但实质是抹除您的【真名】，让您永远困在"主上"的称呼里。这是叛徒的手法。」',
    effect: all(addTopic('betrayer'), addTopic('truename')),
  },
  {
    id: 'vivian.betrayer', speaker: 'vivian', topic: 'betrayer',
    text: '「您终于敢提这个词了。」\n薇薇安站起身，紫袍下的法阵亮起。\n「现在，做出您的指控吧。但记住 —— 一旦指控错误，错的那个人会立刻执行最后的仪式。」',
    effect: setState('canAccuse', true),
  },
  {
    id: 'vivian.truename', speaker: 'vivian', topic: 'truename',
    text: '「我的真名是薇薇安·诺克斯·暮影。我立下召唤誓时已自报真名。如果您还记得起自己的真名 —— 您会发现，那才是这场闹剧的钥匙。」',
  },
];

// ───────────────────────────────────────────
// Endings（v1 原版 3 条，正文一字不改）
// ───────────────────────────────────────────

export const ENDINGS: EndingBase[] = [
  {
    id: 'true_lilia',
    title: '🌟 真相之夜',
    body: `您指向莉莉娅。

神官的笑容凝固了。她身后的圣光熄灭，露出真正的面孔 —— 月之裔的暗祭司。

「......您怎么会想起来的？」她苦笑。

塞莱娜的剑横在她颈间。薇薇安的法阵将她封印。

「您的真名，是【利奥纳德·凡·艾尔德兰】 —— 这片土地真正的王。」
塞莱娜跪下。
「臣的血誓，从来都是对您一人。」

薇薇安挥手撤去召唤符。
「契约结束。要回去 —— 还是留下？」

—— 真相结局：王者归位
—— 您解锁了选择权。`,
    condition: w => w.custom.accused === 'lilia',
  },
  {
    id: 'harem_selene',
    title: '💔 误会的剑刃',
    body: `您指向塞莱娜。

骑士单膝跪地，剑递到您面前。
「......若主上认定，臣无怨。」

她的剑落地。一声轻响。

下一秒，莉莉娅从背后将您拥入怀中，温柔地为您戴上一枚冰冷的项环。

「主上，从今以后，您再也不必思考了。」

魔法师薇薇安在远处冷笑，转身消失在紫雾中。

—— 您永远地留在了艾尔德兰。
—— 后宫结局：失声的主上`,
    condition: w => w.custom.accused === 'selene',
  },
  {
    id: 'harem_vivian',
    title: '💔 紫雾中的拥抱',
    body: `您指向薇薇安。

魔法师怔了一下，随即笑了。
「呵......好吧。既然主上这样想 —— 」

她的法阵轰然展开。塞莱娜的剑刺向她，却被无形屏障弹开。莉莉娅在一旁微笑着看着这一切。

紫雾涌起，吞没整个房间。

「真正的叛徒就在您身边，而您选择了我。」薇薇安的声音渐渐远去。
「下次见面 —— 我会救您出去的。」

随即一切归于寂静。莉莉娅缓步走向您，手中拿着月光仪式的法器。

—— 后宫结局：被禁锢的主上`,
    condition: w => w.custom.accused === 'vivian',
  },
];

// ───────────────────────────────────────────
// 初始话题
// ───────────────────────────────────────────

export const INITIAL_TOPICS: string[] = [
  'wake_up',
];
