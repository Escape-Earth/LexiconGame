# Lexicon · 剧本编写规范（AI Writer 版）

> **职责**：填写 `scripts/<your-script>/data.ts`。其它文件不要碰。

## 玩法本质

玩家选 Topic → 选 NPC → 触发 Dialogue → Dialogue 给玩家新 Topic 或改状态 → 状态满足某 Ending.condition → 结局。

## 必填导出（6 个常量）

```ts
export const TEXTS: ScriptTexts          // UI 文案模板
export const NPCS: NPCBase[]             // 角色
export const TOPICS: TopicBase[]         // 话题
export const DIALOGUES: DialogueBase[]   // 对话条目
export const ENDINGS: EndingBase[]       // 结局
export const INITIAL_TOPICS: string[]    // 玩家开局拥有的 topic id 数组（至少 1 个）
```

## ID 规则

- 全局唯一（NPC/Topic/Dialogue/Ending 共用一个命名空间）
- 字符集：`[a-z0-9_.-]`，小写
- Dialogue 推荐命名：`<speaker>.<topic>`

## 数据结构

```ts
NPC      = { id, name, ...剧本扩展字段 }
Topic    = { id, label }
Dialogue = { id, speaker, topic, text, trigger?, effect?, once? }
Ending   = { id, title?, body, condition }
```

## 触发与副作用（从 `base/helpers` 引入）

```ts
import { has, asked, stateEq, and, or, not, addTopic, removeTopic, setState, all } from '../../base/helpers';
```

| 类型 | 函数 | 含义 |
|---|---|---|
| Predicate | `has(topicId)` | 玩家拥有此 topic |
| Predicate | `asked(dialogueId)` | 已触发过此 dialogue |
| Predicate | `stateEq(key, val)` | `world.custom[key] === val` |
| Predicate | `and(...) / or(...) / not(p)` | 组合 |
| Effect | `addTopic(id)` | 加 topic |
| Effect | `removeTopic(id)` | 移除 topic |
| Effect | `setState(key, val)` | 设 `world.custom[key] = val` |
| Effect | `all(...effects)` | 组合 |

不写 `trigger` = 默认通过。不写 `effect` = 无副作用。`once` 默认 `true`。

## 文本高亮规则

`text` 中 `【某Topic.label】` 会被自动高亮渲染。**高亮仅是视觉**，不会自动入库——必须配 `effect: addTopic('对应id')` 才真的入库。

**约定**：text 中出现的【方括号词】必须严格等于某个 `Topic.label`，且对应 `addTopic` 必须存在于本条 effect。

## Endings 触发

引擎在每次 dialogue 执行后扫描 ENDINGS，第一个 `condition(world)` 为 true 的胜出。多结局靠列表顺序决定优先级（罕见/特殊在前，宽松在后）。

## TEXTS 占位符

```ts
{
  introHint:      string,  // 开场系统消息
  hintIdle:       string,  // 未选话题时的引导
  hintSelected:   string,  // 已选话题时引导，可用 {topic}
  hintEnded:      string,
  cancelLabel:    string,
  silentReply:    string,  // 无对话命中时，可用 {npc} {topic}
  newTopicsFlash: string,  // 新话题入库提示，可用 {topics}
  endingFooter:   string,
  // 任意自定义 key 由剧本逻辑层使用（如 accusePanelHint）
}
```

## 不变式（违反即报错）

1. 所有 `Dialogue.speaker` 必须存在于 `NPCS`
2. 所有 `Dialogue.topic` 必须存在于 `TOPICS`
3. 所有 `addTopic / removeTopic / has` 引用的 id 必须存在于 `TOPICS`
4. `INITIAL_TOPICS` 中每个 id 必须存在于 `TOPICS`
5. 所有 id 全局唯一
6. 至少有 1 条 Ending 在合法路径下可达

## 自检清单（提交前必跑）

1. **可达性**：从 `INITIAL_TOPICS` 出发，存在一条 dialogue 链能解锁某 ending 的 condition
2. **无死局**：玩家任何状态下，都至少有一个可触发的 dialogue（除非已到 ending）
3. **方括号一致性**：每个 `【X】` 在 `TOPICS` 中都有 `label === 'X'`，且本条 effect 含对应 `addTopic`
4. **去重**：所有 id 唯一

## 自定义字段

剧本可以扩展 `NPCBase` / `TopicBase` 等添加字段，例如：

```ts
export interface MyNPC extends NPCBase {
  emoji: string;
  faction: 'red' | 'blue';
}
export const NPCS: MyNPC[] = [...];
```

扩展字段是否被渲染由 `logic.ts` 中的视图钩子决定，不归你管。但你提供数据时要保证字段名一致、类型正确。

## 最小骨架

```ts
import { has, all, addTopic, setState } from '../../base/helpers';
import { NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts } from '../../base/types';

export const TEXTS: ScriptTexts = {
  introHint: '...',
  hintIdle: '...',
  hintSelected: '已选「{topic}」—— 点 NPC',
  hintEnded: '已结束',
  silentReply: '{npc} 对「{topic}」无话可说。',
  newTopicsFlash: '✨ 新话题：{topics}',
};

export const NPCS: NPCBase[] = [
  { id: 'a', name: 'A' },
];

export const TOPICS: TopicBase[] = [
  { id: 'start', label: '起手' },
  { id: 'next',  label: '下一步' },
];

export const DIALOGUES: DialogueBase[] = [
  {
    id: 'a.start',
    speaker: 'a',
    topic: 'start',
    text: '「这里有【下一步】可以问。」',
    effect: addTopic('next'),
  },
  {
    id: 'a.next',
    speaker: 'a',
    topic: 'next',
    text: '「好，结束。」',
    effect: setState('done', true),
  },
];

export const ENDINGS: EndingBase[] = [
  {
    id: 'finish',
    title: '完结',
    body: '完。',
    condition: w => w.custom.done === true,
  },
];

export const INITIAL_TOPICS: string[] = ['start'];
```
