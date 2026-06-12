# Lexicon · 剧本数据输出规范

你的任务：根据用户描述的故事，输出一段 TypeScript 代码（一个 data.ts 模块），导出 6 个常量。引擎会读取这 6 个常量驱动游戏。

## 输出格式（必须导出这 6 个常量）

```ts
export const TEXTS           // UI 文案
export const NPCS            // 角色数组
export const TOPICS          // 话题数组
export const DIALOGUES       // 对话数组（核心）
export const ENDINGS         // 结局数组
export const INITIAL_TOPICS  // 玩家开局拥有的话题 id 数组（至少 1 个）
```

## 玩法逻辑

玩家选 1 个 Topic → 选 1 个 NPC → 引擎按 `(speaker, topic)` 匹配一条 Dialogue → 播放 text → 应用 effect（如给玩家新 topic、改状态）→ 检查 ENDINGS 中是否有 condition 满足 → 满足则进入结局。

## ID 规则

- 全局唯一（NPC、Topic、Dialogue、Ending 共用同一命名空间）
- 字符集：小写字母、数字、`_`、`.`、`-`
- Dialogue id 推荐用 `<speaker>.<topic>` 格式

## 可用的辅助函数

引擎会注入这些函数，你直接调用即可：

| 用途 | 函数 |
|---|---|
| 触发条件 | `has(topicId)` `asked(dialogueId)` `stateEq(key, val)` `and(...)` `or(...)` `not(p)` |
| 副作用 | `addTopic(id)` `removeTopic(id)` `setState(key, val)` `all(...)` |

字段说明：
- `trigger`：函数返回 true 时本条 Dialogue 才能命中。不写=默认通过。
- `effect`：本条 Dialogue 命中后执行的副作用。不写=无副作用。
- `once`：默认 true，本条只能触发一次；设 false 可反复触发。

## 文本高亮

text 中 `【XXX】` 会自动高亮。**必须**：
1. `XXX` 完全等于某个 Topic 的 label
2. 本条 Dialogue 的 effect 中**必须**包含对应 `addTopic('对应id')`，否则玩家看到高亮但话题没入库

## 不变式

- 所有 `speaker` 引用的 id 必须出现在 NPCS
- 所有 `topic` 引用的 id 必须出现在 TOPICS
- 所有 `addTopic / removeTopic / has` 引用的 id 必须出现在 TOPICS
- `INITIAL_TOPICS` 中每项必须出现在 TOPICS
- 至少 1 条合法路径能让某个 Ending 的 condition 变为 true
- 玩家任意状态下都不应卡死（至少有 1 个可触发 Dialogue，除非已抵达结局）

## 自定义字段

NPC、Topic 可以扩展字段（例如 NPC 加 `color`、`sigil`、`subtitle`）。引擎会读，渲染由其它层负责，但你必须确认字段名与项目约定一致——若用户没指定，按下面参考例子的字段集走。

## 参考例子（艾尔德兰之夜，完整可用）

```ts
import { has, all, addTopic, setState } from '../../base/helpers';
import { NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts } from '../../base/types';

export interface EldranNPC extends NPCBase {
  color: string;
  sigil: string;
  subtitle: string;
}

export const TEXTS: ScriptTexts = {
  introHint:      '你睁开眼，烛光摇曳。三个身影站在床边 ——\n[ 提示 ] 在话题本中点选「与XX搭话」开始你的探索。',
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

export const NPCS: EldranNPC[] = [
  { id: 'selene', name: '塞莱娜', subtitle: '冷艳女骑士', color: '#7ec8ff', sigil: '🛡️' },
  { id: 'lilia',  name: '莉莉娅', subtitle: '温柔神官',   color: '#ffb3d9', sigil: '🌸' },
  { id: 'vivian', name: '薇薇安', subtitle: '神秘魔法师', color: '#c8a2ff', sigil: '🔮' },
];

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

export const DIALOGUES: DialogueBase[] = [
  // 自我介绍：用 greet_X 触发
  {
    id: 'selene.greet',
    speaker: 'selene', topic: 'greet_selene',
    text: '骑士单膝跪地。\n「吾主，臣塞莱娜以剑之名，誓为您的【守护者】。」',
    effect: addTopic('guardian'),
  },
  {
    id: 'lilia.greet',
    speaker: 'lilia', topic: 'greet_lilia',
    text: '神官垂眸微笑。\n「主上......莉莉娅愿做您的【治愈者】。我们之间......早已有了【契约】。」',
    effect: all(addTopic('healer'), addTopic('contract')),
  },
  {
    id: 'vivian.greet',
    speaker: 'vivian', topic: 'greet_vivian',
    text: '魔法师斜倚法杖。\n「是我把你拖进这个世界的，所以我才是你真正的【召唤者】。」',
    effect: addTopic('summoner'),
  },

  // 第 1 层：交叉询问
  {
    id: 'selene.healer', speaker: 'selene', topic: 'healer',
    text: '「莉莉娅那女人......她对您唱的圣咏不是治愈，是【献祭】。」',
    effect: addTopic('sacrifice'),
  },
  {
    id: 'lilia.guardian', speaker: 'lilia', topic: 'guardian',
    text: '「塞莱娜骑士......她隐瞒了【血誓】的事。」',
    effect: addTopic('bloodoath'),
  },

  // 第 2 层：关键路径
  {
    id: 'vivian.sacrifice', speaker: 'vivian', topic: 'sacrifice',
    text: '「献祭？您说【月光仪式】？那是莉莉娅主导的灵魂仪式，要抹去您的【真名】。这就是【叛徒】。」',
    effect: all(addTopic('ritual'), addTopic('betrayer'), addTopic('truename')),
  },

  // 终局触发：必须先有 betrayer 才能进入指控环节
  {
    id: 'selene.betrayer', speaker: 'selene', topic: 'betrayer',
    text: '「您终于看清了。指控吧。」',
    trigger: has('betrayer'),
    effect: setState('canAccuse', true),
  },
  {
    id: 'lilia.betrayer', speaker: 'lilia', topic: 'betrayer',
    text: '「叛徒......请相信您的直觉。」',
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

export const ENDINGS: EndingBase[] = [
  {
    id: 'true_lilia',
    title: '🌟 真相之夜',
    body: '您指控莉莉娅。神官的笑容凝固 —— 她正是月之裔的暗祭司。\n—— 真相结局：王者归位。',
    condition: w => w.custom.accused === 'lilia',
  },
  {
    id: 'harem_selene',
    title: '💔 误会的剑刃',
    body: '您指控塞莱娜。骑士单膝跪下，剑落地。\n—— 后宫结局：失声的主上。',
    condition: w => w.custom.accused === 'selene',
  },
  {
    id: 'harem_vivian',
    title: '💔 紫雾中的拥抱',
    body: '您指控薇薇安。紫雾涌起，吞没整个房间。\n—— 后宫结局：被禁锢的主上。',
    condition: w => w.custom.accused === 'vivian',
  },
];

export const INITIAL_TOPICS: string[] = [
  'greet_selene',
  'greet_lilia',
  'greet_vivian',
];
```

## 输出要求

- 直接输出 TypeScript 代码块，不要解释
- import 语句保留原样（`from '../../base/helpers'` 和 `from '../../base/types'`）
- 6 个常量必须全部 export
- 提交前自查 4 项：id 唯一、引用合法、可达结局、无死局
